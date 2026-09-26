import re

VALID_DOC_TYPES = {
    'aadhaar': 'Aadhaar / Identity Proof',
    'marksheet_10th': '10th Marksheet',
    'marksheet_12th': '12th Marksheet',
    'income_certificate': 'Income Certificate',
    'caste_certificate': 'Caste Certificate',
    'domicile_certificate': 'Domicile Certificate',
    'bank_passbook': 'Bank Passbook',
    'disability_certificate': 'Disability Certificate / UDID',
    'ration_card': 'Ration Card / BPL Card',
    'birth_certificate': 'Birth Certificate',
    'land_records': 'Land Holding Papers / Land Records',
    'student_bonafide': 'Student Bonafide / School Certificate',
    'employment_certificate': 'Employment / Vending Certificate',
    'address_proof': 'Address / Residence Proof',
    'bpl_ews_certificate': 'BPL / EWS Certificate',
    'widow_certificate': 'Widow Certificate',
    'marriage_certificate': 'Marriage Certificate',
    'pension_certificate': 'Pension Certificate / PPO',
    'medical_certificate': 'Medical Certificate',
    'affidavit': 'Affidavit / Self Declaration',
    'other': 'Other Supporting Document'
}

def classify_document(raw_text: str) -> dict:
    if not raw_text or len(raw_text.strip()) < 15:
        return {
            'detected_doc_type': 'unrecognized',
            'detected_doc_label': 'Unrecognized Document',
            'classification_confidence': 0.0,
            'classification_state': 'NEEDS_REVIEW',
            'classification_reason': 'Document text is empty or too short for reliable classification.'
        }

    text = raw_text.lower()
    scores = {}
    reasons = {}

    # 1. Aadhaar / Identity
    aadhaar_signals = [
        ('government of india', 25),
        ('unique identification authority', 35),
        ('uidai', 30),
        ('aadhaar', 30),
        ('mera aadhaar', 30),
        ('meri pehchan', 25),
        ('enrollment no', 20),
        ('help@uidai.gov.in', 25),
        ('year of birth', 15),
        ('yob:', 15),
        ('father:', 10),
        ('husband:', 10),
    ]
    aadhaar_score = sum(w for phrase, w in aadhaar_signals if phrase in text)
    if re.search(r'\b[2-9]\d{3}\s*\d{4}\s*\d{4}\b', raw_text):
        aadhaar_score += 40
    scores['aadhaar'] = aadhaar_score
    reasons['aadhaar'] = 'UIDAI / Government of India identity patterns detected'

    # 2. 12th Marksheet (Check 12th specific signals)
    marksheet_12_signals = [
        ('senior secondary', 40),
        ('higher secondary', 40),
        ('class xii', 45),
        ('class 12', 45),
        ('hsc examination', 35),
        ('intermediate examination', 40),
        ('10+2', 35),
        ('plus two', 35),
        ('senior school certificate', 45),
        ('xii standard', 40),
        ('marks statement', 20),
        ('board of secondary', 15),
        ('central board of secondary', 15),
        ('roll no', 15),
        ('maximum marks', 15),
        ('marks obtained', 15),
        ('percentage', 15),
        ('subject', 10),
        ('physics', 20),
        ('chemistry', 20),
        ('mathematics', 15),
        ('biology', 15),
        ('accountancy', 20),
        ('economics', 15),
    ]
    scores['marksheet_12th'] = sum(w for phrase, w in marksheet_12_signals if phrase in text)
    reasons['marksheet_12th'] = 'Senior Secondary / Class XII board marksheet indicators found'

    # 3. 10th Marksheet (Check 10th specific signals)
    marksheet_10_signals = [
        ('secondary school examination', 45),
        ('class x', 45),
        ('class 10', 45),
        ('high school certificate', 40),
        ('matriculation', 45),
        ('ssc examination', 35),
        ('x standard', 40),
        ('secondary examination', 40),
        ('board of high school', 35),
        ('marks statement', 20),
        ('central board of secondary', 15),
        ('roll no', 15),
        ('maximum marks', 15),
        ('marks obtained', 15),
        ('percentage', 15),
        ('social science', 25),
        ('science and technology', 20),
        ('mathematics', 15),
        ('english', 10),
        ('hindi', 10),
    ]
    scores['marksheet_10th'] = sum(w for phrase, w in marksheet_10_signals if phrase in text)
    reasons['marksheet_10th'] = 'Secondary School / Class X board marksheet indicators found'

    # 4. Income Certificate
    income_signals = [
        ('income certificate', 50),
        ('annual income', 35),
        ('family income', 30),
        ('tahsildar', 25),
        ('tehsildar', 25),
        ('revenue department', 30),
        ('gross income', 25),
        ('per annum', 20),
        ('p.a.', 15),
        ('financial year', 20),
        ('office of the', 10),
        ('competent authority', 15),
    ]
    scores['income_certificate'] = sum(w for phrase, w in income_signals if phrase in text)
    reasons['income_certificate'] = 'Revenue department annual income certification language found'

    # 5. Caste Certificate
    caste_signals = [
        ('caste certificate', 55),
        ('community certificate', 50),
        ('scheduled caste', 40),
        ('scheduled tribe', 40),
        ('other backward class', 40),
        ('social status certificate', 45),
        ('belongs to the', 20),
        ('recognized as a scheduled', 35),
        ('constitution (scheduled', 30),
        ('sub-divisional officer', 20),
        ('tahsildar', 15),
    ]
    scores['caste_certificate'] = sum(w for phrase, w in caste_signals if phrase in text)
    reasons['caste_certificate'] = 'Social category / Caste certification wording identified'

    # 6. Domicile Certificate
    domicile_signals = [
        ('domicile certificate', 55),
        ('residence certificate', 50),
        ('permanent resident', 40),
        ('native of', 30),
        ('resident of state', 30),
        ('domicile of the state', 45),
        ('bonafide resident', 40),
        ('district magistrate', 20),
    ]
    scores['domicile_certificate'] = sum(w for phrase, w in domicile_signals if phrase in text)
    reasons['domicile_certificate'] = 'State residency / Domicile proof markers identified'

    # 7. Bank Passbook
    bank_signals = [
        ('bank passbook', 55),
        ('account number', 35),
        ('a/c no', 35),
        ('ifsc', 40),
        ('ifsc code', 45),
        ('branch code', 25),
        ('savings bank', 30),
        ('savings account', 30),
        ('account holder', 35),
        ('cif no', 25),
        ('micr', 25),
        ('state bank of india', 25),
        ('punjab national bank', 25),
        ('bank of baroda', 25),
        ('canara bank', 25),
        ('hdfc bank', 25),
        ('icici bank', 25),
    ]
    scores['bank_passbook'] = sum(w for phrase, w in bank_signals if phrase in text)
    reasons['bank_passbook'] = 'Bank branch, IFSC, and savings account structure detected'

    # 8. Disability Certificate
    disability_signals = [
        ('disability certificate', 55),
        ('unique disability id', 50),
        ('udid', 50),
        ('person with disability', 45),
        ('permanent disability', 40),
        ('disability percentage', 40),
        ('impairment', 30),
        ('medical board', 30),
        ('chief medical officer', 30),
        ('locomotor disability', 35),
    ]
    scores['disability_certificate'] = sum(w for phrase, w in disability_signals if phrase in text)
    reasons['disability_certificate'] = 'Medical Board disability assessment / UDID indicators detected'

    # 9. Land Records
    land_signals = [
        ('record of rights', 55),
        ('ror', 40),
        ('7/12', 45),
        ('satbara', 45),
        ('khasra', 45),
        ('khatauni', 45),
        ('patta', 40),
        ('jamabandi', 45),
        ('land revenue', 30),
        ('cultivable area', 35),
        ('survey number', 35),
        ('hectare', 25),
        ('bigha', 25),
        ('acre', 20),
    ]
    scores['land_records'] = sum(w for phrase, w in land_signals if phrase in text)
    reasons['land_records'] = 'Revenue land holding records / Khasra / RoR papers detected'

    # 10. Ration Card
    ration_signals = [
        ('ration card', 55),
        ('food & civil supplies', 45),
        ('food and civil supplies', 45),
        ('fair price shop', 40),
        ('fps code', 35),
        ('antyodaya', 40),
        ('bpl card', 45),
        ('nfsa', 35),
        ('family card', 35),
        ('head of family', 30),
    ]
    scores['ration_card'] = sum(w for phrase, w in ration_signals if phrase in text)
    reasons['ration_card'] = 'Food & Civil Supplies public distribution ration card markers found'

    # 11. Student Bonafide
    student_signals = [
        ('bonafide certificate', 55),
        ('bonafide student', 50),
        ('enrolled as a regular student', 45),
        ('academic year', 30),
        ('principal', 25),
        ('dean', 25),
        ('headmaster', 25),
        ('college', 20),
        ('school', 20),
        ('studying in class', 35),
    ]
    scores['student_bonafide'] = sum(w for phrase, w in student_signals if phrase in text)
    reasons['student_bonafide'] = 'Educational institution student bonafide enrollment certificate found'

    # 12. Employment / Vending
    emp_signals = [
        ('employment certificate', 55),
        ('experience certificate', 50),
        ('service certificate', 45),
        ('salary slip', 45),
        ('employee code', 35),
        ('designation:', 30),
        ('street vendor', 45),
        ('vending certificate', 50),
        ('town vending committee', 45),
    ]
    scores['employment_certificate'] = sum(w for phrase, w in emp_signals if phrase in text)
    reasons['employment_certificate'] = 'Employment / Vending certificate credentials detected'

    # 13. Birth Certificate
    birth_signals = [
        ('birth certificate', 60),
        ('registration of births', 50),
        ('date of birth', 25),
        ('child name', 35),
        ('place of birth', 35),
        ('registrar (birth & death)', 45),
        ('municipal corporation', 25),
    ]
    scores['birth_certificate'] = sum(w for phrase, w in birth_signals if phrase in text)
    reasons['birth_certificate'] = 'Municipal birth registration certificate detected'

    # Find top match
    best_doc_type = None
    best_score = 0
    for dtype, score in scores.items():
        if score > best_score:
            best_score = score
            best_doc_type = dtype

    # Threshold evaluation
    if best_doc_type and best_score >= 35:
        confidence = min(round(best_score / 100.0, 2), 0.99)
        if confidence < 0.50:
            confidence = 0.65
        return {
            'detected_doc_type': best_doc_type,
            'detected_doc_label': VALID_DOC_TYPES.get(best_doc_type, best_doc_type.replace('_', ' ').title()),
            'classification_confidence': confidence,
            'classification_state': 'DETECTED',
            'classification_reason': reasons.get(best_doc_type, 'Strong content signals matched')
        }
    elif best_doc_type and best_score >= 15:
        return {
            'detected_doc_type': best_doc_type,
            'detected_doc_label': VALID_DOC_TYPES.get(best_doc_type, best_doc_type.replace('_', ' ').title()),
            'classification_confidence': round(best_score / 100.0, 2),
            'classification_state': 'NEEDS_REVIEW',
            'classification_reason': f'Low confidence match for {VALID_DOC_TYPES.get(best_doc_type, best_doc_type)}. Please verify document readability.'
        }
    else:
        return {
            'detected_doc_type': 'unrecognized',
            'detected_doc_label': 'Unrecognized Document',
            'classification_confidence': 0.0,
            'classification_state': 'UNRECOGNIZED',
            'classification_reason': 'Document content did not match any supported civic document types. Please review or upload a clearer scan.'
        }

