import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_workflow():
    print("=== Social Media Content Engine End-to-End API Test ===")
    
    # 1. Create Admin User
    print("\n1. Registering new admin account...")
    reg_payload = {
        "name": "Maria Noor",
        "email": "admin@social.com",
        "password": "adminpassword123",
        "role": "admin"
    }
    res_reg = requests.post(f"{API_BASE}/api/auth/register", json=reg_payload)
    if res_reg.status_code == 200:
        print("Success: Registered.")
        token_data = res_reg.json()
    else:
        # Try logging in instead if already registered
        print("User might exist, trying to login...")
        login_data = {
            "username": "admin@social.com",
            "password": "adminpassword123"
        }
        res_login = requests.post(f"{API_BASE}/api/auth/login", data=login_data)
        if res_login.status_code == 200:
            print("Success: Logged in.")
            token_data = res_login.json()
        else:
            print(f"Failed to authenticate: {res_login.status_code} - {res_login.text}")
            return

    token = token_data["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 2. Connect Social Accounts (LinkedIn and Instagram)
    print("\n2. Linking LinkedIn and Instagram mock channels...")
    requests.post(f"{API_BASE}/api/accounts/link?platform=linkedin", headers=headers)
    requests.post(f"{API_BASE}/api/accounts/link?platform=instagram", headers=headers)
    
    res_accounts = requests.get(f"{API_BASE}/api/accounts", headers=headers)
    print(f"Connected channels: {[a['platform'] for a in res_accounts.json()]}")

    # 3. Submit Prompt to AI Skills Engine Orchestrator
    print("\n3. Submitting prompt campaign: 'Announce launch of our new AI editor'...")
    prompt_payload = {
        "prompt_text": "Announce the launch of our new AI-Powered MVC social media editor code template, built with FastAPI and React.",
        "target_platforms": ["linkedin", "instagram"],
        "tone": "Bold"
    }
    res_prompt = requests.post(f"{API_BASE}/api/prompt", json=prompt_payload, headers=headers)
    if res_prompt.status_code == 200:
        draft = res_prompt.json()
        print(f"Success: Orchestrated Draft #{draft['id']}")
        print(f"Title: {draft['title']}")
        print(f"Hashtags: {draft['hashtags']}")
        print(f"Image Path: {draft['image_url']}")
        print(f"Status: {draft['status']}")
    else:
        print(f"Failed: {res_prompt.status_code} - {res_prompt.text}")
        return

    # 4. View Draft Review Queue
    print("\n4. Retrieving draft queue...")
    res_queue = requests.get(f"{API_BASE}/api/drafts", headers=headers)
    print(f"Total drafts in queue: {len(res_queue.json())}")

    # 5. Approve Draft (Triggers state machine transition & automated publishing)
    print(f"\n5. Approving Draft #{draft['id']}...")
    res_approve = requests.post(f"{API_BASE}/api/drafts/{draft['id']}/approve", headers=headers)
    if res_approve.status_code == 200:
        approved_draft = res_approve.json()
        print(f"Success: Status updated to '{approved_draft['status']}'")
    else:
        print(f"Failed to approve: {res_approve.status_code} - {res_approve.text}")
        return

    # 6. Retrieve Post Engagement Analytics
    print("\n6. Fetching engagement metrics dashboard...")
    time.sleep(1) # wait for DB write
    res_analytics = requests.get(f"{API_BASE}/api/analytics", headers=headers)
    print(f"Overview Analytics: {json.dumps(res_analytics.json(), indent=2)}")

if __name__ == "__main__":
    test_workflow()
