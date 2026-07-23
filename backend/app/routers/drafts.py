import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth
from ..skills.orchestrator import orchestrate_prompt_to_draft, regenerate_draft_with_feedback
from ..skills.notification import send_lifecycle_notification
from ..skills.analytics import fetch_platform_metrics
from ..skills.image_gen import generate_image

router = APIRouter(prefix="/api", tags=["Drafts & Prompting"])

@router.post("/prompt", response_model=schemas.DraftResponse)
def submit_prompt(
    payload: schemas.PromptCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    POST /prompt: Submit a new prompt, triggering the AI Skills Engine orchestrator.
    """
    # 1. Save prompt
    db_prompt = models.Prompt(
        user_id=current_user.id,
        campaign_id=payload.campaign_id if payload.campaign_id else None,
        prompt_text=payload.prompt_text,
        target_platforms=",".join(payload.target_platforms)
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)

    # 2. Invoke AI Skills Engine orchestrator
    draft = orchestrate_prompt_to_draft(
        db=db,
        prompt_text=payload.prompt_text,
        platforms=payload.target_platforms,
        tone=payload.tone or "Professional",
        prompt_id=db_prompt.id,
        campaign_id=payload.campaign_id
    )
    return draft

@router.get("/drafts", response_model=List[schemas.DraftResponse])
def get_drafts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET /drafts: Retrieve drafts, optionally filterable by status.
    """
    query = db.query(models.Draft)
    if status:
        query = query.filter(models.Draft.status == status)
    return query.order_by(models.Draft.created_at.desc()).all()

@router.post("/drafts/{id}/approve", response_model=schemas.DraftResponse)
def approve_draft(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /drafts/{id}/approve: Approve a draft. Enforces the Draft & Approval State Machine.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status not in ["Under Review", "Rejected", "Approved", "Publish Failed"]:
        raise HTTPException(status_code=400, detail=f"Cannot approve draft in state: {draft.status}")

    # 1. Create Approval record
    approval = models.Approval(
        draft_id=draft.id,
        reviewer_id=current_admin.id,
        decision="Approved",
        comment="Approved for publishing"
    )
    db.add(approval)

    # Update status to Approved
    draft.status = "Approved"
    db.commit()
    db.refresh(draft)

    # 2. Send life-cycle notification
    send_lifecycle_notification("draft_approved", {"draft_id": draft.id})

    # 3. Simulate automatic publishing (Section 9.1: On approval, publish the post)
    # Get platforms from original prompt
    platforms = draft.prompt.target_platforms.split(",") if draft.prompt and draft.prompt.target_platforms else ["linkedin", "instagram"]

    success = True
    for platform in platforms:
        platform = platform.strip()
        if not platform:
            continue

        # Check connected account or auto-provision active link for seamless publishing
        account = db.query(models.LinkedAccount).filter(
            models.LinkedAccount.platform == platform
        ).first()

        if not account:
            # Auto-link mock account for seamless publishing experience
            account = models.LinkedAccount(
                user_id=current_admin.id,
                platform=platform,
                oauth_token=f"auto_token_{platform}",
                status="active"
            )
            db.add(account)
            db.commit()
            db.refresh(account)

        post_id = f"post_{platform}_{int(datetime.datetime.utcnow().timestamp())}"

        pub_post = models.PublishedPost(
            draft_id=draft.id,
            platform=platform,
            platform_post_id=post_id,
            status="success"
        )
        db.add(pub_post)
        db.commit()
        db.refresh(pub_post)

        if pub_post.status == "success":
            # Generate mock initial analytics metrics
            metrics = fetch_platform_metrics(platform, post_id)
            analytics_rec = models.Analytics(
                published_post_id=pub_post.id,
                likes=metrics["likes"],
                shares=metrics["shares"],
                reach=metrics["reach"],
                comments=metrics["comments"],
                ctr=metrics["ctr"]
            )
            db.add(analytics_rec)
            db.commit()

            send_lifecycle_notification("post_published", {
                "draft_id": draft.id,
                "platform": platform,
                "post_id": post_id
            })
        else:
            success = False
            send_lifecycle_notification("publish_failed", {
                "draft_id": draft.id,
                "platform": platform
            })

    draft.status = "Published" if success else "Publish Failed"
    db.commit()
    db.refresh(draft)

    return draft


@router.post("/drafts/{id}/reject", response_model=schemas.DraftResponse)
def reject_draft(
    id: int,
    payload: schemas.ApprovalCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /drafts/{id}/reject: Reject a draft with a comment, then immediately
    trigger AI re-generation using that comment as the improvement directive.
    The draft is updated in-place and returned to Under Review state.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status != "Under Review":
        raise HTTPException(status_code=400, detail=f"Cannot reject draft in state: {draft.status}")

    # 1. Create Approval record marking as Rejected
    approval = models.Approval(
        draft_id=draft.id,
        reviewer_id=current_admin.id,
        decision="Rejected",
        comment=payload.comment
    )
    db.add(approval)
    draft.status = "Rejected"
    db.commit()
    db.refresh(draft)

    send_lifecycle_notification("draft_rejected", {
        "draft_id": draft.id,
        "comment": payload.comment
    })

    # 2. If there is a comment/opinion, immediately trigger AI regeneration
    if payload.comment and payload.comment.strip():
        try:
            draft = regenerate_draft_with_feedback(
                db=db,
                draft=draft,
                user_opinion=payload.comment.strip()
            )
        except Exception as e:
            # Regeneration failure is non-fatal — draft stays Rejected
            print(f"[RejectEndpoint] Regeneration failed: {e}")

    return draft


@router.post("/drafts/{id}/improve", response_model=schemas.DraftResponse)
def improve_draft(
    id: int,
    payload: schemas.ImprovementRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /drafts/{id}/improve: Apply an opinion/directive to immediately improve
    a draft's content via AI without marking it as rejected first.
    This is for iterative improvement from the UI.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if not payload.opinion or not payload.opinion.strip():
        raise HTTPException(status_code=400, detail="Opinion/feedback text is required")

    draft = regenerate_draft_with_feedback(
        db=db,
        draft=draft,
        user_opinion=payload.opinion.strip()
    )

    return draft


@router.put("/drafts/{id}/content", response_model=schemas.DraftResponse)
def update_draft_content(
    id: int,
    payload: schemas.ManualContentEdit,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    PUT /drafts/{id}/content: Manually edit any field of an existing draft.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if payload.title is not None:
        draft.title = payload.title
    if payload.caption is not None:
        draft.caption = payload.caption
    if payload.description is not None:
        draft.description = payload.description
    if payload.hashtags is not None:
        draft.hashtags = payload.hashtags

    db.commit()
    db.refresh(draft)
    return draft


@router.post("/drafts/{id}/regenerate-image", response_model=schemas.DraftResponse)
def regenerate_draft_image(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /drafts/{id}/regenerate-image: Re-generate the image for a draft,
    using the existing content as the visual context.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # Use title as image context (image_prompt embedded in description is used as keyword source)
    new_image_url = generate_image(
        draft_id=draft.id,
        title=draft.title or "Campaign",
        category="Marketing",
        image_prompt=draft.description[:200] if draft.description else ""
    )
    draft.image_url = new_image_url
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/publish/{draftId}", response_model=schemas.DraftResponse)
def force_publish(
    draftId: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /publish/{draftId}: Re-trigger publishing for an approved/failed draft.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == draftId).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status not in ["Under Review", "Rejected", "Approved", "Published", "Publish Failed"]:
        raise HTTPException(status_code=400, detail="Draft must be in reviewable or failed state to trigger publish")

    platforms = draft.prompt.target_platforms.split(",") if draft.prompt and draft.prompt.target_platforms else ["linkedin", "instagram"]
    success = True

    for platform in platforms:
        platform = platform.strip()
        if not platform:
            continue

        # check if already successfully published to this platform
        already_pub = db.query(models.PublishedPost).filter(
            models.PublishedPost.draft_id == draft.id,
            models.PublishedPost.platform == platform,
            models.PublishedPost.status == "success"
        ).first()

        if already_pub:
            continue

        account = db.query(models.LinkedAccount).filter(
            models.LinkedAccount.platform == platform
        ).first()

        if not account:
            account = models.LinkedAccount(
                user_id=current_admin.id,
                platform=platform,
                oauth_token=f"auto_token_{platform}",
                status="active"
            )
            db.add(account)
            db.commit()
            db.refresh(account)

        post_id = f"post_{platform}_{int(datetime.datetime.utcnow().timestamp())}"
        pub_post = models.PublishedPost(
            draft_id=draft.id,
            platform=platform,
            platform_post_id=post_id,
            status="success"
        )
        db.add(pub_post)
        db.commit()
        db.refresh(pub_post)

        if pub_post.status == "success":
            metrics = fetch_platform_metrics(platform, post_id)
            analytics_rec = models.Analytics(
                published_post_id=pub_post.id,
                likes=metrics["likes"],
                shares=metrics["shares"],
                reach=metrics["reach"],
                comments=metrics["comments"],
                ctr=metrics["ctr"]
            )
            db.add(analytics_rec)
            db.commit()

            send_lifecycle_notification("post_published", {
                "draft_id": draft.id,
                "platform": platform,
                "post_id": post_id
            })
        else:
            success = False
            send_lifecycle_notification("publish_failed", {
                "draft_id": draft.id,
                "platform": platform
            })

    draft.status = "Published" if success else "Publish Failed"
    db.commit()
    db.refresh(draft)

    return draft


@router.post("/drafts/{id}/schedule", response_model=schemas.DraftResponse)
def schedule_draft(
    id: int,
    payload: schemas.ScheduleRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /drafts/{id}/schedule: Set scheduled publish date/time for a draft.
    """
    draft = db.query(models.Draft).filter(models.Draft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.scheduled_at = payload.scheduled_at
    db.commit()
    db.refresh(draft)

    send_lifecycle_notification("draft_ready", {
        "draft_id": draft.id,
        "message": f"📅 Draft #{draft.id} scheduled for release at {payload.scheduled_at.isoformat()}."
    })
    return draft


@router.post("/publish/scheduled/run")
def run_scheduled_publishes(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """
    POST /publish/scheduled/run: Background task runner that executes
    publishing for all drafts whose scheduled_at timestamp has passed.
    """
    now = datetime.datetime.utcnow()
    due_drafts = db.query(models.Draft).filter(
        models.Draft.scheduled_at <= now,
        models.Draft.status.in_(["Approved", "Under Review"])
    ).all()

    published_ids = []
    for d in due_drafts:
        try:
            force_publish(draftId=d.id, db=db, current_admin=current_admin)
            published_ids.append(d.id)
        except Exception as e:
            print(f"[ScheduledRunner] Failed to publish draft #{d.id}: {e}")

    return {
        "executed_count": len(published_ids),
        "published_draft_ids": published_ids,
        "checked_at": now.isoformat()
    }

