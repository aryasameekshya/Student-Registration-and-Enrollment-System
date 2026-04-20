import requests
import uuid

BASE_URL = "http://localhost:5000"

def test_full_auth_flow():
    # Use a unique email for each test run
    test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    test_password = "password123"
    test_name = "Test User"
    
    print(f"--- Starting Auth Flow Test ---")
    print(f"Target Email: {test_email}")

    # Create a session to maintain cookies
    session = requests.Session()

    # 1. Register
    reg_data = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "role": "student"
    }
    print("\n1. Testing Registration...")
    try:
        reg_res = session.post(f"{BASE_URL}/register", json=reg_data)
        print(f"Status: {reg_res.status_code}")
        print(f"Response: {reg_res.json()}")
        if reg_res.status_code != 201:
            print("Registration failed!")
            return
    except Exception as e:
        print(f"Registration Error: {e}")
        return

    # 2. Login
    login_data = {
        "email": test_email,
        "password": test_password
    }
    print("\n2. Testing Login...")
    try:
        login_res = session.post(f"{BASE_URL}/login", json=login_data)
        print(f"Status: {login_res.status_code}")
        print(f"Response: {login_res.json()}")
        if login_res.status_code != 200:
            print("Login failed!")
            return
    except Exception as e:
        print(f"Login Error: {e}")
        return

    # 3. Access Profile (Verify Session)
    print("\n3. Testing Profile Access (Session Verification)...")
    try:
        prof_res = session.get(f"{BASE_URL}/student/profile")
        print(f"Status: {prof_res.status_code}")
        print(f"Response: {prof_res.json()}")
        if prof_res.status_code == 200 and prof_res.json().get('email') == test_email:
            print("\nSUCCESS: Auth flow working perfectly! 🎉")
        else:
            print("\nFAILURE: Profile access failed or session not maintained.")
    except Exception as e:
        print(f"Profile Access Error: {e}")

if __name__ == "__main__":
    test_full_auth_flow()
