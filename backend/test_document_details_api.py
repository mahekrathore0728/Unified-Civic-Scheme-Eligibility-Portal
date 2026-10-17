import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import unittest
import json
import uuid
import io
import re
from app import app, init_document_system, execute_db, query_one, query_all

class TestDocumentDetailsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_document_system()
        cls.client = app.test_client()

        # Create two distinct test users
        cls.user1_email = f"docuser1_{uuid.uuid4().hex[:8]}@example.com"
        cls.user2_email = f"docuser2_{uuid.uuid4().hex[:8]}@example.com"
        cls.password = "SecurePass123!"

        # Register User 1
        r1 = cls.client.post("/api/auth/register", json={
            "full_name": "Citizen One",
            "email": cls.user1_email,
            "password": cls.password,
            "confirm_password": cls.password,
            "age": 28,
            "gender": "Female",
            "state": "Maharashtra",
            "category": "General",
            "annual_income": 350000,
            "occupation": "Salaried"
        })
        cls.token1 = r1.get_json()["data"]["token"]

        # Register User 2
        r2 = cls.client.post("/api/auth/register", json={
            "full_name": "Citizen Two",
            "email": cls.user2_email,
            "password": cls.password,
            "confirm_password": cls.password,
            "age": 35,
            "gender": "Male",
            "state": "Delhi",
            "category": "OBC",
            "annual_income": 200000,
            "occupation": "Self-Employed"
        })
        cls.token2 = r2.get_json()["data"]["token"]

    def _auth_header(self, token):
        return {"Authorization": f"Bearer {token}"}

    def _upload_dummy_file(self, token, doc_type, filename="sample.png"):
        file_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        data = {
            "doc_type": doc_type,
            "file": (io.BytesIO(file_bytes), filename)
        }
        res = self.client.post(
            "/api/documents/upload",
            data=data,
            headers=self._auth_header(token),
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 201)
        return res.get_json()["data"]["doc_id"]

    def test_01_document_details_returned_in_get_documents(self):
        res = self.client.get("/api/documents", headers=self._auth_header(self.token1))
        self.assertEqual(res.status_code, 200)
        docs = res.get_json()["data"]
        self.assertTrue(len(docs) > 0)
        for d in docs:
            self.assertIn("document_details", d)
            self.assertIsInstance(d["document_details"], dict)

    def test_02_update_aadhaar_details_validation_and_masking(self):
        doc_id = self._upload_dummy_file(self.token1, "aadhaar", "aadhaar_card.png")

        # Invalid: 8 digits
        res_bad = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {"aadhaar_number": "12345678", "name": "Citizen One"}}
        )
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn("12-digit", res_bad.get_json()["message"])

        # Valid 12 digits
        res_good = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {"aadhaar_number": "987654321098", "name": "Citizen One"}}
        )
        self.assertEqual(res_good.status_code, 200)
        data = res_good.get_json()["data"]["document_details"]
        self.assertEqual(data["aadhaar_number"], "XXXX-XXXX-1098")
        self.assertEqual(data["name"], "Citizen One")

        # GET confirms masked value
        res_get = self.client.get("/api/documents", headers=self._auth_header(self.token1))
        aadhaar_doc = next(d for d in res_get.get_json()["data"] if d["doc_type"] == "aadhaar")
        self.assertEqual(aadhaar_doc["document_details"]["aadhaar_number"], "XXXX-XXXX-1098")

    def test_03_no_duplicate_records_on_edit(self):
        # Query existing row count for this user's active aadhaar doc
        user1_id = query_one("SELECT id FROM users WHERE email = %s", (self.user1_email,))["id"]
        count_before = query_one(
            "SELECT COUNT(*) as cnt FROM user_documents WHERE user_id = %s AND doc_type = 'aadhaar' AND is_active = TRUE",
            (user1_id,)
        )["cnt"]
        self.assertEqual(count_before, 1)

        # Retrieve doc_id
        doc_row = query_one(
            "SELECT id FROM user_documents WHERE user_id = %s AND doc_type = 'aadhaar' AND is_active = TRUE",
            (user1_id,)
        )
        doc_id = doc_row["id"]

        # Update details again
        res_update = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {"aadhaar_number": "XXXX-XXXX-1098", "name": "Citizen One Updated"}}
        )
        self.assertEqual(res_update.status_code, 200)

        # Confirm count remains exactly 1 (no duplicates created)
        count_after = query_one(
            "SELECT COUNT(*) as cnt FROM user_documents WHERE user_id = %s AND doc_type = 'aadhaar' AND is_active = TRUE",
            (user1_id,)
        )["cnt"]
        self.assertEqual(count_after, 1)

    def test_04_ownership_protection(self):
        # User 1's doc cannot be edited by User 2
        user1_id = query_one("SELECT id FROM users WHERE email = %s", (self.user1_email,))["id"]
        doc_row = query_one(
            "SELECT id FROM user_documents WHERE user_id = %s AND doc_type = 'aadhaar' AND is_active = TRUE",
            (user1_id,)
        )
        doc_id = doc_row["id"]

        res_unauth = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token2),
            json={"details": {"name": "Hacker"}}
        )
        self.assertEqual(res_unauth.status_code, 403)

    def test_05_bank_passbook_ifsc_and_account_masking(self):
        doc_id = self._upload_dummy_file(self.token1, "bank_passbook", "passbook.png")

        # Invalid IFSC
        res_bad_ifsc = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {"ifsc_code": "INVALID", "bank_name": "State Bank of India"}}
        )
        self.assertEqual(res_bad_ifsc.status_code, 400)
        self.assertIn("IFSC", res_bad_ifsc.get_json()["message"])

        # Invalid Account Number (e.g., 4 digits)
        res_bad_acc = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {"ifsc_code": "SBIN0001234", "account_number": "1234"}}
        )
        self.assertEqual(res_bad_acc.status_code, 400)

        # Valid Bank Passbook details
        res_good = self.client.put(
            f"/api/documents/{doc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "account_holder_name": "Citizen One",
                "bank_name": "State Bank of India",
                "ifsc_code": "sbin0001234",
                "account_number": "123456789012"
            }}
        )
        self.assertEqual(res_good.status_code, 200)
        details = res_good.get_json()["data"]["document_details"]
        self.assertEqual(details["ifsc_code"], "SBIN0001234")
        self.assertEqual(details["account_number"], "XXXXXXXX9012")
        self.assertEqual(details["account_holder_name"], "Citizen One")
        self.assertEqual(details["bank_name"], "State Bank of India")

    def test_06_income_caste_domicile_details(self):
        # Income Certificate
        inc_id = self._upload_dummy_file(self.token1, "income_certificate", "income.png")
        res_inc = self.client.put(
            f"/api/documents/{inc_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "certificate_number": "INC/2026/9941",
                "issue_date": "2026-03-15",
                "issuing_authority": "Tahsildar",
                "annual_income": "320000"
            }}
        )
        self.assertEqual(res_inc.status_code, 200)
        d_inc = res_inc.get_json()["data"]["document_details"]
        self.assertEqual(d_inc["certificate_number"], "INC/2026/9941")
        self.assertEqual(d_inc["issuing_authority"], "Tahsildar")
        self.assertEqual(d_inc["annual_income"], 320000.0)

        # Caste Certificate
        caste_id = self._upload_dummy_file(self.token1, "caste_certificate", "caste.png")
        res_caste = self.client.put(
            f"/api/documents/{caste_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "certificate_number": "CST/2025/1102",
                "category": "OBC",
                "issuing_authority": "Sub-Divisional Officer",
                "issue_date": "2025-08-20"
            }}
        )
        self.assertEqual(res_caste.status_code, 200)
        d_caste = res_caste.get_json()["data"]["document_details"]
        self.assertEqual(d_caste["category"], "OBC")
        self.assertEqual(d_caste["certificate_number"], "CST/2025/1102")

        # Domicile Certificate
        dom_id = self._upload_dummy_file(self.token1, "domicile_certificate", "domicile.png")
        res_dom = self.client.put(
            f"/api/documents/{dom_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "certificate_number": "DOM/2024/7721",
                "issue_date": "2024-01-10",
                "issuing_authority": "District Magistrate",
                "state": "Maharashtra"
            }}
        )
        self.assertEqual(res_dom.status_code, 200)
        d_dom = res_dom.get_json()["data"]["document_details"]
        self.assertEqual(d_dom["certificate_number"], "DOM/2024/7721")
        self.assertEqual(d_dom["state"], "Maharashtra")


    def test_07_all_document_types_support(self):
        # Educational document (marksheet_10th)
        m10_id = self._upload_dummy_file(self.token1, "marksheet_10th", "10th_marks.png")
        res_m10 = self.client.put(
            f"/api/documents/{m10_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "student_name": "Rohan Sharma",
                "roll_number": "10023456",
                "board_university": "CBSE",
                "passing_year": "2020",
                "marks_percentage": "88.4%",
                "certificate_number": "CBSE/2020/9981"
            }}
        )
        self.assertEqual(res_m10.status_code, 200)
        d_m10 = res_m10.get_json()["data"]["document_details"]
        self.assertEqual(d_m10["student_name"], "Rohan Sharma")
        self.assertEqual(d_m10["roll_number"], "10023456")
        self.assertEqual(d_m10["board_university"], "CBSE")
        self.assertEqual(d_m10["passing_year"], "2020")
        self.assertEqual(d_m10["marks_percentage"], "88.4%")

        # Disability certificate
        dis_id = self._upload_dummy_file(self.token1, "disability_certificate", "udid.png")
        res_dis = self.client.put(
            f"/api/documents/{dis_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "applicant_name": "Rohan Sharma",
                "disability_type": "Locomotor Disability",
                "disability_percentage": "45%",
                "certificate_number": "UDID-MH-12345",
                "issuing_authority": "Civil Surgeon",
                "issue_date": "2023-05-12"
            }}
        )
        self.assertEqual(res_dis.status_code, 200)
        d_dis = res_dis.get_json()["data"]["document_details"]
        self.assertEqual(d_dis["disability_type"], "Locomotor Disability")
        self.assertEqual(d_dis["disability_percentage"], "45%")

        # Ration Card
        rat_id = self._upload_dummy_file(self.token1, "ration_card", "ration.png")
        res_rat = self.client.put(
            f"/api/documents/{rat_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "head_of_family": "Rohan Sharma",
                "card_number": "RC-99887766",
                "card_category": "BPL",
                "family_members_count": "4",
                "issuing_authority": "FCS Department"
            }}
        )
        self.assertEqual(res_rat.status_code, 200)
        d_rat = res_rat.get_json()["data"]["document_details"]
        self.assertEqual(d_rat["card_number"], "RC-99887766")
        self.assertEqual(d_rat["card_category"], "BPL")

        # Land Records
        lnd_id = self._upload_dummy_file(self.token1, "land_records", "land.png")
        res_lnd = self.client.put(
            f"/api/documents/{lnd_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "owner_name": "Rohan Sharma",
                "khasra_number": "KH-452/12",
                "land_area": "2.5 Acres",
                "district": "Pune"
            }}
        )
        self.assertEqual(res_lnd.status_code, 200)
        d_lnd = res_lnd.get_json()["data"]["document_details"]
        self.assertEqual(d_lnd["khasra_number"], "KH-452/12")
        self.assertEqual(d_lnd["land_area"], "2.5 Acres")

        # Other Document
        oth_id = self._upload_dummy_file(self.token1, "other", "certificate.png")
        res_oth = self.client.put(
            f"/api/documents/{oth_id}/details",
            headers=self._auth_header(self.token1),
            json={"details": {
                "document_name": "Sports Achievement Certificate",
                "holder_name": "Rohan Sharma",
                "reference_number": "SAC-2024-001",
                "issuing_authority": "State Sports Council",
                "notes": "State Level Winner"
            }}
        )
        self.assertEqual(res_oth.status_code, 200)
        d_oth = res_oth.get_json()["data"]["document_details"]
        self.assertEqual(d_oth["document_name"], "Sports Achievement Certificate")
        self.assertEqual(d_oth["reference_number"], "SAC-2024-001")
        self.assertEqual(d_oth["notes"], "State Level Winner")

if __name__ == "__main__":

    unittest.main()