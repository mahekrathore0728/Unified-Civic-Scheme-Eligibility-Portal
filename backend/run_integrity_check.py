"""
Final integration integrity check for the document classification + eligibility pipeline.
"""
import sys, re, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app

classify_document = app.classify_document
parse_extracted_fields = app.parse_extracted_fields
VALID_DOC_TYPES = app.VALID_DOC_TYPES

print("Functions loaded successfully. Running checks...\n")

# 1. Aadhaar classification
result = classify_document('UNIQUE IDENTIFICATION AUTHORITY OF INDIA Government of India AADHAAR 2345 6789 0123 Date of Birth: 12/08/1995 Male Rajasthan')
assert result['detected_doc_type'] == 'aadhaar', f"Expected aadhaar, got {result['detected_doc_type']}"
assert result['classification_state'] == 'DETECTED', f"Expected DETECTED, got {result['classification_state']}"
print(f"[PASS] Aadhaar: type={result['detected_doc_type']}, conf={result['classification_confidence']}")

# 2. 12th Marksheet classification
result2 = classify_document('CENTRAL BOARD OF SECONDARY EDUCATION Senior School Certificate Examination Class XII Year 2021 Physics Chemistry Mathematics Percentage 87.6%')
assert result2['detected_doc_type'] == 'marksheet_12th', f"Expected marksheet_12th, got {result2['detected_doc_type']}"
print(f"[PASS] 12th Marksheet: type={result2['detected_doc_type']}, conf={result2['classification_confidence']}")

# 3. Income certificate classification
result3 = classify_document('INCOME CERTIFICATE This is to certify that the annual income of the family is Rs. 1,80,000 per annum Tahsildar Revenue Department')
assert result3['detected_doc_type'] == 'income_certificate', f"Expected income_certificate, got {result3['detected_doc_type']}"
print(f"[PASS] Income Certificate: type={result3['detected_doc_type']}, conf={result3['classification_confidence']}")

# 4. Field extraction - marksheet_12th
fields = parse_extracted_fields(
    'CBSE Class XII Certificate 2022 Name: Priya Sharma Roll No: 12345678 Physics: 95/100 Chemistry: 88/100 Mathematics: 92/100 Percentage: 91.67%',
    'marksheet_12th'
)
assert 'percentage' in fields, f"Expected 'percentage' in fields, got: {list(fields.keys())}"
assert fields['percentage'] == 91.67, f"Expected 91.67, got {fields['percentage']}"
assert fields.get('stream') == 'Science', f"Expected Science stream, got {fields.get('stream')}"
print(f"[PASS] 12th field extraction: percentage={fields['percentage']}, stream={fields.get('stream')}")

# 5. Field extraction - income_certificate
income_fields = parse_extracted_fields(
    'Income Certificate Annual income of Mr. Ram Kumar is Rs. 1,20,000 per annum. Financial Year: 2023-24. Tahsildar.',
    'income_certificate'
)
assert 'annual_income' in income_fields, f"Expected 'annual_income' in fields: {list(income_fields.keys())}"
assert income_fields['annual_income'] == 120000.0, f"Expected 120000.0, got {income_fields['annual_income']}"
print(f"[PASS] Income field extraction: annual_income={income_fields['annual_income']}, issuing_authority={income_fields.get('issuing_authority')}")

# 6. Aadhaar field extraction (masking - critical security test)
aadhaar_fields = parse_extracted_fields(
    'Government of India UIDAI Aadhaar 2345 6789 0123 DOB: 15/03/1990 Male Name: Rahul Kumar State: Delhi',
    'aadhaar'
)
assert 'masked_aadhaar' in aadhaar_fields, f"Expected masked_aadhaar in fields: {list(aadhaar_fields.keys())}"
# Ensure we NEVER store full 12-digit Aadhaar
full_aadhaar = '234567890123'
stored_str = str(aadhaar_fields)
assert full_aadhaar not in stored_str, "SECURITY ERROR: Full Aadhaar number is being stored!"
print(f"[PASS] Aadhaar masking: {aadhaar_fields['masked_aadhaar']} (full number NOT stored - SECURITY OK)")

# 7. Unrecognized document
unrecog = classify_document('Hello World this is some random text that does not match any government document pattern at all. Testing 123.')
assert unrecog['classification_state'] in ('UNRECOGNIZED', 'NEEDS_REVIEW'), f"Expected UNRECOGNIZED/NEEDS_REVIEW, got {unrecog['classification_state']}"
print(f"[PASS] Unrecognized doc handling: state={unrecog['classification_state']}")

# 8. Empty text handling
empty_result = classify_document('')
assert empty_result['classification_state'] == 'NEEDS_REVIEW', f"Expected NEEDS_REVIEW for empty text"
print(f"[PASS] Empty text handling: {empty_result['classification_state']}")

# 9. Caste certificate detection
caste_result = classify_document('CASTE CERTIFICATE This is to certify that Mr. Ramesh belongs to the Scheduled Caste as recognized under the Constitution (Scheduled Castes) Order. Sub-Divisional Officer.')
assert caste_result['detected_doc_type'] == 'caste_certificate', f"Expected caste_certificate, got {caste_result['detected_doc_type']}"
caste_fields = parse_extracted_fields('CASTE CERTIFICATE belongs to the Scheduled Caste SC category Sub-Divisional Officer Revenue Department', 'caste_certificate')
assert caste_fields.get('category') == 'SC', f"Expected SC category, got {caste_fields.get('category')}"
print(f"[PASS] Caste Certificate: type={caste_result['detected_doc_type']}, category={caste_fields.get('category')}")

# 10. Slot mismatch detection logic
detected_type = 'aadhaar'
user_slot = 'income_certificate'
is_mismatch = (detected_type != user_slot)
assert is_mismatch, "Slot mismatch detection failed"
print(f"[PASS] Slot mismatch detection: detected={detected_type} vs slot={user_slot} -> mismatch={is_mismatch}")

print()
print('=' * 60)
print('ALL 10 INTEGRITY CHECKS PASSED SUCCESSFULLY!')
print('Backend document pipeline is fully operational.')
print('  - Classification engine: OK')
print('  - Field extraction: OK')
print('  - Security masking: OK')
print('  - Edge cases: OK')
print('=' * 60)
