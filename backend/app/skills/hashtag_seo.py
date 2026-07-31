import os
import json
import requests

def generate_hashtags(prompt_text: str, caption: str) -> str:
    """
    Skill 2: Hashtag & SEO Skill.
    Extracts keywords and generates relevant hashtags.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    groq_api_key = os.environ.get("GROQ_API_KEY")
    
    prompt = f"Generate exactly 5-10 relevant and trending social media hashtags as a space-separated string based on this prompt: '{prompt_text}' and caption: '{caption}'. Do not return any other text, just the hashtags."

    if groq_api_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama3-70b-8192",
                "messages": [{"role": "user", "content": prompt}]
            }
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            if response.status_code == 200:
                result_json = response.json()
                hashtags = result_json['choices'][0]['message']['content'].strip()
                hashtags = hashtags.replace("\n", " ").replace(",", " ")
                return hashtags
        except Exception:
            pass
            
    if gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }]
            }
            response = requests.post(url, headers=headers, json=payload, timeout=3)
            if response.status_code == 200:
                result_json = response.json()
                hashtags = result_json['contents'][0]['parts'][0]['text'].strip()
                # Clean up format in case it wrapped or added markdown
                hashtags = hashtags.replace("\n", " ").replace(",", " ")
                return hashtags
        except Exception:
            pass

    # Heuristic fallback (offline mode)
    combined = (prompt_text + " " + caption).lower()
    words = combined.split()
    
    # Simple list of stop words to filter out
    stop_words = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for", "with", "in", "on", "at", "from", "by", "of", "about", "for", "our", "your", "we", "i", "you"}
    
    unique_words = []
    for w in words:
        clean_word = "".join(filter(str.isalnum, w))
        if clean_word and clean_word not in stop_words and len(clean_word) > 3:
            if clean_word not in unique_words:
                unique_words.append(clean_word)
                
    # Add generic high-traffic marketing tags
    generic_tags = ["socialmedia", "trending", "innovation", "tech", "marketing"]
    for tag in generic_tags:
        if len(unique_words) < 8 and tag not in unique_words:
            unique_words.append(tag)
            
    # Format as hashtags
    hashtags = " ".join([f"#{w}" for w in unique_words[:8]])
    return hashtags
