import random

# Platform-specific engagement characteristics based on real-world benchmarks
PLATFORM_METRICS = {
    "instagram": {
        "reach": (500, 3000), "like_rate": (0.05, 0.12),
        "comment_rate": (0.05, 0.15), "share_rate": (0.01, 0.05), "ctr": (0.01, 0.04)
    },
    "linkedin": {
        "reach": (200, 1500), "like_rate": (0.02, 0.07),
        "comment_rate": (0.10, 0.30), "share_rate": (0.05, 0.15), "ctr": (0.02, 0.06)
    },
    "twitter": {
        "reach": (1000, 8000), "like_rate": (0.01, 0.04),
        "comment_rate": (0.02, 0.08), "share_rate": (0.10, 0.25), "ctr": (0.005, 0.02)
    },
    "x": {
        "reach": (1000, 8000), "like_rate": (0.01, 0.04),
        "comment_rate": (0.02, 0.08), "share_rate": (0.10, 0.25), "ctr": (0.005, 0.02)
    },
    "facebook": {
        "reach": (300, 2000), "like_rate": (0.03, 0.08),
        "comment_rate": (0.05, 0.20), "share_rate": (0.02, 0.08), "ctr": (0.01, 0.03)
    },
    "tiktok": {
        "reach": (2000, 50000), "like_rate": (0.08, 0.20),
        "comment_rate": (0.01, 0.05), "share_rate": (0.02, 0.10), "ctr": (0.02, 0.08)
    },
    "youtube": {
        "reach": (500, 15000), "like_rate": (0.03, 0.08),
        "comment_rate": (0.005, 0.02), "share_rate": (0.01, 0.04), "ctr": (0.03, 0.10)
    },
    "pinterest": {
        "reach": (400, 5000), "like_rate": (0.01, 0.04),
        "comment_rate": (0.002, 0.01), "share_rate": (0.05, 0.20), "ctr": (0.02, 0.06)
    },
    "reddit": {
        "reach": (500, 10000), "like_rate": (0.05, 0.25),
        "comment_rate": (0.03, 0.15), "share_rate": (0.01, 0.05), "ctr": (0.01, 0.04)
    },
    "telegram": {
        "reach": (100, 3000), "like_rate": (0.05, 0.15),
        "comment_rate": (0.02, 0.08), "share_rate": (0.05, 0.20), "ctr": (0.03, 0.08)
    },
    "threads": {
        "reach": (300, 4000), "like_rate": (0.04, 0.12),
        "comment_rate": (0.02, 0.10), "share_rate": (0.01, 0.06), "ctr": (0.01, 0.04)
    },
    "wordpress": {
        "reach": (100, 2000), "like_rate": (0.01, 0.04),
        "comment_rate": (0.005, 0.03), "share_rate": (0.01, 0.05), "ctr": (0.02, 0.07)
    },
    "xing": {
        "reach": (100, 800), "like_rate": (0.02, 0.06),
        "comment_rate": (0.05, 0.20), "share_rate": (0.02, 0.08), "ctr": (0.02, 0.05)
    },
    "google business": {
        "reach": (200, 2500), "like_rate": (0.01, 0.04),
        "comment_rate": (0.01, 0.05), "share_rate": (0.005, 0.02), "ctr": (0.04, 0.12)
    },
    "google_business": {
        "reach": (200, 2500), "like_rate": (0.01, 0.04),
        "comment_rate": (0.01, 0.05), "share_rate": (0.005, 0.02), "ctr": (0.04, 0.12)
    },
}

# Default fallback metrics for unknown platforms
_DEFAULT_METRICS = {
    "reach": (300, 2000), "like_rate": (0.03, 0.08),
    "comment_rate": (0.05, 0.20), "share_rate": (0.02, 0.08), "ctr": (0.01, 0.03)
}


def fetch_platform_metrics(platform: str, platform_post_id: str) -> dict:
    """
    Skill 9: Analytics Skill.
    Polls/Simulates social media API performance stats for a published post.
    Supports all 14 integrated platforms with realistic platform-specific engagement rates.
    """
    key = platform.lower().strip()
    cfg = PLATFORM_METRICS.get(key, _DEFAULT_METRICS)

    reach = random.randint(*cfg["reach"])
    likes = int(reach * random.uniform(*cfg["like_rate"]))
    comments = int(likes * random.uniform(*cfg["comment_rate"]))
    shares = int(likes * random.uniform(*cfg["share_rate"]))
    ctr = round(random.uniform(*cfg["ctr"]), 3)

    return {
        "likes": max(1, likes),
        "shares": max(0, shares),
        "reach": max(10, reach),
        "comments": max(0, comments),
        "ctr": ctr,
    }
