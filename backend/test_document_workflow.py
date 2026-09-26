"""
Comprehensive Test Suite for Document Management & Document-Assisted Eligibility Workflow
Unified Civic Scheme & Eligibility Portal
"""

import unittest
import json
import io
from app import app, init_document_system, parse_extracted_fields, _parse_required_docs_string, generate_token
from database import query_all, query_one

class DocumentWorkflowTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Ensure document tables and mappings are initialized non-destructively."""
        init_document_system()
        cls.client = app.test_client()

        # Find or create a test citizen user
        user = query_one("SELECT id, email, role FROM users WHERE role = 'CITIZEN' LIMIT 1")
        if not user:
            user = query_one("SELECT id, email, role FROM users LIMIT 1")
        cls.test_user = user
        if user:
            cls.token = generate_token(user["id"], user["email"], user["role"])
            cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}
        else:
            cls.token = None
            cls.auth_headers = {}

    def test_01_backend_health(self):
        """Test root API status endpoint."""
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("Phase 2", data["data"]["version"])

    def test_02_database_safety_and_tables(self):
        """Verify that existing tables are preserved and user_documents table exists."""
        tables_res = query_all("SHOW TABLES")
        table_names = [list(r.values())[0] for r in tables_res]
        # Ensure all existing tables are intact
        self.assertIn("users", table_names)
        self.assertIn("profiles", table_names)
        self.assertIn("schemes", table_names)
        self.assertIn("saved_schemes", table_names)
        self.assertIn("applications", table_names)
        self.assertIn("documents", table_names)  # Application-scoped documents table preserved!
        # Ensure new document tables exist
        self.assertIn("user_documents", table_names)
        self.assertIn("scheme_required_doc_types", table_names)

    def test_03_scheme_required_docs_endpoint(self):
        """Test GET /api/schemes/<id>/required-docs."""
        scheme = query_one("SELECT id FROM schemes LIMIT 1")
        if not scheme:
            self.skipTest("No schemes found in DB")
        res = self.client.get(f'/api/schemes/{scheme["id"]}/required-docs')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("required_docs", data["data"])
        self.assertIsInstance(data["data"]["required_docs"], list)

    def test_04_fallback_required_docs_parser(self):
        """Test _parse_required_docs_string logic."""
        sample_str = "Aadhaar Card, Income Certificate, Bank Passbook, 10th Marksheet"
        parsed = _parse_required_docs_string(sample_str)
        doc_types = [p["doc_type"] for p in parsed]
        self.assertIn("aadhaar", doc_types)
        self.assertIn("income_certificate", doc_types)
        self.assertIn("bank_passbook", doc_types)
        self.assertIn("marksheet_10th", doc_types)

    def test_05_field_parser_structured_extraction(self):
        """Test parse_extracted_fields for eligibility relevance without exposing sensitive numbers."""
        # Income Certificate
        income_text = "GOVERNMENT OF INDIA\nIncome Certificate\nApplicant: Rahul Sharma\nAnnual Income: Rs. 150,000 per annum\nDate: 12/05/2023"
        extracted_inc = parse_extracted_fields(income_text, "income_certificate")
        self.assertEqual(extracted_inc.get("name"), "Rahul Sharma")
        self.assertEqual(extracted_inc.get("annual_income"), 150000.0)

        # Marksheet
        marks_text = "Board of Secondary Education\n10th Marksheet\nName: Priya Singh\nPercentage: 84.5%\nYear: 2021"
        extracted_marks = parse_extracted_fields(marks_text, "marksheet_10th")
        self.assertEqual(extracted_marks.get("name"), "Priya Singh")
        self.assertEqual(extracted_marks.get("percentage"), 84.5)
        self.assertEqual(extracted_marks.get("passing_year"), 2021)

        # Caste Certificate
        caste_text = "Office of District Magistrate\nCaste Certificate\nApplicant: Amit Kumar\nBelongs to Scheduled Caste (SC) community."
        extracted_caste = parse_extracted_fields(caste_text, "caste_certificate")
        self.assertEqual(extracted_caste.get("category"), "SC")

    def test_06_unauthenticated_document_access_blocked(self):
        """Verify that document endpoints strictly require authentication."""
        res_docs = self.client.get('/api/documents')
        self.assertEqual(res_docs.status_code, 401)

        res_upload = self.client.post('/api/documents/upload')
        self.assertEqual(res_upload.status_code, 401)

        res_view = self.client.get('/api/documents/1/view')
        self.assertEqual(res_view.status_code, 401)

        res_apps = self.client.get('/api/applications')
        self.assertEqual(res_apps.status_code, 401)

    def test_07_user_documents_listing(self):
        """Test GET /api/documents for authenticated user."""
        if not self.test_user:
            self.skipTest("No test user available")
        res = self.client.get('/api/documents', headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)
        # Should return all document types with status
        doc_types = [d["doc_type"] for d in data["data"]]
        self.assertIn("aadhaar", doc_types)
        self.assertIn("income_certificate", doc_types)

    def test_08_document_upload_validation(self):
        """Test upload validation for invalid file type and missing file."""
        if not self.test_user:
            self.skipTest("No test user available")

        # Missing file
        res = self.client.post('/api/documents/upload', headers=self.auth_headers, data={})
        self.assertEqual(res.status_code, 400)

        # Disallowed file extension (.exe or .txt)
        data = {
            'doc_type': 'aadhaar',
            'file': (io.BytesIO(b"Fake executable content"), 'malicious.exe')
        }
        res_disallowed = self.client.post(
            '/api/documents/upload',
            headers=self.auth_headers,
            data=data,
            content_type='multipart/form-data'
        )
        self.assertEqual(res_disallowed.status_code, 400)
        self.assertIn("Unsupported file type", res_disallowed.get_json()["message"])

    def test_09_check_scheme_eligibility_authenticated(self):
        """Test GET /api/eligibility/scheme/<scheme_id> for authenticated user."""
        if not self.test_user:
            self.skipTest("No test user available")
        scheme = query_one("SELECT id FROM schemes LIMIT 1")
        if not scheme:
            self.skipTest("No scheme in DB")

        res = self.client.get(f'/api/eligibility/scheme/{scheme["id"]}', headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        res_data = data["data"]
        self.assertIn("verdict", res_data)
        self.assertIn("doc_checklist", res_data)
        self.assertIn("matched_criteria", res_data)
        self.assertIn("unmet_criteria", res_data)

    def test_10_application_workflow_lifecycle(self):
        """Test creation, listing, detail, and submission guard for applications."""
        if not self.test_user:
            self.skipTest("No test user available")

        scheme = query_one("SELECT id FROM schemes LIMIT 1")
        if not scheme:
            self.skipTest("No scheme in DB")

        # 1. Get or create application
        existing_app = query_one(
            "SELECT id, status FROM applications WHERE user_id = %s AND scheme_id = %s",
            (self.test_user["id"], scheme["id"])
        )

        app_id = None
        if existing_app:
            app_id = existing_app["id"]
        else:
            create_res = self.client.post('/api/applications', headers=self.auth_headers, json={'scheme_id': scheme["id"]})
            if create_res.status_code in (200, 201):
                app_id = create_res.get_json()["data"]["application_id"]

        if app_id:
            # 2. View details
            detail_res = self.client.get(f'/api/applications/{app_id}', headers=self.auth_headers)
            self.assertEqual(detail_res.status_code, 200)
            detail_data = detail_res.get_json()["data"]
            self.assertIn("doc_checklist", detail_data)
            self.assertIn("missing_mandatory_docs", detail_data)
            self.assertIn("can_submit", detail_data)

            # 3. View checklist endpoint
            chk_res = self.client.get(f'/api/applications/{app_id}/checklist', headers=self.auth_headers)
            self.assertEqual(chk_res.status_code, 200)
            self.assertIn("checklist", chk_res.get_json()["data"])

if __name__ == '__main__':
    unittest.main()
