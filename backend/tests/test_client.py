from fastapi.testclient import TestClient
from app.main import app

def test_all():
    client = TestClient(app)
    
    # 1. Auth / Register
    email = "testadmin@social.com"
    res_reg = client.post("/api/auth/register", json={
        "name": "Test Admin",
        "email": email,
        "password": "password123",
        "role": "admin"
    })
    if res_reg.status_code == 200:
        token = res_reg.json()["access_token"]
    else:
        res_login = client.post("/api/auth/login", data={"username": email, "password": "password123"})
        token = res_login.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Link accounts
    client.post("/api/accounts/link?platform=linkedin", headers=headers)

    # 3. Create prompt & draft
    res_prompt = client.post("/api/prompt", json={
        "prompt_text": "New Product Launch for Social Engine",
        "target_platforms": ["linkedin", "instagram"],
        "tone": "Bold"
    }, headers=headers)
    assert res_prompt.status_code == 200, res_prompt.text
    draft = res_prompt.json()
    draft_id = draft["id"]
    print(f"Created Draft #{draft_id}")

    # 4. Edit content
    res_edit = client.put(f"/api/drafts/{draft_id}/content", json={
        "title": "Edited Product Launch Title",
        "caption": "Updated caption with more details and emojis 🚀",
        "hashtags": "#edited #socialengine"
    }, headers=headers)
    assert res_edit.status_code == 200, res_edit.text
    edited_draft = res_edit.json()
    assert edited_draft["title"] == "Edited Product Launch Title"
    print(f"Successfully edited Draft #{draft_id}")

    # 5. Approve & Publish
    res_approve = client.post(f"/api/drafts/{draft_id}/approve", headers=headers)
    assert res_approve.status_code == 200, res_approve.text
    approved = res_approve.json()
    assert approved["status"] == "Published"
    print(f"Successfully Approved and Published Draft #{draft_id}")

    # 6. Force Publish endpoint
    res_publish = client.post(f"/api/publish/{draft_id}", headers=headers)
    assert res_publish.status_code == 200, res_publish.text
    print(f"Force Publish verified for Draft #{draft_id}")

if __name__ == "__main__":
    test_all()
    print("ALL TESTS PASSED SUCCESSFULLY!")
