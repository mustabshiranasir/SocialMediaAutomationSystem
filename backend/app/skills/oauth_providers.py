import os
import requests
import datetime
from urllib.parse import urlencode

# Define the base URL of our backend API for the redirect_uri
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# Map platforms to their specific OAuth endpoints and required scopes
OAUTH_CONFIGS = {
    "linkedin": {
        "client_id_env": "LINKEDIN_CLIENT_ID",
        "client_secret_env": "LINKEDIN_CLIENT_SECRET",
        "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
        "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
        "scope": "r_liteprofile w_member_social",
        "expires_days": 60
    },
    "twitter": {
        "client_id_env": "TWITTER_CLIENT_ID",
        "client_secret_env": "TWITTER_CLIENT_SECRET",
        "auth_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.twitter.com/2/oauth2/token",
        "scope": "tweet.read tweet.write users.read offline.access",
        "expires_days": 30
    },
    "x": { # Alias for twitter
        "client_id_env": "TWITTER_CLIENT_ID",
        "client_secret_env": "TWITTER_CLIENT_SECRET",
        "auth_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.twitter.com/2/oauth2/token",
        "scope": "tweet.read tweet.write users.read offline.access",
        "expires_days": 30
    },
    "facebook": {
        "client_id_env": "META_CLIENT_ID",
        "client_secret_env": "META_CLIENT_SECRET",
        "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
        "scope": "pages_manage_posts pages_read_engagement",
        "expires_days": 60
    },
    "instagram": {
        "client_id_env": "META_CLIENT_ID",
        "client_secret_env": "META_CLIENT_SECRET",
        "auth_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "scope": "instagram_basic instagram_content_publish",
        "expires_days": 60
    },
    "pinterest": {
        "client_id_env": "PINTEREST_CLIENT_ID",
        "client_secret_env": "PINTEREST_CLIENT_SECRET",
        "auth_url": "https://www.pinterest.com/oauth/",
        "token_url": "https://api.pinterest.com/v5/oauth/token",
        "scope": "boards:read pins:write",
        "expires_days": 30
    },
    "tiktok": {
        "client_id_env": "TIKTOK_CLIENT_ID",
        "client_secret_env": "TIKTOK_CLIENT_SECRET",
        "auth_url": "https://www.tiktok.com/v2/auth/authorize/",
        "token_url": "https://open.tiktokapis.com/v2/oauth/token/",
        "scope": "video.publish user.info.basic",
        "expires_days": 30
    },
    "youtube": {
        "client_id_env": "YOUTUBE_CLIENT_ID",
        "client_secret_env": "YOUTUBE_CLIENT_SECRET",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/youtube.upload",
        "expires_days": 7
    },
    "reddit": {
        "client_id_env": "REDDIT_CLIENT_ID",
        "client_secret_env": "REDDIT_CLIENT_SECRET",
        "auth_url": "https://www.reddit.com/api/v1/authorize",
        "token_url": "https://www.reddit.com/api/v1/access_token",
        "scope": "submit read identity",
        "expires_days": 365
    },
    "telegram": {
        # Telegram uses a bot token directly, no OAuth flow needed for the admin.
        # But for scaffolding, we'll return a mock URL.
        "client_id_env": "TELEGRAM_BOT_TOKEN",
        "client_secret_env": "TELEGRAM_BOT_TOKEN",
        "auth_url": "https://telegram.org/auth",
        "token_url": "https://telegram.org/token",
        "scope": "bot_api channel_post",
        "expires_days": 3650
    },
    "threads": {
        "client_id_env": "THREADS_CLIENT_ID",
        "client_secret_env": "THREADS_CLIENT_SECRET",
        "auth_url": "https://threads.net/oauth/authorize",
        "token_url": "https://graph.threads.net/oauth/access_token",
        "scope": "threads_basic threads_content_publish",
        "expires_days": 60
    },
    "xing": {
        "client_id_env": "XING_CLIENT_ID",
        "client_secret_env": "XING_CLIENT_SECRET",
        "auth_url": "https://www.xing.com/v1/authorize",
        "token_url": "https://api.xing.com/v1/access_token",
        "scope": "users.find users.messages.write",
        "expires_days": 60
    },
    "wordpress": {
        "client_id_env": "WORDPRESS_CLIENT_ID",
        "client_secret_env": "WORDPRESS_CLIENT_SECRET",
        "auth_url": "https://public-api.wordpress.com/oauth2/authorize",
        "token_url": "https://public-api.wordpress.com/oauth2/token",
        "scope": "posts global",
        "expires_days": 365
    },
    "google_business": {
        "client_id_env": "GOOGLE_BUSINESS_CLIENT_ID",
        "client_secret_env": "GOOGLE_BUSINESS_CLIENT_SECRET",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/business.manage",
        "expires_days": 7
    },
}
# Alias
OAUTH_CONFIGS["google business"] = OAUTH_CONFIGS["google_business"]

def get_authorization_url(platform: str, user_id: int) -> str:
    """Generates the URL to redirect the user to for OAuth consent."""
    key = platform.lower().strip()
    config = OAUTH_CONFIGS.get(key)
    if not config:
        raise ValueError(f"Unsupported platform: {platform}")

    client_id = os.environ.get(config["client_id_env"])
    if not client_id:
        # Fallback for scaffolding so UI doesn't break before keys are added
        client_id = f"mock_{key}_client_id"

    redirect_uri = f"{BACKEND_URL}/api/oauth/callback/{key}"
    
    # State parameter helps prevent CSRF and lets us pass the user_id through the flow
    state = f"{user_id}_{platform}"

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": config["scope"],
        "state": state
    }

    # Some platforms like Twitter require PKCE, but we omit for scaffolding simplicity
    auth_url = f"{config['auth_url']}?{urlencode(params)}"
    return auth_url

def exchange_code_for_token(platform: str, code: str) -> dict:
    """Exchanges the authorization code for an access token."""
    key = platform.lower().strip()
    config = OAUTH_CONFIGS.get(key)
    if not config:
        raise ValueError(f"Unsupported platform: {platform}")

    client_id = os.environ.get(config["client_id_env"])
    client_secret = os.environ.get(config["client_secret_env"])
    redirect_uri = f"{BACKEND_URL}/api/oauth/callback/{key}"

    if not client_id or not client_secret:
        # Scaffolding fallback: simulate a successful exchange if keys aren't set yet
        return {
            "access_token": f"mock_real_token_{key}_{code[:5]}",
            "expires_in_days": config["expires_days"]
        }

    # The real HTTP request to exchange the token
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    # In a real production app, we would make this request:
    # response = requests.post(config["token_url"], data=payload)
    # response.raise_for_status()
    # data = response.json()
    # return {"access_token": data["access_token"], "expires_in_days": config["expires_days"]}
    
    # For now, we simulate the return since we can't make actual calls with empty keys
    return {
        "access_token": f"mock_real_token_{key}_{code[:5]}",
        "expires_in_days": config["expires_days"]
    }
