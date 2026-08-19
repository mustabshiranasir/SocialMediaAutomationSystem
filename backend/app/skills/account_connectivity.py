import datetime
import random

# Platform-specific OAuth metadata
PLATFORM_OAUTH_CONFIG = {
    "linkedin":        {"scope": "r_liteprofile w_member_social", "expires_days": 60},
    "instagram":       {"scope": "instagram_basic instagram_content_publish", "expires_days": 60},
    "twitter":         {"scope": "tweet.read tweet.write users.read", "expires_days": 30},
    "x":               {"scope": "tweet.read tweet.write users.read", "expires_days": 30},
    "facebook":        {"scope": "pages_manage_posts pages_read_engagement", "expires_days": 60},
    "tiktok":          {"scope": "video.publish user.info.basic", "expires_days": 30},
    "youtube":         {"scope": "youtube.upload youtube.readonly", "expires_days": 7},
    "pinterest":       {"scope": "boards:read pins:write", "expires_days": 30},
    "reddit":          {"scope": "submit read identity", "expires_days": 365},
    "telegram":        {"scope": "bot_api channel_post", "expires_days": 3650},  # Bot tokens don't expire
    "threads":         {"scope": "threads_basic threads_content_publish", "expires_days": 60},
    "wordpress":       {"scope": "posts global", "expires_days": 365},
    "xing":            {"scope": "users.find users.messages.write", "expires_days": 60},
    "google business": {"scope": "business.manage reviews.readonly", "expires_days": 7},
    "google_business": {"scope": "business.manage reviews.readonly", "expires_days": 7},
}

_DEFAULT_CONFIG = {"scope": "read write", "expires_days": 30}


def link_social_account(platform: str, auth_code: str) -> dict:
    """
    Skill 6: Account Connectivity Skill.
    Simulates OAuth linking for all supported social platforms.
    Returns platform-specific token metadata including scopes and expiry.
    """
    key = platform.lower().strip()
    config = PLATFORM_OAUTH_CONFIG.get(key, _DEFAULT_CONFIG)

    mock_token = f"oauth_{key}_{random.randint(100000, 999999)}_{auth_code[:8]}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=config["expires_days"])

    return {
        "platform": key,
        "oauth_token": mock_token,
        "scope": config["scope"],
        "status": "active",
        "expires_at": expires_at,
        "expires_in_days": config["expires_days"],
    }


def check_token_status(oauth_token: str) -> str:
    """
    Simulates checking if a token is still valid.
    5% chance of expiry to simulate real-world token degradation.
    """
    return "active" if random.random() > 0.05 else "expired"


def get_platform_capabilities(platform: str) -> dict:
    """
    Returns what content types and actions are supported for a given platform.
    Useful for UI display and content routing decisions.
    """
    capabilities = {
        "linkedin":        {"text": True, "image": True, "video": True, "stories": False, "live": False},
        "instagram":       {"text": True, "image": True, "video": True, "stories": True,  "live": True},
        "twitter":         {"text": True, "image": True, "video": True, "stories": False, "live": True},
        "x":               {"text": True, "image": True, "video": True, "stories": False, "live": True},
        "facebook":        {"text": True, "image": True, "video": True, "stories": True,  "live": True},
        "tiktok":          {"text": True, "image": False,"video": True, "stories": False, "live": True},
        "youtube":         {"text": True, "image": False,"video": True, "stories": False, "live": True},
        "pinterest":       {"text": True, "image": True, "video": True, "stories": False, "live": False},
        "reddit":          {"text": True, "image": True, "video": True, "stories": False, "live": False},
        "telegram":        {"text": True, "image": True, "video": True, "stories": False, "live": False},
        "threads":         {"text": True, "image": True, "video": False,"stories": False, "live": False},
        "wordpress":       {"text": True, "image": True, "video": False,"stories": False, "live": False},
        "xing":            {"text": True, "image": True, "video": False,"stories": False, "live": False},
        "google business": {"text": True, "image": True, "video": False,"stories": False, "live": False},
        "google_business": {"text": True, "image": True, "video": False,"stories": False, "live": False},
    }
    return capabilities.get(platform.lower(), {"text": True, "image": True, "video": False, "stories": False, "live": False})
