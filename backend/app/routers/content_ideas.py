import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from .. import models, auth
from pydantic import BaseModel

router = APIRouter(prefix="/api/content-ideas", tags=["Content Ideas"])


# ── Pydantic Schemas ────────────────────────────────────────────────────────

class ContentIdeaCreate(BaseModel):
    title: str
    content_preview: str
    platforms: Optional[List[str]] = []
    status: Optional[str] = "Draft"  # "Draft", "Scheduled", "Published"
    scheduled_at: Optional[datetime.datetime] = None
    tags: Optional[str] = ""
    media_url: Optional[str] = ""
    link_url: Optional[str] = ""
    first_comment: Optional[str] = ""
    is_starred: Optional[bool] = False


class ContentIdeaUpdate(BaseModel):
    title: Optional[str] = None
    content_preview: Optional[str] = None
    platforms: Optional[List[str]] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime.datetime] = None
    tags: Optional[str] = None
    media_url: Optional[str] = None
    link_url: Optional[str] = None
    first_comment: Optional[str] = None
    is_starred: Optional[bool] = None


class ContentIdeaSchedule(BaseModel):
    scheduled_at: datetime.datetime


class ContentIdeaResponse(BaseModel):
    id: int
    title: str
    content_preview: str
    platforms: str
    status: str
    scheduled_at: Optional[datetime.datetime] = None
    tags: Optional[str] = ""
    media_url: Optional[str] = ""
    link_url: Optional[str] = ""
    first_comment: Optional[str] = ""
    is_starred: Optional[bool] = False
    created_by: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# ── Model ────────────────────────────────────────────────────────────────────
# We re-use the existing Prompt model as a lightweight content idea store,
# but we'll create a dedicated ContentIdea SQLAlchemy model on-the-fly
# using the existing DB engine. A separate table keeps ideas isolated.

from ..database import Base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship


class ContentIdea(Base):
    __tablename__ = "content_ideas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content_preview = Column(Text, nullable=False)
    platforms = Column(String, default="")          # comma-separated
    status = Column(String, default="Draft")        # Draft / Scheduled / Published
    scheduled_at = Column(DateTime, nullable=True)
    tags = Column(String, default="")
    media_url = Column(Text, default="")
    link_url = Column(Text, default="")
    first_comment = Column(Text, default="")
    is_starred = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    creator = relationship("User")


def _to_response(idea: ContentIdea) -> dict:
    return {
        "id": idea.id,
        "title": idea.title,
        "content_preview": idea.content_preview,
        "platforms": idea.platforms or "",
        "status": idea.status,
        "scheduled_at": idea.scheduled_at,
        "tags": idea.tags or "",
        "media_url": getattr(idea, 'media_url', '') or "",
        "link_url": getattr(idea, 'link_url', '') or "",
        "first_comment": getattr(idea, 'first_comment', '') or "",
        "is_starred": getattr(idea, 'is_starred', False) or False,
        "created_by": idea.creator.name if idea.creator else "Unknown",
        "created_at": idea.created_at,
        "updated_at": idea.updated_at,
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContentIdeaResponse])
def list_content_ideas(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """List all content ideas with optional search/filter/pagination."""
    query = db.query(ContentIdea)

    if search:
        q = f"%{search}%"
        query = query.filter(
            or_(ContentIdea.title.ilike(q), ContentIdea.content_preview.ilike(q))
        )
    if status:
        query = query.filter(ContentIdea.status == status)
    if platform:
        query = query.filter(ContentIdea.platforms.ilike(f"%{platform}%"))

    total = query.count()
    ideas = query.order_by(ContentIdea.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return [_to_response(i) for i in ideas]


@router.get("/count")
def count_content_ideas(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Return the total count of content ideas."""
    return {"total": db.query(ContentIdea).count()}


@router.get("/{idea_id}", response_model=ContentIdeaResponse)
def get_content_idea(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Get a single content idea by ID."""
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Content idea not found")
    return _to_response(idea)


@router.post("", response_model=ContentIdeaResponse, status_code=201)
def create_content_idea(
    payload: ContentIdeaCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Create a new content idea."""
    user_id = current_user.id if current_user else 1
    idea = ContentIdea(
        user_id=user_id,
        title=payload.title.strip(),
        content_preview=payload.content_preview.strip(),
        platforms=",".join(payload.platforms) if payload.platforms else "",
        status=payload.status or "Draft",
        scheduled_at=payload.scheduled_at,
        tags=payload.tags or "",
        media_url=payload.media_url or "",
        link_url=payload.link_url or "",
        first_comment=payload.first_comment or "",
        is_starred=payload.is_starred or False,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return _to_response(idea)


@router.put("/{idea_id}", response_model=ContentIdeaResponse)
def update_content_idea(
    idea_id: int,
    payload: ContentIdeaUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Update an existing content idea."""
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Content idea not found")

    if payload.title is not None:
        idea.title = payload.title.strip()
    if payload.content_preview is not None:
        idea.content_preview = payload.content_preview.strip()
    if payload.platforms is not None:
        idea.platforms = ",".join(payload.platforms)
    if payload.status is not None:
        idea.status = payload.status
    if payload.scheduled_at is not None:
        idea.scheduled_at = payload.scheduled_at
    if payload.tags is not None:
        idea.tags = payload.tags
    if payload.media_url is not None:
        idea.media_url = payload.media_url
    if payload.link_url is not None:
        idea.link_url = payload.link_url
    if payload.first_comment is not None:
        idea.first_comment = payload.first_comment
    if payload.is_starred is not None:
        idea.is_starred = payload.is_starred

    idea.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(idea)
    return _to_response(idea)


@router.post("/{idea_id}/schedule", response_model=ContentIdeaResponse)
def schedule_content_idea(
    idea_id: int,
    payload: ContentIdeaSchedule,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Schedule a content idea for publishing."""
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Content idea not found")

    idea.status = "Scheduled"
    idea.scheduled_at = payload.scheduled_at
    idea.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(idea)
    return _to_response(idea)


@router.delete("/{idea_id}", status_code=204)
def delete_content_idea(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    """Delete a content idea."""
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Content idea not found")

    db.delete(idea)
    db.commit()
    return None
