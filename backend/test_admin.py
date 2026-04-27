import requests
import time

BASE_URL = "http://127.0.0.1:8000"

print("--- TESTING ADMIN FORCE-RESET PASSWORD ---\n")

# 1. Login as an Admin
# We temporarily made Directorate A -> Information Technology an admin in the backend.
print("[1] Logging in as Admin (Information Technology)...")
res1 = requests.post(f"{BASE_URL}/department/login", json={
    "directorate": "A",
    "name": "Information Technology",
    "password": "a123"
})
if res1.status_code != 200:
    print(f"FAILED TO LOGIN: {res1.text}")
    exit()

admin_token = res1.json().get("access_token")
print(f"✅ Success! Admin Token Received: {admin_token[:15]}...\n")


# 2. Use the Admin Token to forcefully reset Directorate C (Human Resources) password
print("[2] Admin is force-resetting Directorate C (Human Resources) password to 'hacked_pass'...")
res2 = requests.put(f"{BASE_URL}/department/admin/force-reset-password", 
    json={
        "directorate": "C",
        "name": "Human Resources",
        "password": "hacked_pass" # The new password the admin is setting!
    },
    headers={"Authorization": f"Bearer {admin_token}"}
)

print(f"✅ Admin Response: {res2.json()}\n")

time.sleep(1)

# 3. Prove it worked by having Human Resources log in with their NEW password
print("[3] Testing Human Resources login with the NEW password ('hacked_pass')...")
res3 = requests.post(f"{BASE_URL}/department/login", json={
    "directorate": "C",
    "name": "Human Resources",
    "password": "hacked_pass"
})

if res3.status_code == 200:
    print(f"✅ Success! Human Resources logged in with their new password!")
    print(f"HR Token Received: {res3.json().get('access_token')[:15]}...")
else:
    print(f"❌ Failed to login with new password: {res3.text}")
