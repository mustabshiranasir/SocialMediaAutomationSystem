import os
import random

def get_marketing_strategy(prompt_text: str, platforms: list) -> dict:
    """
    Skill 5: Digital Marketing Skill.
    Suggests ideal posting time, target audience, and engagement strategy tips.
    """
    # Sample lists of recommendations
    audiences = [
        "Tech Enthusiasts & Early Adopters",
        "Small & Medium Business Owners",
        "Digital Marketers & Content Creators",
        "General Consumer Brand Audience",
        "Professionals in Enterprise Sales & HR"
    ]
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    times = ["9:00 AM", "12:30 PM", "2:00 PM", "6:00 PM"]
    
    best_time = f"{random.choice(days)} at {random.choice(times)} (Local Time)"
    target = random.choice(audiences)
    
    strategy_tips = [
        "Use interactive stories to run a poll related to this post topic.",
        "Respond to first-hour comments within 15 minutes to trigger the algorithm.",
        "Cross-promote this on employee profiles for higher organic reach.",
        "Add a direct link in bio / comment section to drive immediate traffic."
    ]
    
    return {
        "best_posting_time": best_time,
        "target_audience": target,
        "recommendations": random.sample(strategy_tips, 2)
    }
