from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Post Tracking"])

@router.get("", response_model=Dict[str, float])
def get_aggregate_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET /analytics: Retrieve total aggregate engagement stats.
    """
    records = db.query(models.Analytics).all()
    
    total_likes = sum(r.likes for r in records)
    total_shares = sum(r.shares for r in records)
    total_reach = sum(r.reach for r in records)
    total_comments = sum(r.comments for r in records)
    avg_ctr = sum(r.ctr for r in records) / len(records) if records else 0.0
    
    return {
        "total_likes": float(total_likes),
        "total_shares": float(total_shares),
        "total_reach": float(total_reach),
        "total_comments": float(total_comments),
        "average_ctr": round(avg_ctr, 4)
    }

@router.get("/{postId}", response_model=List[schemas.AnalyticsResponse])
def get_post_analytics(
    postId: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET /analytics/{postId}: Retrieve performance data history for a specific post.
    """
    pub_post = db.query(models.PublishedPost).filter(models.PublishedPost.id == postId).first()
    if not pub_post:
        raise HTTPException(status_code=404, detail="Published post record not found")
        
    return db.query(models.Analytics).filter(models.Analytics.published_post_id == postId).all()

@router.get("/dashboard/posts", response_model=List[dict])
def get_dashboard_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET /analytics/dashboard/posts: Helper to return published posts alongside their analytics metrics.
    """
    posts = db.query(models.PublishedPost).filter(models.PublishedPost.status == "success").all()
    result = []
    
    for p in posts:
        analytics_rec = db.query(models.Analytics).filter(models.Analytics.published_post_id == p.id).first()
        draft = p.draft
        
        result.append({
            "id": p.id,
            "draft_id": p.draft_id,
            "platform": p.platform,
            "platform_post_id": p.platform_post_id,
            "published_at": p.published_at,
            "title": draft.title if draft else "Untitled",
            "likes": analytics_rec.likes if analytics_rec else 0,
            "shares": analytics_rec.shares if analytics_rec else 0,
            "reach": analytics_rec.reach if analytics_rec else 0,
            "comments": analytics_rec.comments if analytics_rec else 0,
            "ctr": analytics_rec.ctr if analytics_rec else 0.0
        })
        
    return result
