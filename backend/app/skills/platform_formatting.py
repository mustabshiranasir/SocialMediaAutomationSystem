import os
import requests

def format_for_platform(platform: str, title: str, caption: str, description: str, hashtags: str) -> dict:
    """
    Skill 4: Platform Formatting Skill.
    Adapts the generated post to platform-specific character limits, layouts, and tones.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    platform = platform.lower()
    
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            prompt = (
                f"Rewrite this content to optimize it specifically for the social platform: '{platform.upper()}'.\n"
                f"Follow these constraints:\n"
                f"- If TWITTER/X: Must be strictly under 280 characters including hashtags, punchy and direct.\n"
                f"- If LINKEDIN: Professional, well-spaced, bullet points, Call-to-action.\n"
                f"- If INSTAGRAM: Friendly, emoji-rich, hashtag dump at the end.\n"
                f"- If FACEBOOK: Accessible, engaging, medium length.\n\n"
                f"Original Title: {title}\n"
                f"Original Caption: {caption}\n"
                f"Original Description: {description}\n"
                f"Original Hashtags: {hashtags}\n\n"
                f"Output only the optimized text body without any preamble."
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            response = requests.post(url, headers=headers, json=payload, timeout=3)
            if response.status_code == 200:
                result_json = response.json()
                text = result_json['contents'][0]['parts'][0]['text'].strip()
                return {"formatted_text": text}
        except Exception:
            pass

    # Heuristic formatting engine (offline mode)
    if platform in ["twitter", "x"]:
        # Strict limit of 280 chars
        truncated_desc = description[:160] + "..." if len(description) > 160 else description
        formatted = f"📢 {title}\n\n{truncated_desc}\n\n{hashtags.split()[:2] if hashtags else ''}"
        formatted = " ".join(formatted.split())  # single line spacing
        if len(formatted) > 280:
            formatted = formatted[:277] + "..."
        return {"formatted_text": formatted}
        
    elif platform == "linkedin":
        return {
            "formatted_text": (
                f"💼 {title}\n\n"
                f"{caption}\n\n"
                f"Key Takeaways:\n"
                f"• {description[:100]}...\n"
                f"• Learn more and join the conversation.\n\n"
                f"{' '.join(hashtags.split()[:3])}"
            )
        }
        
    elif platform == "instagram":
        return {
            "formatted_text": (
                f"✨ {title} ✨\n\n"
                f"{caption}\n\n"
                f"💡 {description}\n\n"
                f".\n.\n.\n"
                f"{hashtags}"
            )
        }
        
    else:  # Facebook & general default
        return {
            "formatted_text": (
                f"📣 {title}\n\n"
                f"{caption}\n\n"
                f"{description}\n\n"
                f"Check out our latest update and let us know your thoughts! 👇\n\n"
                f"{hashtags}"
            )
        }
