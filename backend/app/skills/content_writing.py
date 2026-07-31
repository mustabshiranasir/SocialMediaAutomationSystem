import os
import json
import requests

def write_content(prompt_text: str, tone: str = "Professional") -> dict:
    """
    Skill 1: Content Writing Skill.
    Generates rich, post-ready social media content including title, caption,
    detailed description, CTA, key talking points, target audience, and
    an image_prompt for contextual image generation.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    groq_api_key = os.environ.get("GROQ_API_KEY")

    system_instruction = (
        f"You are a world-class social media copywriter and content strategist. "
        f"Write comprehensive, post-ready social media content based on the following topic. "
        f"The tone must be: {tone}. "
        f"Your output MUST be a JSON object with exactly these keys:\n"
        f"  'title': A compelling headline (max 80 chars)\n"
        f"  'caption': A rich, detailed, engaging caption ready to post (minimum 3 paragraphs, 200-400 words). "
        f"Use appropriate emojis, line breaks, and conversational flow. Make it genuinely compelling.\n"
        f"  'description': An in-depth content brief / article body (minimum 350 words). "
        f"Include context, benefits, storytelling elements, and actionable insights.\n"
        f"  'cta': A strong, specific Call-to-Action sentence (e.g., 'Register now at link in bio before August 1st!')\n"
        f"  'key_points': An array of 4-6 concise bullet points summarizing the most important aspects\n"
        f"  'target_audience': A sentence describing who this content is for\n"
        f"  'image_prompt': A vivid, detailed visual description (50-80 words) of what the post image should look like. "
        f"Be specific about colors, mood, objects, setting, and style (e.g., 'A dynamic digital illustration of developers coding at night with neon blue and purple lighting, holographic code streams floating in the air, energetic and futuristic atmosphere, dark background with vibrant accent colors')."
    )

    if groq_api_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama3-70b-8192",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Topic / Prompt: {prompt_text}"}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.85
            }
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                result_json = response.json()
                text_content = result_json['choices'][0]['message']['content']
                data = json.loads(text_content)
                return {
                    "title": data.get("title", f"Feature: {prompt_text[:50]}"),
                    "caption": data.get("caption", _fallback_caption(prompt_text, tone)),
                    "description": data.get("description", prompt_text),
                    "cta": data.get("cta", "Learn more and join the conversation!"),
                    "key_points": data.get("key_points", []),
                    "target_audience": data.get("target_audience", "General audience"),
                    "image_prompt": data.get("image_prompt", _fallback_image_prompt(prompt_text))
                }
        except Exception as e:
            print(f"[ContentWriting] Groq API call failed: {e}. Falling back to Gemini.")

    if gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"{system_instruction}\n\nTopic / Prompt: {prompt_text}"
                    }]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.85,
                    "maxOutputTokens": 2048
                }
            }
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                result_json = response.json()
                text_content = result_json['candidates'][0]['content']['parts'][0]['text']
                data = json.loads(text_content)
                return {
                    "title": data.get("title", f"Feature: {prompt_text[:50]}"),
                    "caption": data.get("caption", _fallback_caption(prompt_text, tone)),
                    "description": data.get("description", prompt_text),
                    "cta": data.get("cta", "Learn more and join the conversation!"),
                    "key_points": data.get("key_points", []),
                    "target_audience": data.get("target_audience", "General audience"),
                    "image_prompt": data.get("image_prompt", _fallback_image_prompt(prompt_text))
                }
        except Exception as e:
            print(f"[ContentWriting] Gemini API call failed: {e}. Falling back to heuristic engine.")

    # Rich heuristic fallback (offline mode)
    return _heuristic_content(prompt_text, tone)


def regenerate_with_feedback(original_title: str, original_caption: str, original_description: str,
                              user_opinion: str, tone: str = "Professional") -> dict:
    """
    Regenerates post content based on reviewer feedback / opinion.
    Takes the existing draft content + a critique comment and produces an improved version.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    groq_api_key = os.environ.get("GROQ_API_KEY")

    system_instruction = (
        f"You are a world-class social media copywriter. A reviewer has given feedback on an existing draft. "
        f"Your job is to produce a significantly improved version that addresses all the feedback points. "
        f"The tone must be: {tone}. "
        f"Return ONLY a JSON object with these exact keys: "
        f"'title', 'caption' (min 3 paragraphs, 200-400 words, emoji-rich, post-ready), "
        f"'description' (min 350 words, detailed), "
        f"'cta' (strong call-to-action), "
        f"'key_points' (array of 4-6 bullets), "
        f"'target_audience' (one sentence), "
        f"'image_prompt' (50-80 word vivid visual description for image generation)."
    )

    improvement_prompt = (
        f"ORIGINAL DRAFT CONTENT:\n"
        f"Title: {original_title}\n"
        f"Caption: {original_caption}\n"
        f"Description: {original_description}\n\n"
        f"REVIEWER FEEDBACK / IMPROVEMENT DIRECTIVE:\n{user_opinion}\n\n"
        f"Please rewrite the entire post content, fully addressing the feedback. "
        f"Make it substantially better than the original."
    )

    if groq_api_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama3-70b-8192",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": improvement_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.9
            }
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                result_json = response.json()
                text_content = result_json['choices'][0]['message']['content']
                data = json.loads(text_content)
                return {
                    "title": data.get("title", original_title),
                    "caption": data.get("caption", original_caption),
                    "description": data.get("description", original_description),
                    "cta": data.get("cta", "Learn more!"),
                    "key_points": data.get("key_points", []),
                    "target_audience": data.get("target_audience", "General audience"),
                    "image_prompt": data.get("image_prompt", _fallback_image_prompt(original_title))
                }
        except Exception as e:
            print(f"[ContentWriting] Groq Regeneration API call failed: {e}. Falling back to Gemini.")

    if gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"{system_instruction}\n\n{improvement_prompt}"
                    }]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.9,
                    "maxOutputTokens": 2048
                }
            }
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                result_json = response.json()
                text_content = result_json['candidates'][0]['content']['parts'][0]['text']
                data = json.loads(text_content)
                return {
                    "title": data.get("title", original_title),
                    "caption": data.get("caption", original_caption),
                    "description": data.get("description", original_description),
                    "cta": data.get("cta", "Learn more!"),
                    "key_points": data.get("key_points", []),
                    "target_audience": data.get("target_audience", "General audience"),
                    "image_prompt": data.get("image_prompt", _fallback_image_prompt(original_title))
                }
        except Exception as e:
            print(f"[ContentWriting] Gemini Regeneration API call failed: {e}. Applying heuristic improvement.")

    # Fallback: apply the opinion as a prefix note to the existing content
    improved_caption = (
        f"[IMPROVED BASED ON FEEDBACK: {user_opinion[:100]}]\n\n"
        + original_caption
        + "\n\n✅ Updated to better serve our audience with clearer messaging and stronger impact."
    )
    return {
        "title": original_title,
        "caption": improved_caption,
        "description": original_description + f"\n\n[Improvement Applied: {user_opinion}]",
        "cta": "Take action now — don't miss this opportunity!",
        "key_points": [user_opinion[:80]],
        "target_audience": "General audience",
        "image_prompt": _fallback_image_prompt(original_title)
    }


