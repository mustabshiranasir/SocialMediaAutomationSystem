import datetime
import sys
import os

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User, Campaign, LinkedAccount, Prompt, Draft, PublishedPost, Analytics
from app.routers.content_ideas import ContentIdea
from app.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if DB already seeded
        if db.query(User).filter(User.email == "admin@social.com").first():
            print("Database already contains seed data.")
            return

        print("Seeding database with development data...")

        # 1. Users
        admin_user = User(
            name="Admin User",
            email="admin@social.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        demo_user = User(
            name="Demo Marketer",
            email="demo@social.com",
            hashed_password=get_password_hash("demo123"),
            role="requester"
        )
        db.add_all([admin_user, demo_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(demo_user)

        # 2. Campaigns
        campaign_q4 = Campaign(
            user_id=admin_user.id,
            name="Q4 Product Launch & Scale",
            target_platforms="linkedin,twitter,facebook",
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=30)
        )
        campaign_brand = Campaign(
            user_id=admin_user.id,
            name="Brand Awareness 2026",
            target_platforms="instagram,tiktok,youtube",
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=60)
        )
        db.add_all([campaign_q4, campaign_brand])
        db.commit()
        db.refresh(campaign_q4)

        # 3. Linked Accounts
        acc_linkedin = LinkedAccount(
            user_id=admin_user.id,
            platform="linkedin",
            oauth_token="mock_linkedin_oauth_token_12345",
            status="active"
        )
        acc_twitter = LinkedAccount(
            user_id=admin_user.id,
            platform="twitter",
            oauth_token="mock_twitter_oauth_token_67890",
            status="active"
        )
        acc_instagram = LinkedAccount(
            user_id=admin_user.id,
            platform="instagram",
            oauth_token="mock_instagram_oauth_token_11223",
            status="active"
        )
        db.add_all([acc_linkedin, acc_twitter, acc_instagram])

        # 4. Prompts
        p1 = Prompt(
            user_id=admin_user.id,
            campaign_id=campaign_q4.id,
            prompt_text="Create an engaging LinkedIn post introducing our new AI content scheduling features.",
            target_platforms="linkedin,twitter"
        )
        db.add(p1)
        db.commit()
        db.refresh(p1)

        # 5. Drafts
        d1 = Draft(
            prompt_id=p1.id,
            campaign_id=campaign_q4.id,
            title="High-Quality Lead Generation Tips",
            caption="🚀 Exciting news! We just launched our AI Social Media Engine. Streamline your content scheduling today!",
            description="Detailed B2B lead generation guide",
            hashtags="#AI #Marketing #LeadGen",
            status="Approved"
        )
        d2 = Draft(
            prompt_id=p1.id,
            campaign_id=campaign_q4.id,
            title="Automate Your Social Strategy",
            caption="Automate your social strategy with AI! 🤖 Check out our new platform here: https://clicktaketech.com",
            description="Cross-platform automated workflow teaser",
            hashtags="#Automation #SocialMedia",
            status="Published"
        )
        db.add_all([d1, d2])
        db.commit()
        db.refresh(d2)

        # 6. Published Post & Analytics
        pub1 = PublishedPost(
            draft_id=d2.id,
            platform="twitter",
            platform_post_id="tw_post_1001",
            status="success"
        )
        db.add(pub1)
        db.commit()
        db.refresh(pub1)

        an1 = Analytics(
            published_post_id=pub1.id,
            likes=185,
            shares=34,
            reach=1420,
            comments=12,
            ctr=3.8
        )
        db.add(an1)

        # 7. Content Ideas
        idea1 = ContentIdea(
            user_id=admin_user.id,
            title="High-Quality Lead Generation Tips",
            content_preview="5 proven strategies for scaling B2B content marketing using automated workflows and targeted distribution channels.",
            platforms="linkedin,twitter",
            status="Draft",
            tags="leads,B2B",
            link_url="https://www.clicktaketech.com/",
            first_comment="Why are your lead generation efforts falling short?",
            is_starred=True
        )
        idea2 = ContentIdea(
            user_id=admin_user.id,
            title="Q4 Product Feature Launch Announcement",
            content_preview="Highlighting our new AI-assisted post scheduling engine and cross-channel analytics suite.",
            platforms="instagram,facebook",
            status="Scheduled",
            tags="launch,q4",
            link_url="https://www.clicktaketech.com/features",
            first_comment="What feature are you most excited for?",
            is_starred=False
        )
        db.add_all([idea1, idea2])

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print("Error seeding database:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
