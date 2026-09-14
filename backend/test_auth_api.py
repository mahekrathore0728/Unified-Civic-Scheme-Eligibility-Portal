import unittest
import json
import time
from app import app
from database import get_db_connection

class TestAuthAndPart2APIs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        # Verify DB connection works
        try:
            conn = get_db_connection()
            conn.close()
            cls.db_available = True
        except Exception as e:
            cls.db_available = False
            print(f"[Notice] MySQL connection check: {e}")

    def test_01_health_and_part1_schemes(self):
        """Verify that existing Part 1 endpoints still work."""
        res = self.client.get("/api/schemes")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)
        print(f"PASS: /api/schemes returned {len(data['data'])} schemes.")

    def test_02_part1_eligibility(self):
        """Verify that existing Part 1 eligibility evaluation still works."""
        payload = {
            "age": 35,
            "gender": "Male",
            "state": "Maharashtra",
            "annual_income": 150000,
            "occupation": "Farmer",
            "category": "OBC",
            "student_status": False,
            "farmer_status": True,
            "disability_status": False
        }
        res = self.client.post("/api/eligibility/check", json=payload)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("eligible", data["data"])
        self.assertIn("not_eligible", data["data"])
        print(f"PASS: /api/eligibility/check evaluated {data['data']['total_evaluated']} schemes.")

    def test_03_signup_validation(self):
        """Test validation on signup."""
        # Missing fields
        res = self.client.post("/api/auth/register", json={})
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertFalse(data["success"])

        # Password mismatch
        res = self.client.post("/api/auth/register", json={
            "full_name": "Test User",
            "email": "mismatch@test.com",
            "password": "Password123",
            "confirm_password": "PasswordDifferent"
        })
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertIn("do not match", data["message"])

        # Invalid email format
        res = self.client.post("/api/auth/register", json={
            "full_name": "Test User",
            "email": "not-an-email",
            "password": "Password123",
            "confirm_password": "Password123"
        })
        self.assertEqual(res.status_code, 400)
        print("PASS: Signup validations verified (missing fields, password mismatch, invalid email).")

    def test_04_signup_success_and_duplicate(self):
        """Test successful registration and duplicate email rejection."""
        test_email = f"testuser_{int(time.time())}@example.com"
        payload = {
            "full_name": "Aarav Gupta",
            "email": test_email,
            "password": "SecurePassword@123",
            "confirm_password": "SecurePassword@123"
        }
        # 1. Register successfully
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["user"]["role"], "USER")
        self.assertEqual(data["data"]["user"]["email"], test_email)

        # 2. Try duplicate email
        res_dup = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res_dup.status_code, 409)
        dup_data = json.loads(res_dup.data)
        self.assertFalse(dup_data["success"])
        self.assertIn("already exists", dup_data["message"])
        print(f"PASS: Registered {test_email} with role 'USER' and rejected duplicate.")

    def test_05_login_success_and_invalid(self):
        """Test login with valid and invalid credentials."""
        # Invalid credentials
        res = self.client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "WrongPassword"
        })
        self.assertEqual(res.status_code, 401)
        data = json.loads(res.data)
        self.assertFalse(data["success"])

        # Valid credentials (demo citizen)
        res_valid = self.client.post("/api/auth/login", json={
            "email": "citizen@example.com",
            "password": "Citizen@123"
        })
        self.assertEqual(res_valid.status_code, 200)
        valid_data = json.loads(res_valid.data)
        self.assertTrue(valid_data["success"])
        self.assertIn("token", valid_data["data"])
        self.assertEqual(valid_data["data"]["user"]["email"], "citizen@example.com")
        print("PASS: Login with invalid credentials returned 401, valid credentials returned 200 with token.")

    def test_06_profile_view_and_update(self):
        """Test viewing and updating user profile with authentication token."""
        # 1. Login to get token
        login_res = self.client.post("/api/auth/login", json={
            "email": "citizen@example.com",
            "password": "Citizen@123"
        })
        token = json.loads(login_res.data)["data"]["token"]

        # 2. Unauthorized request without token
        unauth_res = self.client.get("/api/profile")
        self.assertEqual(unauth_res.status_code, 401)

        # 3. GET /api/profile with Bearer token
        headers = {"Authorization": f"Bearer {token}"}
        get_res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        profile_data = json.loads(get_res.data)["data"]
        self.assertEqual(profile_data["email"], "citizen@example.com")

        # 4. PUT /api/profile
        update_payload = {
            "full_name": "Ramesh Kumar Sharma",
            "age": 36,
            "gender": "Male",
            "state": "Maharashtra",
            "annual_income": 195000,
            "occupation": "Farmer",
            "category": "OBC",
            "student_status": False,
            "farmer_status": True,
            "disability_status": False
        }
        put_res = self.client.put("/api/profile", json=update_payload, headers=headers)
        self.assertEqual(put_res.status_code, 200)
        updated_data = json.loads(put_res.data)["data"]
        self.assertEqual(updated_data["full_name"], "Ramesh Kumar Sharma")
        self.assertEqual(updated_data["age"], 36)
        self.assertEqual(updated_data["annual_income"], 195000.0)

        # 5. Verify persistence by querying again
        verify_res = self.client.get("/api/profile", headers=headers)
        verified_data = json.loads(verify_res.data)["data"]
        self.assertEqual(verified_data["full_name"], "Ramesh Kumar Sharma")
        self.assertEqual(verified_data["age"], 36)
        print("PASS: Protected profile GET and PUT with Bearer token successfully verified.")

    def test_07_logout(self):
        """Test logout endpoint."""
        res = self.client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        print("PASS: Logout endpoint returned 200 OK.")

if __name__ == "__main__":
    unittest.main()