if __name__ == '__main__':
    # Test 1: Aadhaar
    t1 = "GOVERNMENT OF INDIA\nUnique Identification Authority of India\nEnrollment No: 1234/5678/9012\nName: Ramesh Sharma\nDOB: 12/04/1990\nGender: Male\nAddress: Pune, Maharashtra\n1234 5678 9012\nMera Aadhaar, Meri Pehchan"
    r1 = classify_document(t1)
    print("Test 1 (Aadhaar):", r1['detected_doc_type'], r1['classification_confidence'], r1['classification_state'])
    assert r1['detected_doc_type'] == 'aadhaar' and r1['classification_state'] == 'DETECTED'

    # Test 2: 12th Marksheet
    t2 = "CENTRAL BOARD OF SECONDARY EDUCATION\nSENIOR SCHOOL CERTIFICATE EXAMINATION (CLASS XII) 2021\nMARKS STATEMENT\nRoll No: 654321\nName: Priya Singh\nSubject: Physics 85/100, Chemistry 88/100, Mathematics 92/100\nTotal: 440/500 Percentage: 88.0%"
    r2 = classify_document(t2)
    print("Test 2 (12th Marksheet):", r2['detected_doc_type'], r2['classification_confidence'], r2['classification_state'])
    assert r2['detected_doc_type'] == 'marksheet_12th' and r2['classification_state'] == 'DETECTED'

    # Test 3: 10th Marksheet
    t3 = "BOARD OF SECONDARY EDUCATION\nSECONDARY SCHOOL EXAMINATION (CLASS X) 2019\nMATRICULATION CERTIFICATE\nRoll No: 123456\nName: Amit Kumar\nSubjects: Science, Social Science, Mathematics, Hindi, English\nMarks Obtained: 425/500 Percentage: 85.0%"
    r3 = classify_document(t3)
    print("Test 3 (10th Marksheet):", r3['detected_doc_type'], r3['classification_confidence'], r3['classification_state'])
    assert r3['detected_doc_type'] == 'marksheet_10th' and r3['classification_state'] == 'DETECTED'

    # Test 4: Unrelated text
    t4 = "Random recipe for making delicious chocolate cake at home with flour, sugar, and milk."
    r4 = classify_document(t4)
    print("Test 4 (Unrelated):", r4['detected_doc_type'], r4['classification_confidence'], r4['classification_state'])
    assert r4['detected_doc_type'] == 'unrecognized'

    print("All classification tests passed!")
