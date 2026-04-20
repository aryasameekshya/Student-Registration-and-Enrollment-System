import requests

BASE_URL = "http://localhost:5000"

def test_backend():
    try:
        # Check if backend is running
        res = requests.get(f"{BASE_URL}/")
        print(f"Backend status: {res.json()}")
        
        # Test getting courses
        res = requests.get(f"{BASE_URL}/courses")
        print(f"Courses: {res.json()}")
    except Exception as e:
        print(f"Error connecting to backend: {e}. (Make sure to run 'python backend/app.py' in a terminal)")

if __name__ == "__main__":
    test_backend()
