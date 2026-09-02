import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="requester")  # "requester" or "admin"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    accounts = relationship("LinkedAccount", back_populates="user")
    prompts = relationship("Prompt", back_populates="user")
    campaigns = relationship("Campaign", back_populates="user")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    target_platforms = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="campaigns")
    prompts = relationship("Prompt", back_populates="campaign")
    drafts = relationship("Draft", back_populates="campaign")

class LinkedAccount(Base):
    __tablename__ = "linked_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String, nullable=False)  # "instagram", "linkedin", "twitter", "facebook"
    oauth_token = Column(String, nullable=False)
    status = Column(String, default="active")  # "active", "expired"
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="accounts")

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    prompt_text = Column(Text, nullable=False)
    target_platforms = Column(String, nullable=False)  # comma separated e.g. "instagram,linkedin"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="prompts")
    campaign = relationship("Campaign", back_populates="prompts")
    drafts = relationship("Draft", back_populates="prompt")

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    title = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="Draft")  # "Draft", "Under Review", "Approved", "Rejected", "Published", "Publish Failed"
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    prompt = relationship("Prompt", back_populates="drafts")
    campaign = relationship("Campaign", back_populates="drafts")
    approvals = relationship("Approval", back_populates="draft")
    published_posts = relationship("PublishedPost", back_populates="draft")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    decision = Column(String, nullable=False)  # "Approved", "Rejected"
    comment = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    draft = relationship("Draft", back_populates="approvals")
    reviewer = relationship("User")

class PublishedPost(Base):
    __tablename__ = "published_posts"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"))
    platform = Column(String, nullable=False)
    platform_post_id = Column(String, nullable=False)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="success")  # "success", "failed"

    # Relationships
    draft = relationship("Draft", back_populates="published_posts")
    analytics = relationship("Analytics", back_populates="published_post")

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    published_post_id = Column(Integer, ForeignKey("published_posts.id"))
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    captured_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    published_post = relationship("PublishedPost", back_populates="analytics")


class PinterestAccount(Base):
    __tablename__ = "pinterest_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pinterest_user_id = Column(String, nullable=False)
    username = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    status = Column(String, default="active")

    user = relationship("User")
    boards = relationship("PinterestBoard", back_populates="account")
    publications = relationship("PinterestPublication", back_populates="account")


class PinterestBoard(Base):
    __tablename__ = "pinterest_boards"

    id = Column(Integer, primary_key=True, index=True)
    pinterest_account_id = Column(Integer, ForeignKey("pinterest_accounts.id"))
    pinterest_board_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    account = relationship("PinterestAccount", back_populates="boards")
    publications = relationship("PinterestPublication", back_populates="board")


class PinterestPublication(Base):
    __tablename__ = "pinterest_publications"

    id = Column(Integer, primary_key=True, index=True)
    pinterest_account_id = Column(Integer, ForeignKey("pinterest_accounts.id"))
    pinterest_board_id = Column(Integer, ForeignKey("pinterest_boards.id"))
    post_id = Column(Integer, nullable=True) # ID of the post/draft from our system
    pinterest_pin_id = Column(String, nullable=True)
    pin_url = Column(String, nullable=True)
    status = Column(String, default="pending") # "pending", "success", "failed"
    error_message = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)

    account = relationship("PinterestAccount", back_populates="publications")
    board = relationship("PinterestBoard", back_populates="publications")
