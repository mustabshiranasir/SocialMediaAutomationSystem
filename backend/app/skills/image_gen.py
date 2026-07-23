import os
import random
import math
from PIL import Image, ImageDraw, ImageFont

# ─── Topic-to-Visual Mapping ────────────────────────────────────────────────
# Maps content keywords to rich contextual color palettes and visual themes

_TOPIC_THEMES = {
    "tech": {
        "palettes": [((10, 10, 30), (20, 60, 140)), ((5, 5, 25), (60, 20, 120)), ((8, 15, 45), (15, 80, 160))],
        "accent": (0, 200, 255, 200),
        "particle_color": (100, 180, 255, 120),
        "badge_text": "TECH & INNOVATION",
    },
    "developer": {
        "palettes": [((10, 10, 30), (20, 60, 140)), ((15, 5, 40), (80, 20, 150))],
        "accent": (120, 80, 255, 200),
        "particle_color": (180, 140, 255, 120),
        "badge_text": "DEVELOPER UPDATE",
    },
    "hackathon": {
        "palettes": [((5, 0, 20), (80, 20, 120)), ((10, 5, 30), (120, 40, 160))],
        "accent": (255, 80, 200, 200),
        "particle_color": (255, 120, 220, 120),
        "badge_text": "HACKATHON",
    },
    "food": {
        "palettes": [((80, 30, 10), (200, 100, 20)), ((60, 20, 0), (180, 80, 10))],
        "accent": (255, 180, 50, 200),
        "particle_color": (255, 200, 80, 120),
        "badge_text": "FOOD & LIFESTYLE",
    },
    "health": {
        "palettes": [((10, 50, 30), (20, 140, 80)), ((5, 40, 20), (10, 120, 60))],
        "accent": (80, 255, 140, 200),
        "particle_color": (120, 255, 160, 120),
        "badge_text": "HEALTH & WELLNESS",
    },
    "fitness": {
        "palettes": [((30, 10, 0), (180, 80, 0)), ((20, 50, 5), (100, 180, 10))],
        "accent": (255, 140, 0, 200),
        "particle_color": (255, 160, 40, 120),
        "badge_text": "FITNESS & SPORT",
    },
    "business": {
        "palettes": [((10, 10, 20), (30, 30, 80)), ((15, 10, 5), (60, 50, 10))],
        "accent": (220, 180, 60, 200),
        "particle_color": (240, 200, 80, 120),
        "badge_text": "BUSINESS & GROWTH",
    },
    "launch": {
        "palettes": [((20, 5, 30), (100, 20, 120)), ((10, 0, 40), (80, 10, 160))],
        "accent": (255, 100, 200, 200),
        "particle_color": (255, 140, 220, 120),
        "badge_text": "PRODUCT LAUNCH",
    },
    "event": {
        "palettes": [((30, 0, 60), (100, 0, 140)), ((20, 10, 50), (80, 20, 120))],
        "accent": (255, 200, 50, 200),
        "particle_color": (255, 220, 80, 120),
        "badge_text": "EVENT & EXPERIENCE",
    },
    "marketing": {
        "palettes": [((10, 5, 40), (80, 10, 120)), ((30, 0, 60), (120, 20, 180))],
        "accent": (255, 80, 160, 200),
        "particle_color": (255, 120, 180, 120),
        "badge_text": "MARKETING CAMPAIGN",
    },
    "default": {
        "palettes": [((20, 10, 60), (100, 20, 160)), ((10, 20, 70), (40, 80, 180)), ((30, 5, 60), (90, 10, 140))],
        "accent": (140, 100, 255, 200),
        "particle_color": (180, 140, 255, 120),
        "badge_text": "CAMPAIGN DRAFT",
    }
}


def _get_theme(image_prompt: str, title: str) -> dict:
    """Derive visual theme from image_prompt and title keywords."""
    combined = (image_prompt + " " + title).lower()
    for keyword in ["hackathon", "developer", "fitness", "launch", "health", "event", "marketing",
                    "food", "business", "tech"]:
        if keyword in combined:
            return _TOPIC_THEMES[keyword]
    # Secondary keyword check
    if any(w in combined for w in ["code", "software", "ai", "digital", "programming"]):
        return _TOPIC_THEMES["tech"]
    if any(w in combined for w in ["product", "startup", "company", "brand"]):
        return _TOPIC_THEMES["business"]
    if any(w in combined for w in ["party", "festival", "concert", "conference", "meet"]):
        return _TOPIC_THEMES["event"]
    return _TOPIC_THEMES["default"]


