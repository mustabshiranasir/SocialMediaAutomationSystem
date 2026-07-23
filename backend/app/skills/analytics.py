import random

def fetch_platform_metrics(platform: str, platform_post_id: str) -> dict:
    """
    Skill 9: Analytics Skill.
    Polls/Simulates social media API performance stats for a published post.
    """
    platform = platform.lower()
    
    # Base rates depending on platform
    if platform == "instagram":
        reach = random.randint(500, 3000)
        likes = int(reach * random.uniform(0.05, 0.12))
        comments = int(likes * random.uniform(0.05, 0.15))
        shares = int(likes * random.uniform(0.01, 0.05))
        ctr = round(random.uniform(0.01, 0.04), 3)
    elif platform == "linkedin":
        reach = random.randint(200, 1500)
        likes = int(reach * random.uniform(0.02, 0.07))
        comments = int(likes * random.uniform(0.1, 0.3))
        shares = int(likes * random.uniform(0.05, 0.15))
        ctr = round(random.uniform(0.02, 0.06), 3)
    elif platform in ["twitter", "x"]:
        reach = random.randint(1000, 8000)
        likes = int(reach * random.uniform(0.01, 0.04))
        comments = int(likes * random.uniform(0.02, 0.08))
        shares = int(likes * random.uniform(0.1, 0.25))  # Retweets
        ctr = round(random.uniform(0.005, 0.02), 3)
    else:  # Facebook / general
        reach = random.randint(300, 2000)
        likes = int(reach * random.uniform(0.03, 0.08))
        comments = int(likes * random.uniform(0.05, 0.2))
        shares = int(likes * random.uniform(0.02, 0.08))
        ctr = round(random.uniform(0.01, 0.03), 3)
        
    return {
        "likes": max(1, likes),
        "shares": max(0, shares),
        "reach": max(10, reach),
        "comments": max(0, comments),
        "ctr": ctr
    }