# ─── Private helpers ────────────────────────────────────────────────────────

def _fallback_image_prompt(prompt_text: str) -> str:
    """Derive a contextual image prompt from keywords in the topic."""
    text_lower = prompt_text.lower()
    if any(w in text_lower for w in ["tech", "developer", "code", "software", "hackathon", "ai", "digital"]):
        return (
            "A dynamic digital illustration of developers and engineers collaborating with holographic "
            "code streams and data visualizations, neon blue and purple cyberpunk lighting, dark futuristic "
            "background, high energy and innovation atmosphere."
        )
    elif any(w in text_lower for w in ["food", "restaurant", "eat", "chef", "meal", "drink"]):
        return (
            "A stunning food photography scene with vibrant, fresh ingredients artfully arranged, "
            "warm golden lighting, shallow depth of field, rustic wooden backdrop with modern accents, "
            "appetizing and inviting mood."
        )
    elif any(w in text_lower for w in ["health", "fitness", "workout", "gym", "wellness", "sport"]):
        return (
            "An energetic fitness scene with dynamic motion blur effects, bright natural sunlight, "
            "vibrant green and orange color palette, people in action achieving their goals, "
            "motivational and powerful atmosphere."
        )
    elif any(w in text_lower for w in ["business", "launch", "product", "startup", "company", "brand"]):
        return (
            "A sleek corporate product launch scene with dramatic spotlight lighting on a hero product, "
            "dark gradient background with gold and white accents, professional and premium feel, "
            "minimalist composition with bold typography space."
        )
    elif any(w in text_lower for w in ["event", "festival", "party", "concert", "conference"]):
        return (
            "A vibrant event scene with colorful stage lighting, energetic crowd, confetti and spotlights, "
            "electric atmosphere with purple and yellow color scheme, excitement and celebration mood."
        )
    else:
        return (
            "A modern, professional digital marketing visual with abstract geometric shapes, "
            "gradient color palette from deep indigo to electric purple, clean layout with space for text, "
            "contemporary design with subtle tech-inspired elements."
        )