def _draw_gradient(draw: ImageDraw, width: int, height: int, c1: tuple, c2: tuple):
    """Draw a smooth vertical gradient background."""
    for y in range(height):
        t = y / height
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))


def _draw_decorative_particles(draw: ImageDraw, width: int, height: int,
                                color: tuple, count: int = 18, seed: int = 42):
    """Scatter glowing circular particles for a premium look."""
    rng = random.Random(seed)
    for _ in range(count):
        x = rng.randint(0, width)
        y = rng.randint(0, height)
        radius = rng.randint(4, 22)
        # Outer glow
        for layer in range(4, 0, -1):
            alpha = int(color[3] * (layer / 4) * 0.5)
            r_layer = radius + layer * 4
            draw.ellipse(
                [(x - r_layer, y - r_layer), (x + r_layer, y + r_layer)],
                fill=(color[0], color[1], color[2], alpha)
            )
        # Core dot
        draw.ellipse(
            [(x - radius, y - radius), (x + radius, y + radius)],
            fill=(color[0], color[1], color[2], min(color[3], 255))
        )


def _draw_grid_lines(draw: ImageDraw, width: int, height: int, color: tuple):
    """Draw subtle grid lines for a modern tech aesthetic."""
    grid_alpha = 18
    step = 90
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=(color[0], color[1], color[2], grid_alpha), width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=(color[0], color[1], color[2], grid_alpha), width=1)


def _draw_corner_accents(draw: ImageDraw, width: int, height: int, color: tuple):
    """Draw glowing corner accent arcs."""
    arc_size = 120
    lw = 3
    a = (color[0], color[1], color[2], 100)
    # Top-left
    draw.arc([(0, 0), (arc_size, arc_size)], 90, 180, fill=a, width=lw)
    # Top-right
    draw.arc([(width - arc_size, 0), (width, arc_size)], 0, 90, fill=a, width=lw)
    # Bottom-left
    draw.arc([(0, height - arc_size), (arc_size, height)], 180, 270, fill=a, width=lw)
    # Bottom-right
    draw.arc([(width - arc_size, height - arc_size), (width, height)], 270, 360, fill=a, width=lw)


