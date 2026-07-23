import logging
import os
import datetime
import json

# Set up simple logging to simulate push alerts
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Notifications")

def send_lifecycle_notification(event_type: str, details: dict):
    """
    Skill 7: Communication & Notification Skill.
    Dispatches and logs push notifications for campaign states.
    """
    # Event types: "draft_ready", "draft_approved", "post_published", "publish_failed"
    msg = ""
    if event_type == "draft_ready":
        msg = f"🔔 Draft #{details.get('draft_id')} is ready for review by Admin."
    elif event_type == "draft_approved":
        msg = f"✅ Draft #{details.get('draft_id')} has been approved and queued for publish."
    elif event_type == "draft_rejected":
        msg = f"❌ Draft #{details.get('draft_id')} has been rejected. Feedback: '{details.get('comment')}'"
    elif event_type == "draft_improved":
        msg = f"✨ Draft #{details.get('draft_id')} was AI-improved based on feedback: '{details.get('feedback', '')}...'"
    elif event_type == "post_published":
        msg = f"🚀 Draft #{details.get('draft_id')} published to {details.get('platform')} successfully! Post ID: {details.get('post_id')}."
    elif event_type == "publish_failed":
        msg = f"⚠️ Failed to publish Draft #{details.get('draft_id')} to {details.get('platform')}. Reason: Connection timeout."
    
    logger.info(msg)
    
    try:
        notifications_log = os.path.join("static", "notifications.json")
        # Ensure static folder exists
        os.makedirs("static", exist_ok=True)
        
        events = []
        if os.path.exists(notifications_log):
            with open(notifications_log, "r") as f:
                try:
                    events = json.load(f)
                except Exception:
                    events = []
                
        events.insert(0, {
            "id": len(events) + 1,
            "type": event_type,
            "message": msg,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        
        # Limit to last 20 notifications
        with open(notifications_log, "w") as f:
            json.dump(events[:20], f, default=str)
    except Exception as e:
        logger.error(f"Error logging notification: {e}")
    
    return msg
