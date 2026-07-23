import concurrent.futures
from sqlalchemy.orm import Session
from .. import models, schemas
from .content_writing import write_content
from .hashtag_seo import generate_hashtags
from .image_gen import generate_image
from .platform_formatting import format_for_platform
from .digital_marketing import get_marketing_strategy
from .notification import send_lifecycle_notification


def orchestrate_prompt_to_draft(db: Session, prompt_text: str, platforms: list,
                                 tone: str, prompt_id: int, campaign_id: int = None) -> models.Draft:
    """
    Skills Engine (Orchestrator) - Section 9.1
    Triggers Content Writing, Hashtags, and Image Generation in parallel,
    then adapts content for each target platform, adds marketing suggestions,
    persists the Draft, and sends a notification.
    """

    # 1. Trigger Content Writing first (we need the rich content + image_prompt)
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_copy = executor.submit(write_content, prompt_text, tone)
        copy_results = future_copy.result()

    title = copy_results["title"]
    caption = copy_results["caption"]
    description = copy_results["description"]
    cta = copy_results.get("cta", "")
    key_points = copy_results.get("key_points", [])
    target_audience = copy_results.get("target_audience", "")
    image_prompt = copy_results.get("image_prompt", "")

    # 2. Now run hashtags and contextual image generation in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_hashtags = executor.submit(generate_hashtags, prompt_text, caption)
        # Pass image_prompt to image generator for contextual visuals
        future_image = executor.submit(generate_image, prompt_id, title, "Marketing", image_prompt)

        hashtags = future_hashtags.result()
        image_url = future_image.result()

    # 3. Run Platform Formatting for each target platform
    formatted_posts = {}
    for platform in platforms:
        format_res = format_for_platform(platform, title, caption, description, hashtags)
        formatted_posts[platform] = format_res["formatted_text"]

    # 4. Run Digital Marketing skill to get posting recommendations
    marketing = get_marketing_strategy(prompt_text, platforms)

    # 5. Build rich full_description with all metadata
    key_points_str = "\n".join([f"• {pt}" for pt in key_points]) if key_points else ""
    platform_previews_str = "\n".join(
        [f"[{p.upper()}]\n{text}" for p, text in formatted_posts.items()]
    )

    full_description = (
        f"{description}\n\n"
        f"{'[Key Talking Points]' + chr(10) + key_points_str + chr(10) + chr(10) if key_points_str else ''}"
        f"{'[Target Audience]' + chr(10) + target_audience + chr(10) + chr(10) if target_audience else ''}"
        f"{'[Call to Action]' + chr(10) + cta + chr(10) + chr(10) if cta else ''}"
        f"[Marketing Strategy]\n"
        f"Target Audience: {marketing['target_audience']}\n"
        f"Best Posting Time: {marketing['best_posting_time']}\n"
        f"Tips:\n"
        f"- {marketing['recommendations'][0]}\n"
        f"- {marketing['recommendations'][1]}\n\n"
        f"[Platform Previews]\n{platform_previews_str}"
    )

    # 6. Create and persist Draft in DB
    db_draft = models.Draft(
        prompt_id=prompt_id,
        campaign_id=campaign_id,
        title=title,
        caption=caption,
        description=full_description,
        hashtags=hashtags,
        image_url=image_url,
        status="Under Review"  # Draft moves to "Under Review" state immediately
    )
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)

    # 7. Notify admin that a draft is ready for review
    send_lifecycle_notification("draft_ready", {"draft_id": db_draft.id})

    return db_draft


def regenerate_draft_with_feedback(db: Session, draft: models.Draft,
                                    user_opinion: str) -> models.Draft:
    """
    Regenerates an existing draft's content using reviewer feedback/opinion.
    Updates the draft in-place and returns it back to Under Review state.
    """
    from .content_writing import regenerate_with_feedback

    # 1. Call AI to improve content based on opinion
    improved = regenerate_with_feedback(
        original_title=draft.title or "",
        original_caption=draft.caption or "",
        original_description=draft.description or "",
        user_opinion=user_opinion,
        tone="Professional"  # Default tone for regeneration
    )

    title = improved["title"]
    caption = improved["caption"]
    description = improved["description"]
    cta = improved.get("cta", "")
    key_points = improved.get("key_points", [])
    target_audience = improved.get("target_audience", "")
    image_prompt = improved.get("image_prompt", "")

    # 2. Regenerate hashtags and image in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_hashtags = executor.submit(generate_hashtags, title, caption)
        future_image = executor.submit(generate_image, draft.id, title, "Marketing", image_prompt)

        hashtags = future_hashtags.result()
        image_url = future_image.result()

    # 3. Build updated description
    key_points_str = "\n".join([f"• {pt}" for pt in key_points]) if key_points else ""
    full_description = (
        f"[AI IMPROVED — Feedback Applied: {user_opinion[:120]}{'...' if len(user_opinion) > 120 else ''}]\n\n"
        f"{description}\n\n"
        f"{'[Key Talking Points]' + chr(10) + key_points_str + chr(10) + chr(10) if key_points_str else ''}"
        f"{'[Target Audience]' + chr(10) + target_audience + chr(10) + chr(10) if target_audience else ''}"
        f"{'[Call to Action]' + chr(10) + cta if cta else ''}"
    )

    # 4. Update draft in-place
    draft.title = title
    draft.caption = caption
    draft.description = full_description
    draft.hashtags = hashtags
    draft.image_url = image_url
    draft.status = "Under Review"  # Return to review queue with improved content
    db.commit()
    db.refresh(draft)

    send_lifecycle_notification("draft_improved", {
        "draft_id": draft.id,
        "feedback": user_opinion[:80]
    })

    return draft