def _wrap_text(text: str, font: ImageFont, max_width: int, draw: ImageDraw) -> list:
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def generate_image(draft_id: int, title: str, category: str = "Marketing",
                   image_prompt: str = "") -> str:
    """
    Skill 3: Contextual Image Generation Skill.
    Uses Pillow to generate a premium, topic-aware social media graphic card.
    Derives color palette, badge text, and visual elements from image_prompt and title.
    """
    static_dir = os.path.join("static", "media")
    os.makedirs(static_dir, exist_ok=True)
    filename = f"draft_{draft_id}.png"
    filepath = os.path.join(static_dir, filename)

    # Canvas: 1080×1080 square (optimal for Instagram/LinkedIn)
    width, height = 1080, 1080
    img = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(img)

    # ── 1. Derive contextual theme ──────────────────────────────────────────
    theme = _get_theme(image_prompt, title)
    palette = random.choice(theme["palettes"])
    accent = theme["accent"]
    particle_color = theme["particle_color"]
    badge_text = theme["badge_text"]

    # ── 2. Gradient background ──────────────────────────────────────────────
    _draw_gradient(draw, width, height, palette[0], palette[1])

    # ── 3. Subtle grid overlay ──────────────────────────────────────────────
    _draw_grid_lines(draw, width, height, accent)

    # ── 4. Decorative particles (unique per draft) ──────────────────────────
    _draw_decorative_particles(draw, width, height, particle_color, count=20, seed=draft_id * 7)

    # ── 5. Corner accent arcs ───────────────────────────────────────────────
    _draw_corner_accents(draw, width, height, accent)

    # ── 6. Diagonal accent stripe ───────────────────────────────────────────
    stripe_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    stripe_draw = ImageDraw.Draw(stripe_overlay)
    stripe_draw.polygon(
        [(width * 0.6, 0), (width, 0), (width, height * 0.35)],
        fill=(accent[0], accent[1], accent[2], 18)
    )
    img = Image.alpha_composite(img, stripe_overlay)
    draw = ImageDraw.Draw(img)

    # ── 7. Main glassmorphism card ──────────────────────────────────────────
    card_margin = 80
    cx0, cy0 = card_margin, card_margin
    cx1, cy1 = width - card_margin, height - card_margin
    card_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_overlay)
    card_draw.rounded_rectangle(
        [(cx0, cy0), (cx1, cy1)],
        radius=36,
        fill=(255, 255, 255, 16),
        outline=(accent[0], accent[1], accent[2], 80),
        width=2
    )
    img = Image.alpha_composite(img, card_overlay)
    draw = ImageDraw.Draw(img)

    # ── 8. Inner highlight bar at top of card ──────────────────────────────
    draw.rectangle(
        [(cx0, cy0), (cx1, cy0 + 6)],
        fill=(accent[0], accent[1], accent[2], 160)
    )

    # ── 9. Load fonts ───────────────────────────────────────────────────────
    font_paths = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "arial.ttf"
    ]
    font_path = next((p for p in font_paths if os.path.exists(p)), None)

    def get_font(size):
        if font_path:
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                pass
        return ImageFont.load_default()

    font_badge = get_font(22)
    font_title = get_font(58)
    font_subtitle = get_font(30)
    font_footer = get_font(24)
    font_prompt_label = get_font(20)

    # ── 10. Badge pill ──────────────────────────────────────────────────────
    badge_x0, badge_y0 = cx0 + 50, cy0 + 50
    badge_padding = 16
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = badge_bbox[2] - badge_bbox[0] + badge_padding * 2
    badge_h = 38
    draw.rounded_rectangle(
        [(badge_x0, badge_y0), (badge_x0 + badge_w, badge_y0 + badge_h)],
        radius=8,
        fill=(accent[0], accent[1], accent[2], 190)
    )
    draw.text(
        (badge_x0 + badge_padding, badge_y0 + (badge_h - (badge_bbox[3] - badge_bbox[1])) // 2),
        badge_text, font=font_badge, fill=(255, 255, 255, 255)
    )

    # ── 11. Wrapped title ───────────────────────────────────────────────────
    text_area_width = cx1 - cx0 - 100
    title_lines = _wrap_text(title, font_title, text_area_width, draw)

    title_y = cy0 + 140
    for line in title_lines[:3]:  # max 3 lines
        # Subtle shadow
        draw.text((cx0 + 52, title_y + 3), line, font=font_title, fill=(0, 0, 0, 100))
        draw.text((cx0 + 50, title_y), line, font=font_title, fill=(255, 255, 255, 255))
        title_y += 75

    # ── 12. Accent line under title ────────────────────────────────────────
    line_y = title_y + 12
    draw.rectangle(
        [(cx0 + 50, line_y), (cx0 + 200, line_y + 3)],
        fill=(accent[0], accent[1], accent[2], 200)
    )

    # ── 13. Visual description snippet (first 80 chars of image_prompt) ────
    if image_prompt:
        snippet = image_prompt[:90] + ("..." if len(image_prompt) > 90 else "")
        snippet_lines = _wrap_text(snippet, font_prompt_label, text_area_width, draw)
        snippet_y = line_y + 24
        for sline in snippet_lines[:3]:
            draw.text(
                (cx0 + 50, snippet_y),
                sline, font=font_prompt_label,
                fill=(255, 255, 255, 110)
            )
            snippet_y += 28

    # ── 14. Footer bar ─────────────────────────────────────────────────────
    footer_y = cy1 - 90
    draw.rectangle(
        [(cx0, footer_y), (cx1, cy1)],
        fill=(0, 0, 0, 60)
    )
    draw.text(
        (cx0 + 50, footer_y + 22),
        f"ClickTake Content Engine  •  {category}",
        font=font_footer,
        fill=(255, 255, 255, 160)
    )

    # ── 15. Bottom-right logo accent ───────────────────────────────────────
    logo_cx, logo_cy = cx1 - 55, cy1 - 48
    logo_r = 20
    draw.ellipse(
        [(logo_cx - logo_r, logo_cy - logo_r), (logo_cx + logo_r, logo_cy + logo_r)],
        fill=(accent[0], accent[1], accent[2], 180)
    )
    draw.text(
        (logo_cx - 8, logo_cy - 10),
        "⚡", font=get_font(18), fill=(255, 255, 255, 240)
    )

    # ── 16. Save ────────────────────────────────────────────────────────────
    img.save(filepath, "PNG")
    return f"/static/media/{filename}"