def _fallback_caption(prompt_text: str, tone: str) -> str:
    """Generate a rich heuristic caption based on tone."""
    if tone.lower() == "friendly":
        return (
            f"Hey fam! 👋✨\n\n"
            f"We've got something truly exciting to share with you today, and we couldn't wait any longer! "
            f"After weeks of preparation, long nights, and countless cups of coffee ☕, we're thrilled to announce:\n\n"
            f"➡️ {prompt_text}\n\n"
            f"This is something we built with YOU in mind. Every decision was made thinking about how we could make "
            f"your experience better, more seamless, and honestly — a lot more fun! 🎉\n\n"
            f"We'd love to hear your thoughts. What excites you most about this? Drop your reactions below! 👇💬"
        )
    elif tone.lower() == "witty/creative":
        return (
            f"Plot twist: we actually did it. 😎🔥\n\n"
            f"You know those things people say 'someone should really do that someday'? "
            f"Well, consider 'someday' officially CANCELLED. Introducing:\n\n"
            f"⚡ {prompt_text} ⚡\n\n"
            f"Was it easy? Absolutely not. Was it worth it? We'll let you be the judge. "
            f"(Spoiler: it was 100% worth it. We promise.)\n\n"
            f"Go ahead, scroll back up, take another look. We'll wait. 😏\n\n"
            f"Ready to experience it for yourself? Tap that link and let's get into it! 🚀"
        )
    elif tone.lower() == "bold":
        return (
            f"THIS. CHANGES. EVERYTHING. ⚡💥\n\n"
            f"No more half-measures. No more waiting. The time is NOW.\n\n"
            f"Introducing: {prompt_text.upper()}\n\n"
            f"We built this for the doers, the makers, the ones who refuse to settle. "
            f"If you've been looking for the edge that separates good from GREAT — you just found it.\n\n"
            f"🔥 Bigger. Faster. Bolder. 🔥\n\n"
            f"The only question is: are you in, or are you going to let this pass you by? "
            f"Make your move. Hit the link NOW. 💪"
        )
    else:  # Professional
        return (
            f"We are proud to share an important update with our community. 🎯\n\n"
            f"After extensive research, development, and collaboration with industry experts, "
            f"we are pleased to officially announce:\n\n"
            f"📌 {prompt_text}\n\n"
            f"This initiative represents a significant step forward in our commitment to delivering "
            f"exceptional value to our stakeholders. We have carefully considered every aspect of the "
            f"implementation to ensure the highest standards of quality and impact.\n\n"
            f"Key highlights include enhanced efficiency, measurable outcomes, and a scalable framework "
            f"designed to grow with your needs.\n\n"
            f"We invite you to explore this further and join the conversation. Your perspective matters. 💼"
        )


def _heuristic_content(prompt_text: str, tone: str) -> dict:
    """Comprehensive heuristic content generation without API."""
    topic_words = prompt_text.split()
    title_core = " ".join(topic_words[:6]).title() if len(topic_words) > 3 else prompt_text.title()
    if len(title_core) > 70:
        title_core = title_core[:67] + "..."

    title_prefixes = {
        "friendly": "🎉 Exciting News:",
        "witty/creative": "⚡ Plot Twist:",
        "bold": "🔥 Game Changer:",
        "professional": "📢 Official Announcement:"
    }
    prefix = title_prefixes.get(tone.lower(), "📢 Announcement:")
    title = f"{prefix} {title_core}"

    caption = _fallback_caption(prompt_text, tone)

    description = (
        f"## Overview\n\n"
        f"Today marks an exciting milestone as we announce: {prompt_text}. "
        f"This development is the result of dedicated effort and a clear vision for what our community needs most.\n\n"
        f"## Why This Matters\n\n"
        f"In today's rapidly evolving landscape, staying ahead requires constant innovation. "
        f"This announcement directly addresses the challenges our audience faces daily — providing "
        f"a solution that is both practical and transformative in equal measure.\n\n"
        f"## What to Expect\n\n"
        f"From the moment you engage with this, you will notice a difference. "
        f"We've prioritized user experience, performance, and accessibility throughout every stage "
        f"of development. Our team worked tirelessly to ensure that every detail serves a purpose.\n\n"
        f"## Key Benefits\n\n"
        f"• Streamlined workflow and improved efficiency across all touchpoints\n"
        f"• Measurable impact on productivity and engagement metrics\n"
        f"• Scalable design that evolves with your growing needs\n"
        f"• Built-in analytics to track and optimize performance over time\n"
        f"• Community-first approach ensuring inclusive, accessible experiences\n\n"
        f"## Join the Movement\n\n"
        f"We believe that the best innovations happen when a community rallies around a shared vision. "
        f"That is exactly what we are building here — not just a product or service, but a movement. "
        f"We invite you to be part of it from day one.\n\n"
        f"Share this post, tag someone who needs to hear about this, and let's grow together. "
        f"The future starts now."
    )

    key_points = [
        f"Official announcement: {prompt_text[:60]}",
        "Built with community feedback and real-world insights",
        "Designed for scalability, performance, and accessibility",
        "Available now — no waiting, no waitlists",
        "Join a growing community of early adopters and innovators",
        "Track impact with built-in analytics and reporting tools"
    ]

    return {
        "title": title,
        "caption": caption,
        "description": description,
        "cta": "Click the link in our bio to learn more and get started today! 🚀",
        "key_points": key_points,
        "target_audience": "Innovators, professionals, and forward-thinking individuals looking to level up.",
        "image_prompt": _fallback_image_prompt(prompt_text)
    }
