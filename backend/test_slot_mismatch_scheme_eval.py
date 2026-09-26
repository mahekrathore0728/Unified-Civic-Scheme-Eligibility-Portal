import fitz
import json
import os
import app

def test_slot_mismatch_and_detected_usage():
    # 1. Create Aadhaar PDF
    pdf_doc = fitz.open()
    pdf_page = pdf_doc.new_page()
    pdf_page.insert_text((50, 72), "GOVERNMENT OF INDIA\nUnique Identification Authority of India\nAADHAAR\nName: Priya Verma\nDOB: 15/08/1998\nGender: Female\nAddress: Jaipur, Rajasthan\n9876 5432 1098")
    tmp_pdf = "test_aadhaar_card.pdf"
    pdf_doc.save(tmp_pdf)
    pdf_doc.close()

    try:
        # Extract text via PDF parser
        text = app.extract_text_from_pdf(tmp_pdf)
        assert len(text) > 20, "Text should be extracted"

        # Classify - user chose income_certificate slot, but document is Aadhaar
        cls = app.classify_document(text)
        assert cls['detected_doc_type'] == 'aadhaar', f"Expected aadhaar, got {cls['detected_doc_type']}"
        assert cls['classification_state'] == 'DETECTED'

        # Process document with slot mismatch
        res = app.process_document(999, tmp_pdf, 'application/pdf', 'income_certificate')
        assert res['detected_doc_type'] == 'aadhaar', f"Expected aadhaar, got {res['detected_doc_type']}"
        assert res['extracted_data']['is_slot_mismatch'] == True, "Expected slot mismatch to be True"
        assert res['extracted_data']['masked_aadhaar'] == 'XXXX-XXXX-1098'
        print("[PASS] Aadhaar uploaded in income_certificate slot: Detected as Aadhaar, slot mismatch flagged!")

        # 2. Test 10th marksheet detection
        doc_10th = fitz.open()
        p10 = doc_10th.new_page()
        p10.insert_text((50, 72), "CENTRAL BOARD OF SECONDARY EDUCATION\nSecondary School Examination Class X 2018\nRoll No: 654321 Name: Priya Verma\nMathematics: 88 Science: 84 Social Science: 90 English: 86 Hindi: 92\nPercentage: 88.0%")
        tmp_10th = "test_10th.pdf"
        doc_10th.save(tmp_10th)
        doc_10th.close()

        text_10th = app.extract_text_from_pdf(tmp_10th)
        cls_10th = app.classify_document(text_10th)
        assert cls_10th['detected_doc_type'] == 'marksheet_10th', f"Expected marksheet_10th, got {cls_10th['detected_doc_type']}"
        fields_10th = app.parse_extracted_fields(text_10th, 'marksheet_10th')
        assert fields_10th.get('percentage') == 88.0, f"Expected 88.0, got {fields_10th.get('percentage')}"
        print(f"[PASS] 10th Marksheet: detected={cls_10th['detected_doc_type']}, percentage={fields_10th['percentage']}%")

        # 3. Test 12th marksheet detection
        doc_12th = fitz.open()
        p12 = doc_12th.new_page()
        p12.insert_text((50, 72), "CENTRAL BOARD OF SECONDARY EDUCATION\nSenior School Certificate Examination Class XII 2020\nRoll No: 123456 Name: Priya Verma\nPhysics: 92 Chemistry: 90 Mathematics: 95 English: 88\nPercentage: 91.25%")
        tmp_12th = "test_12th.pdf"
        doc_12th.save(tmp_12th)
        doc_12th.close()

        text_12th = app.extract_text_from_pdf(tmp_12th)
        cls_12th = app.classify_document(text_12th)
        assert cls_12th['detected_doc_type'] == 'marksheet_12th', f"Expected marksheet_12th, got {cls_12th['detected_doc_type']}"
        fields_12th = app.parse_extracted_fields(text_12th, 'marksheet_12th')
        assert fields_12th.get('percentage') == 91.25, f"Expected 91.25, got {fields_12th.get('percentage')}"
        assert fields_12th.get('stream') == 'Science', f"Expected Science, got {fields_12th.get('stream')}"
        print(f"[PASS] 12th Marksheet: detected={cls_12th['detected_doc_type']}, percentage={fields_12th['percentage']}%, stream={fields_12th['stream']}")

        print("\nALL SLOT MISMATCH & MARKSHEET OCR TESTS PASSED SUCCESSFULLY!")

    finally:
        for f in [tmp_pdf, tmp_10th, tmp_12th]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == '__main__':
    test_slot_mismatch_and_detected_usage()
