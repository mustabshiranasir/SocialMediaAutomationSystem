from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/campaigns", tags=["Campaign Management"])

@router.post("", response_model=schemas.CampaignResponse)
def create_campaign(
    payload: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if isinstance(payload.target_platforms, list):
        platforms_str = ",".join(payload.target_platforms)
    else:
        platforms_str = payload.target_platforms or ""

    campaign = models.Campaign(
        user_id=current_user.id,
        name=payload.name,
        target_platforms=platforms_str,
        start_date=payload.start_date,
        end_date=payload.end_date
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.get("", response_model=List[schemas.CampaignResponse])
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaigns = db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).all()
    res = []
    for c in campaigns:
        total_drafts = db.query(models.Draft).filter(models.Draft.campaign_id == c.id).count()
        published_count = db.query(models.Draft).filter(
            models.Draft.campaign_id == c.id,
            models.Draft.status == "Published"
        ).count()
        res.append({
            "id": c.id,
            "name": c.name,
            "target_platforms": c.target_platforms,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "created_at": c.created_at,
            "total_drafts": total_drafts,
            "published_count": published_count
        })
    return res

@router.get("/{id}")
def get_campaign_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    drafts = db.query(models.Draft).filter(models.Draft.campaign_id == campaign.id).all()
    
    total_likes = 0
    total_shares = 0
    total_reach = 0
    total_comments = 0

    for d in drafts:
        for p in d.published_posts:
            for a in p.analytics:
                total_likes += a.likes
                total_shares += a.shares
                total_reach += a.reach
                total_comments += a.comments

    return {
        "campaign": campaign,
        "drafts": drafts,
        "analytics": {
            "total_likes": total_likes,
            "total_shares": total_shares,
            "total_reach": total_reach,
            "total_comments": total_comments
        }
    }

@router.delete("/{id}")
def delete_campaign(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}
