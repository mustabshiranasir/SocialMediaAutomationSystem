from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# LinkedAccount Schemas
class LinkedAccountBase(BaseModel):
    platform: str
    oauth_token: str
    expires_at: Optional[datetime] = None

class LinkedAccountCreate(LinkedAccountBase):
    pass

class LinkedAccountResponse(BaseModel):
    id: int
    platform: str
    status: str
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Prompt Schemas
class PromptCreate(BaseModel):
    prompt_text: str
    target_platforms: List[str]
    tone: Optional[str] = "Professional"
    campaign_id: Optional[int] = None

class PromptResponse(BaseModel):
    id: int
    prompt_text: str
    target_platforms: str
    campaign_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Draft Schemas
class DraftEdit(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[str] = None

class DraftResponse(BaseModel):
    id: int
    prompt_id: int
    campaign_id: Optional[int] = None
    title: Optional[str]
    caption: Optional[str]
    description: Optional[str]
    hashtags: Optional[str]
    image_url: Optional[str]
    status: str
    scheduled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Password Reset Schema
class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str

# Campaign Schemas
class CampaignCreate(BaseModel):
    name: str
    target_platforms: Union[List[str], str]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    target_platforms: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    total_drafts: Optional[int] = 0
    published_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Schedule Schema
class ScheduleRequest(BaseModel):
    scheduled_at: datetime

class ImprovementRequest(BaseModel):
    opinion: str
    regenerate_image: Optional[bool] = True

class ManualContentEdit(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[str] = None


# Approval Schemas
class ApprovalCreate(BaseModel):
    decision: str  # "Approved" or "Rejected"
    comment: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: int
    draft_id: int
    reviewer_id: int
    decision: str
    comment: Optional[str]
    decided_at: datetime

    class Config:
        from_attributes = True

# PublishedPost Schemas
class PublishedPostResponse(BaseModel):
    id: int
    draft_id: int
    platform: str
    platform_post_id: str
    published_at: datetime
    status: str

    class Config:
        from_attributes = True

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    id: int
    published_post_id: int
    likes: int
    shares: int
    reach: int
    comments: int
    ctr: float
    captured_at: datetime

    class Config:
        from_attributes = True

