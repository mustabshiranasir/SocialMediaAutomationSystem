import os
import requests

# Platform-specific formatting rules and constraints
PLATFORM_RULES = {
    "twitter":        {"limit": 280,   "style": "punchy, direct, under 280 characters, no fluff"},
    "x":              {"limit": 280,   "style": "punchy, direct, under 280 characters, no fluff"},
    "linkedin":       {"limit": 3000,  "style": "professional, structured with bullet points, ends with a call-to-action"},
    "instagram":      {"limit": 2200,  "style": "friendly, visual, uses relevant hashtags at the end"},
    "facebook":       {"limit": 63206, "style": "conversational, engaging, medium length, encourages interaction"},
    "tiktok":         {"limit": 2200,  "style": "youthful, trend-aware, very short hook, hashtags at end, max 150 words"},
    "youtube":        {"limit": 5000,  "style": "descriptive, SEO-rich, includes timestamps structure, links in description"},
    "pinterest":      {"limit": 500,   "style": "inspirational, keyword-rich, describes the visual, ends with a soft CTA"},
    "reddit":         {"limit": 40000, "style": "authentic, community-focused, informative, conversational, no hard selling"},
    "telegram":       {"limit": 4096,  "style": "concise, informative, suitable for broadcast channel, uses Markdown formatting"},
    "threads":        {"limit": 500,   "style": "conversational, witty, short, similar to Twitter/X but more casual"},
    "wordpress":      {"limit": None,  "style": "long-form blog post style, SEO-optimized, uses headers and paragraphs"},
    "xing":           {"limit": 700,   "style": "professional, European B2B tone, formal, career-focused"},
    "google business":{"limit": 1500,  "style": "local business update style, includes location relevance, clear CTA"},
    "google_business":{"limit": 1500,  "style": "local business update style, includes location relevance, clear CTA"},
}

_DEFAULT_RULE = {"limit": 2000, "style": "engaging, clear, ends with a call-to-action"}


def _build_prompt(platform: str, title: str, caption: str, description: str, hashtags: str) -> str:
    rule = PLATFORM_RULES.get(platform.lower(), _DEFAULT_RULE)
    limit_note = f"Must be under {rule['limit']} characters." if rule["limit"] else "No hard character limit."
    return (
        f"Rewrite this content optimized specifically for {platform.upper()}.\n"
        f"Style guidelines: {rule['style']}.\n"
        f"{limit_note}\n\n"
        f"Original Title: {title}\n"
        f"Original Caption: {caption}\n"
        f"Original Description: {description}\n"
        f"Original Hashtags: {hashtags}\n\n"
        f"Output only the optimized post text without any preamble or explanation."
    )


def _call_groq(prompt: str, groq_api_key: str) -> str | None:
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"},
            json={"model": "llama3-70b-8192", "messages": [{"role": "user", "content": prompt}]},
            timeout=8,
        )
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return None


def _call_gemini(prompt: str, gemini_api_key: str) -> str | None:
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=6,
        )
        if response.status_code == 200:
            return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        pass
    return None


def _heuristic_format(platform: str, title: str, caption: str, description: str, hashtags: str) -> str:
    """Offline fallback formatter for all supported platforms."""
    p = platform.lower()
    tags = " ".join(hashtags.split()[:4]) if hashtags else ""

    if p in ("twitter", "x"):
        body = f"{title}\n\n{caption}"
        if len(body) > 240:
            body = body[:237] + "..."
        return f"{body}\n\n{tags}"

    elif p == "linkedin":
        return (
            f"{title}\n\n"
            f"{caption}\n\n"
            f"Key Takeaways:\n"
            f"- {description[:120]}...\n"
            f"- Share your thoughts in the comments.\n\n"
            f"{tags}"
        )

    elif p == "instagram":
        return (
            f"{title}\n\n"
            f"{caption}\n\n"
            f"{description[:300]}\n\n"
            f".\n.\n.\n"
            f"{hashtags}"
        )

    elif p == "tiktok":
        return f"{caption[:120]}\n\n{tags}"

    elif p == "youtube":
        return (
            f"{title}\n\n"
            f"{description}\n\n"
            f"Timestamps:\n"
            f"0:00 - Intro\n"
            f"0:30 - {caption[:60]}\n\n"
            f"{tags}"
        )

    elif p == "pinterest":
        return f"{title}\n\n{caption[:200]}\n\n{tags}"

    elif p == "reddit":
        return (
            f"**{title}**\n\n"
            f"{description}\n\n"
            f"What do you think? Let's discuss below."
        )

    elif p == "telegram":
        return (
            f"**{title}**\n\n"
            f"{caption}\n\n"
            f"{description[:400]}"
        )

    elif p == "threads":
        body = f"{caption}"
        if len(body) > 460:
            body = body[:457] + "..."
        return f"{body}\n\n{tags}"

    elif p == "wordpress":
        return (
            f"# {title}\n\n"
            f"{caption}\n\n"
            f"## Overview\n\n"
            f"{description}\n\n"
            f"---\n\n"
            f"*Tags: {hashtags}*"
        )

    elif p == "xing":
        return (
            f"{title}\n\n"
            f"{caption}\n\n"
            f"{description[:300]}\n\n"
            f"{tags}"
        )

    elif p in ("google business", "google_business"):
        return (
            f"{title}\n\n"
            f"{caption}\n\n"
            f"Visit us or learn more at our website. {description[:200]}"
        )

    else:  # Facebook and generic fallback
        return (
            f"{title}\n\n"
            f"{caption}\n\n"
            f"{description}\n\n"
            f"Let us know your thoughts!\n\n"
            f"{hashtags}"
        )


def format_for_platform(platform: str, title: str, caption: str, description: str, hashtags: str) -> dict:
    """
    Skill 4: Platform Formatting Skill.
    Adapts the generated post to platform-specific character limits, layouts, and tones.
    Supports all 14 integrated platforms. Uses Groq -> Gemini -> Heuristic fallback chain.
    """
    platform = platform.lower().strip()
    prompt = _build_prompt(platform, title, caption, description, hashtags)

    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if groq_key:
        result = _call_groq(prompt, groq_key)
        if result:
            return {"formatted_text": result}

    if gemini_key:
        result = _call_gemini(prompt, gemini_key)
        if result:
            return {"formatted_text": result}

    # Offline heuristic fallback
    return {"formatted_text": _heuristic_format(platform, title, caption, description, hashtags)}
