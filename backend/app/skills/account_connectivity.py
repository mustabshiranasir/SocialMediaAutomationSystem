import datetime
import random

def link_social_account(platform: str, auth_code: str) -> dict:
    """
    Skill 6: Account Connectivity Skill.
    Simulates linking oauth access tokens.
    """
    mock_token = f"oauth_token_{platform}_{random.randint(100000, 999999)}"
    expires_in_days = 30
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expires_in_days)
    
    return {
        "platform": platform.lower(),
        "oauth_token": mock_token,
        "status": "active",
        "expires_at": expires_at
    }

def check_token_status(oauth_token: str) -> str:
    """
    Simulates checking if a token is still valid.
    """
    # 5% chance of expired for demo simulation
    return "active" if random.random() > 0.05 else "expired"
