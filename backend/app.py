import os
import re
import time
import json
import hmac
import uuid
import hashlib
import base64
from functools import wraps
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from database import query_all, query_one, execute_db

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.environ.get('SECRET_KEY', 'civic-scheme-portal-secret-key-2026')

# ==========================================
# Upload Configuration
# ==========================================
UPLOAD_FOLDER = Path(__file__).resolve().parent / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
ALLOWED_MIME_TYPES = {'application/pdf', 'image/jpeg', 'image/jpg', 'image/png'}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

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
    'other': 'Other Supporting Documents'
}

DEFAULT_SCHEME_REQUIRED_DOCS = {
    "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Aadhaar / Identity Proof"},
        {"doc_type": "land_records", "is_mandatory": True, "display_label": "Land Holding Papers / Record of Rights (RoR)"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Active Bank Account Passbook"},
    ],
    "Ayushman Bharat - PMJAY (Pradhan Mantri Jan Arogya Yojana)": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Aadhaar / Identity Proof"},
        {"doc_type": "ration_card", "is_mandatory": True, "display_label": "Ration Card / Proof of Household"},
    ],
    "Pradhan Mantri Awas Yojana - Urban (PMAY-U)": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Aadhaar / Identity Proof"},
        {"doc_type": "income_certificate", "is_mandatory": True, "display_label": "Income Certificate / Salary Slips"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Bank Account Statements"},
        {"doc_type": "affidavit", "is_mandatory": True, "display_label": "Affidavit (Confirming no other pucca property)"},
    ],
    "Sukanya Samriddhi Yojana (SSY)": [
        {"doc_type": "birth_certificate", "is_mandatory": True, "display_label": "Birth Certificate of the Girl Child"},
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Parent / Legal Guardian Aadhaar Card"},
        {"doc_type": "address_proof", "is_mandatory": True, "display_label": "Proof of Address"},
    ],
    "National Means-cum-Merit Scholarship Scheme (NMMSS)": [
        {"doc_type": "marksheet_10th", "is_mandatory": True, "display_label": "Class VII & VIII / Marksheet"},
        {"doc_type": "income_certificate", "is_mandatory": True, "display_label": "Parental Income Certificate"},
        {"doc_type": "student_bonafide", "is_mandatory": True, "display_label": "School Enrollment ID / Bonafide Certificate"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Aadhaar Linked Bank Passbook"},
        {"doc_type": "aadhaar", "is_mandatory": False, "display_label": "Aadhaar / Identity Proof"},
    ],
    "PM SVANidhi (PM Street Vendor's AtmaNirbhar Nidhi)": [
        {"doc_type": "employment_certificate", "is_mandatory": True, "display_label": "Vending Certificate / Recommendation Letter"},
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Aadhaar / Identity Proof"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Bank Account Details"},
    ],
    "Pradhan Mantri Mudra Yojana (PMMY)": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Proof of Identity (Aadhaar / Voter ID)"},
        {"doc_type": "address_proof", "is_mandatory": True, "display_label": "Proof of Residence / Address Proof"},
        {"doc_type": "other", "is_mandatory": False, "display_label": "Business Profile Proposal / Quotation"},
    ],
    "Post Matric Scholarship for SC Students": [
        {"doc_type": "caste_certificate", "is_mandatory": True, "display_label": "Valid Caste Certificate (SC)"},
        {"doc_type": "income_certificate", "is_mandatory": True, "display_label": "Parental Income Certificate"},
        {"doc_type": "marksheet_10th", "is_mandatory": True, "display_label": "Previous Exam / 10th Marksheet"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Aadhaar Linked Bank Passbook"},
        {"doc_type": "aadhaar", "is_mandatory": False, "display_label": "Aadhaar / Identity Proof"},
    ],
    "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Proof of Age / Aadhaar Card"},
        {"doc_type": "ration_card", "is_mandatory": True, "display_label": "BPL Ration Card"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Bank Account Details"},
    ],
    "Divyangjan Swavalamban Yojana": [
        {"doc_type": "disability_certificate", "is_mandatory": True, "display_label": "Unique Disability ID (UDID) / Disability Certificate"},
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Proof of Age / Aadhaar Card"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Bank Account Details"},
    ],
    "PM Vishwakarma Scheme": [
        {"doc_type": "aadhaar", "is_mandatory": True, "display_label": "Aadhaar / Identity Proof"},
        {"doc_type": "bank_passbook", "is_mandatory": True, "display_label": "Bank Passbook"},
    ],
}

def _parse_required_docs_string(doc_str):
    """Fallback parser for scheme.required_documents string to normalize into document types."""
    if not doc_str:
        return []
    items = [x.strip() for x in doc_str.split(',') if x.strip()]
    result = []
    seen = set()
    for item in items:
        lower = item.lower()
        if 'disability' in lower or 'udid' in lower or 'pwd' in lower or 'handicap' in lower:
            dt = 'disability_certificate'
            label = 'Disability Certificate / UDID'
        elif 'land' in lower or 'ror' in lower or 'khasra' in lower or 'khata' in lower or 'holding' in lower:
            dt = 'land_records'
            label = 'Land Holding Papers / Land Records'
        elif 'ration' in lower or 'bpl' in lower or 'nfsa' in lower or 'aay' in lower:
            dt = 'ration_card'
            label = 'Ration Card / BPL Card'
        elif 'birth' in lower:
            dt = 'birth_certificate'
            label = 'Birth Certificate'
        elif 'marriage' in lower:
            dt = 'marriage_certificate'
            label = 'Marriage Certificate'
        elif 'widow' in lower:
            dt = 'widow_certificate'
            label = 'Widow Certificate'
        elif 'bonafide' in lower or 'enrollment' in lower or 'school id' in lower:
            dt = 'student_bonafide'
            label = 'Student Bonafide / School Certificate'
        elif 'vending' in lower or 'vendor' in lower or 'employment' in lower or 'trade' in lower:
            dt = 'employment_certificate'
            label = 'Employment / Vending Certificate'
        elif 'address' in lower or 'residence' in lower or 'residential' in lower or 'utility' in lower or 'bill' in lower:
            dt = 'address_proof'
            label = 'Address / Residence Proof'
        elif 'ews' in lower:
            dt = 'bpl_ews_certificate'
            label = 'BPL / EWS Certificate'
        elif 'pension' in lower or 'ppo' in lower:
            dt = 'pension_certificate'
            label = 'Pension Certificate / PPO'
        elif 'medical' in lower or 'health' in lower:
            dt = 'medical_certificate'
            label = 'Medical Certificate'
        elif 'affidavit' in lower or 'declaration' in lower:
            dt = 'affidavit'
            label = 'Affidavit / Self Declaration'
        elif '10th' in lower or 'matric' in lower or 'vii' in lower or 'viii' in lower:
            dt = 'marksheet_10th'
            label = '10th / School Marksheet'
        elif '12th' in lower or 'inter' in lower or 'higher secondary' in lower:
            dt = 'marksheet_12th'
            label = '12th Marksheet'
        elif 'income' in lower or 'salary' in lower:
            dt = 'income_certificate'
            label = 'Income Certificate'
        elif 'caste' in lower or 'category' in lower or 'community' in lower:
            dt = 'caste_certificate'
            label = 'Caste Certificate'
        elif 'domicile' in lower:
            dt = 'domicile_certificate'
            label = 'Domicile Certificate'
        elif 'bank' in lower or 'passbook' in lower or 'account' in lower:
            dt = 'bank_passbook'
            label = 'Bank Passbook'
        elif 'aadhaar' in lower or 'identity' in lower or 'voter' in lower or 'uidai' in lower:
            dt = 'aadhaar'
            label = 'Aadhaar / Identity Proof'
        else:
            dt = 'other'
            label = item
        if dt not in seen:
            seen.add(dt)
            result.append({"doc_type": dt, "is_mandatory": True, "display_label": label})
    return result

def init_document_system():
    """Safely and non-destructively ensure document tables and scheme mappings exist."""
    try:
        execute_db("""
            CREATE TABLE IF NOT EXISTS `user_documents` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `user_id` INT NOT NULL,
                `doc_type` VARCHAR(50) NOT NULL COMMENT 'aadhaar|marksheet_10th|marksheet_12th|income_certificate|caste_certificate|domicile_certificate|bank_passbook|other',
                `original_filename` VARCHAR(500) NOT NULL,
                `stored_filename` VARCHAR(500) NOT NULL,
                `file_path` VARCHAR(1000) NOT NULL,
                `mime_type` VARCHAR(100) NOT NULL,
                `file_size_bytes` INT NOT NULL,
                `status` VARCHAR(50) DEFAULT 'Submitted',
                `extracted_data` JSON DEFAULT NULL,
                `processing_notes` TEXT DEFAULT NULL,
                `is_active` BOOLEAN DEFAULT TRUE,
                `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                INDEX `idx_user_doc_type` (`user_id`, `doc_type`),
                INDEX `idx_user_active` (`user_id`, `is_active`),
                INDEX `idx_status` (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        execute_db("""
            CREATE TABLE IF NOT EXISTS `scheme_required_doc_types` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `scheme_id` INT NOT NULL,
                `doc_type` VARCHAR(50) NOT NULL,
                `is_mandatory` BOOLEAN DEFAULT TRUE,
                `display_label` VARCHAR(255) NOT NULL,
                UNIQUE KEY `unique_scheme_doc` (`scheme_id`, `doc_type`),
                FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE CASCADE,
                INDEX `idx_scheme_id` (`scheme_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # Safely add classification columns to user_documents if not already present
        for col, col_def in [
            ("detected_doc_type", "VARCHAR(60) DEFAULT NULL"),
            ("detected_doc_label", "VARCHAR(120) DEFAULT NULL"),
            ("classification_confidence", "FLOAT DEFAULT 0.0"),
            ("classification_state", "VARCHAR(30) DEFAULT 'NEEDS_REVIEW'"),
            ("classification_reason", "TEXT DEFAULT NULL"),
            ("ocr_quality", "VARCHAR(30) DEFAULT 'UNKNOWN'")
        ]:
            try:
                execute_db(f"ALTER TABLE `user_documents` ADD COLUMN `{col}` {col_def}")
            except Exception:
                pass

        # Safely add columns to applications table if not already present
        try:
            execute_db("ALTER TABLE `applications` ADD COLUMN `eligibility_snapshot` JSON DEFAULT NULL")
        except Exception:
            pass
        try:
            execute_db("ALTER TABLE `applications` ADD COLUMN `doc_checklist_status` JSON DEFAULT NULL")
        except Exception:
            pass

        # Populate / sync scheme_required_doc_types safely with INSERT IGNORE
        schemes = query_all("SELECT id, name, required_documents FROM schemes")
        scheme_map = {s["name"]: s["id"] for s in schemes}
        for s_name, d_list in DEFAULT_SCHEME_REQUIRED_DOCS.items():
            s_id = scheme_map.get(s_name)
            if s_id:
                for d in d_list:
                    execute_db("""
                        INSERT IGNORE INTO scheme_required_doc_types
                        (scheme_id, doc_type, is_mandatory, display_label)
                        VALUES (%s, %s, %s, %s)
                    """, (s_id, d["doc_type"], d["is_mandatory"], d["display_label"]))

        for s in schemes:
            if s.get("required_documents"):
                parsed = _parse_required_docs_string(s["required_documents"])
                for p in parsed:
                    execute_db("""
                        INSERT IGNORE INTO scheme_required_doc_types
                        (scheme_id, doc_type, is_mandatory, display_label)
                        VALUES (%s, %s, %s, %s)
                    """, (s["id"], p["doc_type"], p["is_mandatory"], p["display_label"]))
        print("[Document System] Document tables and scheme requirements verified.")
    except Exception as e:
        print(f"[Document System Init Error]: {e}")

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

_document_system_initialized = False

@app.before_request
def ensure_document_system_ready():
    global _document_system_initialized
    if not _document_system_initialized:
        init_document_system()
        _document_system_initialized = True

# ==========================================
# Document Processing & OCR Pipeline
# ==========================================

_tesseract_configured = False

def configure_tesseract():
    """Locate and configure Tesseract executable path on Windows/Linux."""
    global _tesseract_configured
    if _tesseract_configured:
        return
    try:
        import pytesseract
        import shutil
        import os

        # Check if already in PATH
        if shutil.which("tesseract"):
            _tesseract_configured = True
            return

        # Check standard Windows paths
        win_candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
            os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
            r"C:\Tesseract-OCR\tesseract.exe",
        ]
        for candidate in win_candidates:
            if os.path.exists(candidate):
                pytesseract.pytesseract.tesseract_cmd = candidate
                _tesseract_configured = True
                print(f"[OCR Config] Tesseract configured at: {candidate}")
                return
    except Exception as e:
        print(f"[OCR Config Notice]: {type(e).__name__}")

def preprocess_image_for_ocr(img):
    """
    Enhance PIL Image for maximum OCR readability:
    - Normalizes color mode
    - Converts to high-contrast grayscale
    - Upscales small images
    - Enhances contrast and sharpness
    - Applies auto-contrast
    """
    try:
        from PIL import ImageOps, ImageEnhance
        if img.mode != 'RGB':
            img = img.convert('RGB')

        gray = ImageOps.grayscale(img)
        w, h = gray.size
        if w < 1600:
            ratio = 1600.0 / float(w)
            gray = gray.resize((1600, int(h * ratio)))

        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(1.8)
        enhanced = ImageOps.autocontrast(enhanced, cutoff=1)
        return enhanced
    except Exception as e:
        print(f"[Image Preprocess Warning]: {type(e).__name__}")
        return img

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract selectable text from a PDF across all pages (up to 10 pages) using PyMuPDF.
    Returns extracted text or empty string if scanned/image-based.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text_parts = []
        max_pages = min(len(doc), 10)
        for i in range(max_pages):
            page = doc[i]
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())
        doc.close()
        return "\n\n".join(text_parts).strip()
    except Exception as e:
        print(f"[PDF Text Extract Error]: {type(e).__name__}")
        return ""

def extract_text_from_scanned_pdf(file_path: str) -> str:
    """
    Fallback OCR for scanned/image-based PDFs:
    Renders PDF pages to 200 DPI images, enhances them, and runs pytesseract OCR.
    """
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        import pytesseract
        import io

        configure_tesseract()
        doc = fitz.open(file_path)
        text_parts = []
        max_pages = min(len(doc), 5)
        for i in range(max_pages):
            page = doc[i]
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            processed_img = preprocess_image_for_ocr(img)
            try:
                page_text = pytesseract.image_to_string(processed_img, lang='eng', config='--psm 6')
                if not page_text or len(page_text.strip()) < 15:
                    page_text = pytesseract.image_to_string(processed_img, lang='eng', config='--psm 3')
                if page_text and page_text.strip():
                    text_parts.append(page_text.strip())
            except Exception as ocr_err:
                print(f"[Scanned PDF Page OCR Notice]: {type(ocr_err).__name__}")
        doc.close()
        return "\n\n".join(text_parts).strip()
    except Exception as e:
        print(f"[Scanned PDF OCR Error]: {type(e).__name__}")
        return ""

def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from an image (JPG, PNG, JPEG, WebP) using PIL preprocessing and pytesseract OCR.
    """
    try:
        from PIL import Image
        import pytesseract

        configure_tesseract()
        img = Image.open(file_path)
        processed_img = preprocess_image_for_ocr(img)
        try:
            text = pytesseract.image_to_string(processed_img, lang='eng', config='--psm 6')
            if not text or len(text.strip()) < 15:
                text = pytesseract.image_to_string(processed_img, lang='eng', config='--psm 3')
            return text.strip()
        except Exception as ocr_err:
            print(f"[Image OCR Tesseract Notice]: {type(ocr_err).__name__}")
            return ""
    except Exception as e:
        print(f"[Image Read Error]: {type(e).__name__}")
        return ""

# ==========================================
# Document Classification Engine
# ==========================================

def classify_document(raw_text: str) -> dict:
    """
    Classify document content based on OCR text evidence and weighted pattern signals.
    DOES NOT trust the user-selected upload slot or filename.
    Returns:
      - detected_doc_type: normalized document key
      - detected_doc_label: human readable label
      - classification_confidence: float (0.0 to 1.0)
      - classification_state: 'DETECTED', 'NEEDS_REVIEW', 'UNRECOGNIZED', 'FAILED'
      - classification_reason: explanation of evidence found
    """
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

    # 2. 12th Marksheet (Class XII / Senior Secondary specific)
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
        ('physics', 20),
        ('chemistry', 20),
        ('mathematics', 15),
        ('biology', 15),
        ('accountancy', 20),
        ('economics', 15),
    ]
    scores['marksheet_12th'] = sum(w for phrase, w in marksheet_12_signals if phrase in text)
    reasons['marksheet_12th'] = 'Senior Secondary / Class XII board marksheet indicators found'

    # 3. 10th Marksheet (Class X / Secondary specific)
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

    # 14. BPL / EWS Certificate
    bpl_signals = [
        ('economically weaker section', 55),
        ('ews certificate', 50),
        ('below poverty line', 50),
        ('bpl certificate', 50),
        ('income and asset certificate', 45),
    ]
    scores['bpl_ews_certificate'] = sum(w for phrase, w in bpl_signals if phrase in text)
    reasons['bpl_ews_certificate'] = 'Economically Weaker Section / BPL certification wording detected'

    # 15. Widow Certificate
    widow_signals = [
        ('widow certificate', 60),
        ('death certificate of husband', 50),
        ('destitute widow', 45),
        ('surviving spouse', 35),
    ]
    scores['widow_certificate'] = sum(w for phrase, w in widow_signals if phrase in text)
    reasons['widow_certificate'] = 'Widowhood / Surviving spouse legal certificate wording found'

    # Find highest scoring candidate
    best_doc_type = None
    best_score = 0
    for dtype, score in scores.items():
        if score > best_score:
            best_score = score
            best_doc_type = dtype

    # Determine confidence and state
    if best_doc_type and best_score >= 35:
        confidence = min(round(best_score / 100.0, 2), 0.99)
        if confidence < 0.60:
            confidence = 0.70
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

# ==========================================
# Field Extraction (Based on DETECTED Type)
# ==========================================

def parse_extracted_fields(text: str, detected_doc_type: str) -> dict:
    """
    Parse extracted text into structured fields based on the DETECTED document type.
    Never stores or returns unmasked sensitive identifiers (e.g. full Aadhaar or bank account numbers).
    """
    fields = {}

    if not text or len(text.strip()) < 10:
        return fields

    text_lower = text.lower()

    # --- Common Name Extraction ---
    name_patterns = [
        r'(?:name\s*of\s*the\s*applicant|applicant\s*name|name\s*of\s*student|student\s*name|candidate\s*name|holder\s*name|name)\s*[:\-]\s*([A-Za-z\s\.]{3,60})',
        r'this\s+is\s+to\s+certify\s+that\s+(?:shri|smt|kumari|mr|ms|mrs)?\.?\s*([A-Za-z\s\.]{3,50})',
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).split('\n')[0].strip()
            # Clean common trailing artifacts
            candidate = re.sub(r'^(?:shri|smt|kumari|mr|ms|mrs)\.?\s*', '', candidate, flags=re.IGNORECASE)
            if 3 < len(candidate) < 60:
                fields['name'] = candidate
                break

    # --- Date of Birth ---
    dob_patterns = [
        r'(?:dob|date of birth|d\.o\.b)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
        r'born\s+(?:on\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
    ]
    for pattern in dob_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields['date_of_birth'] = match.group(1).strip()
            break

    # --- Field Extraction by DETECTED Document Type ---

    if detected_doc_type == 'aadhaar':
        fields['doc_type_label'] = 'Aadhaar / Identity Proof'
        # Gender
        if 'female' in text_lower:
            fields['gender_hint'] = 'Female'
        elif 'male' in text_lower:
            fields['gender_hint'] = 'Male'

        # Safe Aadhaar Masking: NEVER store full 12 digits
        aadhaar_match = re.search(r'\b([2-9]\d{3})\s*(\d{4})\s*(\d{4})\b', text)
        if aadhaar_match:
            last4 = aadhaar_match.group(3)
            fields['masked_aadhaar'] = f"XXXX-XXXX-{last4}"
            fields['aadhaar_last4'] = last4

        # Year of birth fallback
        if 'date_of_birth' not in fields:
            yob_match = re.search(r'(?:year of birth|yob)\s*[:\-]?\s*(19\d{2}|20\d{2})', text, re.IGNORECASE)
            if yob_match:
                fields['year_of_birth'] = int(yob_match.group(1))

        # State detection from address
        indian_states_list = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
            'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
            'Delhi', 'Jammu & Kashmir', 'Ladakh'
        ]
        for st in indian_states_list:
            if re.search(r'\b' + re.escape(st) + r'\b', text, re.IGNORECASE):
                fields['state'] = st
                break

    elif detected_doc_type in ('marksheet_10th', 'marksheet_12th'):
        grade_label = '10th' if detected_doc_type == 'marksheet_10th' else '12th'
        fields['doc_type_label'] = f'{grade_label} Marksheet'
        # Percentage
        pct_match = re.search(r'(\d{1,3}(?:\.\d{1,2})?)\s*%', text)
        if pct_match:
            pct_val = float(pct_match.group(1))
            if 0 < pct_val <= 100:
                fields['percentage'] = pct_val
        # Marks obtained / total
        marks_match = re.search(r'(?:marks?|obtained|total)\s*[:\-]?\s*(\d{2,4})\s*(?:\/|out of)\s*(\d{2,4})', text, re.IGNORECASE)
        if marks_match:
            fields['marks_obtained'] = int(marks_match.group(1))
            fields['marks_total'] = int(marks_match.group(2))
        # Year of passing
        year_match = re.search(r'(?:pass(?:ing|ed)?|examination|year)\s*[:\-]?\s*(20\d{2}|19\d{2})', text, re.IGNORECASE)
        if year_match:
            fields['passing_year'] = int(year_match.group(1))
        # Board
        for board_name in ['CBSE', 'ICSE', 'Central Board of Secondary Education', 'State Board of Secondary Education', 'Council for the Indian School Certificate']:
            if board_name.lower() in text_lower:
                fields['board'] = board_name
                break
        # Stream (for 12th)
        if detected_doc_type == 'marksheet_12th':
            if any(s in text_lower for s in ['physics', 'chemistry', 'biology', 'mathematics']):
                fields['stream'] = 'Science'
            elif any(s in text_lower for s in ['accountancy', 'business studies', 'economics']):
                fields['stream'] = 'Commerce'
            elif any(s in text_lower for s in ['history', 'political science', 'sociology']):
                fields['stream'] = 'Arts / Humanities'

    elif detected_doc_type == 'income_certificate':
        fields['doc_type_label'] = 'Income Certificate'
        income_patterns = [
            r'(?:annual|yearly|total)\s+(?:family\s+)?income\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.\d{1,2})?)',
            r'(?:rs\.?|₹|inr)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:per annum|p\.a\.|annually|per year)',
            r'income\s*[:\-]\s*(?:rs\.?|₹|inr)?\s*([0-9,]+)',
        ]
        for pattern in income_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw_income = match.group(1).replace(',', '')
                try:
                    income_val = float(raw_income)
                    if 0 < income_val < 50000000:
                        fields['annual_income'] = income_val
                        break
                except ValueError:
                    pass
        # Financial Year
        fy_match = re.search(r'(?:financial\s+year|fy)\s*[:\-]?\s*(20\d{2}[\-\/]\d{2,4})', text, re.IGNORECASE)
        if fy_match:
            fields['financial_year'] = fy_match.group(1)
        # Issuing authority
        for auth in ['Tahsildar', 'Tehsildar', 'Revenue Officer', 'Sub-Divisional Magistrate', 'District Magistrate']:
            if auth.lower() in text_lower:
                fields['issuing_authority'] = auth
                break

    elif detected_doc_type == 'caste_certificate':
        fields['doc_type_label'] = 'Caste Certificate'
        for cat in ['Scheduled Caste', 'Scheduled Tribe', 'Other Backward Class', 'Economically Weaker Section']:
            if cat.lower() in text_lower:
                short_map = {
                    'Scheduled Caste': 'SC',
                    'Scheduled Tribe': 'ST',
                    'Other Backward Class': 'OBC',
                    'Economically Weaker Section': 'EWS'
                }
                fields['category'] = short_map[cat]
                fields['category_full'] = cat
                break
        if 'category' not in fields:
            for code in ['SC', 'ST', 'OBC', 'EWS']:
                if re.search(r'\b' + code + r'\b', text, re.IGNORECASE):
                    fields['category'] = code
                    break
        # Issuing authority
        for auth in ['Tahsildar', 'Sub-Divisional Officer', 'District Magistrate', 'Revenue Officer']:
            if auth.lower() in text_lower:
                fields['issuing_authority'] = auth
                break

    elif detected_doc_type == 'domicile_certificate':
        fields['doc_type_label'] = 'Domicile Certificate'
        for st in [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
            'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
            'Delhi', 'Jammu & Kashmir', 'Ladakh'
        ]:
            if re.search(r'\b' + re.escape(st) + r'\b', text, re.IGNORECASE):
                fields['state'] = st
                break

    elif detected_doc_type == 'bank_passbook':
        fields['doc_type_label'] = 'Bank Passbook'
        bank_match = re.search(r'(?:bank|branch)\s*(?:name)?\s*[:\-]\s*([A-Za-z\s]{3,60})', text, re.IGNORECASE)
        if bank_match:
            fields['bank_name'] = bank_match.group(1).strip()[:60]
        # IFSC code
        ifsc_match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text)
        if ifsc_match:
            fields['ifsc'] = ifsc_match.group(1)
        # Safe Account Number Masking: ONLY store last 4 digits
        acc_match = re.search(r'(?:a\/c|account)\s*(?:no|number)?\s*[:\-]?\s*([0-9]{9,18})', text, re.IGNORECASE)
        if acc_match:
            raw_acc = acc_match.group(1)
            last4 = raw_acc[-4:]
            fields['masked_account_number'] = f"XXXXXXXX{last4}"
            fields['account_last4'] = last4

    elif detected_doc_type == 'disability_certificate':
        fields['doc_type_label'] = 'Disability Certificate / UDID'
        fields['disability_status_confirmed'] = True
        dis_pct_match = re.search(r'(\d{1,3})\s*%\s*(?:disability|impairment|handicap)?', text, re.IGNORECASE)
        if dis_pct_match:
            try:
                dp = int(dis_pct_match.group(1))
                if 0 < dp <= 100:
                    fields['disability_percentage'] = dp
            except ValueError:
                pass
        for dtype in ['Locomotor', 'Visual Impairment', 'Hearing Impairment', 'Blindness', 'Low Vision', 'Cerebral Palsy', 'Intellectual Disability', 'Mental Illness', 'Multiple Disabilities']:
            if dtype.lower() in text_lower:
                fields['disability_type'] = dtype
                break

    elif detected_doc_type == 'land_records':
        fields['doc_type_label'] = 'Land Holding Papers / Record of Rights'
        fields['farmer_status_confirmed'] = True
        area_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:acres?|hectares?|bighas?|gunthas?|cents?)', text, re.IGNORECASE)
        if area_match:
            fields['land_area'] = area_match.group(0)

    elif detected_doc_type == 'ration_card':
        fields['doc_type_label'] = 'Ration Card / BPL Card'
        if 'bpl' in text_lower or 'antodaya' in text_lower or 'aay' in text_lower:
            fields['card_type'] = 'BPL / Antyodaya'
            fields['bpl_status_confirmed'] = True
        elif 'phh' in text_lower or 'priority' in text_lower:
            fields['card_type'] = 'PHH (Priority Household)'
        else:
            fields['card_type'] = 'NFSA Ration Card'

    elif detected_doc_type == 'birth_certificate':
        fields['doc_type_label'] = 'Birth Certificate'
        child_match = re.search(r'(?:child\s+name|name\s+of\s+child)\s*[:\-]\s*([A-Za-z\s\.]{3,60})', text, re.IGNORECASE)
        if child_match:
            fields['child_name'] = child_match.group(1).strip()

    elif detected_doc_type == 'student_bonafide':
        fields['doc_type_label'] = 'Student Bonafide / School Certificate'
        fields['student_status_confirmed'] = True

    elif detected_doc_type == 'employment_certificate':
        fields['doc_type_label'] = 'Employment / Vending Certificate'
        fields['employment_status_confirmed'] = True

    elif detected_doc_type == 'bpl_ews_certificate':
        fields['doc_type_label'] = 'BPL / EWS Certificate'
        fields['bpl_ews_confirmed'] = True

    elif detected_doc_type == 'widow_certificate':
        fields['doc_type_label'] = 'Widow Certificate'
        fields['widow_status_confirmed'] = True

    elif detected_doc_type == 'marriage_certificate':
        fields['doc_type_label'] = 'Marriage Certificate'

    elif detected_doc_type == 'pension_certificate':
        fields['doc_type_label'] = 'Pension Certificate / PPO'

    elif detected_doc_type == 'medical_certificate':
        fields['doc_type_label'] = 'Medical Certificate'

    elif detected_doc_type == 'address_proof':
        fields['doc_type_label'] = 'Address / Residence Proof'

    elif detected_doc_type == 'affidavit':
        fields['doc_type_label'] = 'Affidavit / Self Declaration'

    elif detected_doc_type == 'other':
        fields['doc_type_label'] = 'Other Supporting Document'

    # Safe snippet preview (no sensitive numbers)
    safe_preview = text[:200].replace('\n', ' ').strip()
    safe_preview = re.sub(r'\b\d{4}\s*\d{4}\s*\d{4}\b', 'XXXX-XXXX-XXXX', safe_preview)
    safe_preview = re.sub(r'\b\d{10,18}\b', 'XXXXXXXXXXXX', safe_preview)
    fields['text_preview'] = safe_preview

    return fields

# ==========================================
# Document Processing Main Routine
# ==========================================

def process_document(doc_id: int, file_path: str, mime_type: str, doc_type: str) -> dict:
    """
    Process an uploaded document:
    1. Reads document via native text or OCR fallback.
    2. Classifies document using OCR evidence (independent of user slot).
    3. Extracts structured fields based on DETECTED type.
    4. Handles slot mismatches honestly without guessing.
    """
    result = {
        'status': 'Processing',
        'detected_doc_type': None,
        'detected_doc_label': None,
        'classification_confidence': 0.0,
        'classification_state': 'NEEDS_REVIEW',
        'classification_reason': '',
        'extracted_data': {},
        'notes': ''
    }

    try:
        raw_text = ""

        if mime_type == 'application/pdf':
            # 1. Native PDF text extraction
            raw_text = extract_text_from_pdf(file_path)
            # 2. If empty or insufficient, run scanned PDF OCR fallback
            if not raw_text or len(raw_text.strip()) < 20:
                raw_text = extract_text_from_scanned_pdf(file_path)
        elif mime_type in ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'):
            raw_text = extract_text_from_image(file_path)

        if not raw_text or len(raw_text.strip()) < 15:
            # Honest failure reporting — do NOT invent values
            result['status'] = 'Needs Review'
            result['classification_state'] = 'NEEDS_REVIEW'
            result['classification_reason'] = 'Text could not be read reliably from the document image/PDF.'
            result['notes'] = 'Document uploaded successfully, but the text could not be read reliably. Please upload a clearer scan/photo.'
            result['extracted_data'] = {'extraction_attempted': True, 'text_found': False}
            return result

        # Run Document Classification
        classification = classify_document(raw_text)
        detected_type = classification['detected_doc_type']
        detected_label = classification['detected_doc_label']
        conf = classification['classification_confidence']
        state = classification['classification_state']
        reason = classification['classification_reason']

        result['detected_doc_type'] = detected_type
        result['detected_doc_label'] = detected_label
        result['classification_confidence'] = conf
        result['classification_state'] = state
        result['classification_reason'] = reason

        # Extract fields based on the DETECTED document type (NOT upload slot)
        extracted = parse_extracted_fields(raw_text, detected_type)
        extracted['detected_doc_type'] = detected_type
        extracted['detected_doc_label'] = detected_label
        extracted['confidence'] = conf

        # Check for slot mismatch
        is_slot_mismatch = (detected_type != doc_type and state == 'DETECTED' and detected_type != 'unrecognized')
        extracted['is_slot_mismatch'] = is_slot_mismatch
        if is_slot_mismatch:
            extracted['uploaded_slot'] = doc_type
            result['notes'] = f"Document detected as '{detected_label}' ({int(conf * 100)}% match), uploaded in '{VALID_DOC_TYPES.get(doc_type, doc_type)}' slot."
            result['status'] = 'Processed'
        elif state == 'DETECTED':
            result['status'] = 'Processed'
            result['notes'] = f"Document verified as '{detected_label}' ({int(conf * 100)}% confidence). {len(extracted)} fields extracted."
        elif state == 'UNRECOGNIZED':
            result['status'] = 'Needs Review'
            result['notes'] = "Document type could not be reliably identified. Please review or re-upload a clearer document."
        else:
            result['status'] = 'Needs Review'
            result['notes'] = reason

        result['extracted_data'] = extracted

    except Exception as e:
        print(f"[Doc Processing Error doc_id={doc_id}]: {type(e).__name__}")
        result['status'] = 'Needs Review'
        result['classification_state'] = 'FAILED'
        result['classification_reason'] = f'Processing error: {type(e).__name__}'
        result['notes'] = 'Document processing encountered an issue. The document has been submitted but requires manual review.'
        result['extracted_data'] = {'extraction_attempted': True, 'error_type': type(e).__name__}

    return result


def api_response(success, message, data=None, status_code=200):
    """Standardized JSON response envelope."""
    payload = {
        "success": success,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(payload), status_code

def generate_token(user_id, email, role):
    """Generate a tamper-evident HMAC-signed session token (valid for 7 days)."""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + (7 * 24 * 3600)
    }
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_token(token):
    """Verify signature and return token payload if valid and unexpired."""
    if not token or '.' not in token:
        return None
    try:
        parts = token.split('.', 1)
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        # Add back padding if needed
        padding = '=' * (-len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode((payload_b64 + padding).encode('utf-8'))
        payload = json.loads(payload_bytes.decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def token_required(f):
    """Decorator to enforce and authenticate user session via Authorization Bearer header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return api_response(False, "Authentication token is missing. Please log in.", None, 401)
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return api_response(False, "Invalid Authorization header format. Expected 'Bearer <token>'.", None, 401)
        token = parts[1]
        user_data = decode_token(token)
        if not user_data:
            return api_response(False, "Invalid or expired session token. Please log in again.", None, 401)
        return f(current_user=user_data, *args, **kwargs)
    return decorated

@app.errorhandler(404)
def not_found_handler(e):
    return api_response(False, "Requested endpoint or resource was not found", None, 404)

@app.errorhandler(500)
def server_error_handler(e):
    return api_response(False, "An internal server error occurred. Please try again later.", None, 500)

@app.route("/", methods=["GET"])
def index():
    return api_response(True, "Unified Civic Scheme & Eligibility Portal API is operational.", {
        "version": "2.0.0 (Phase 2 — Document Management)",
        "status": "online"
    })

# ==========================================
# Schemes Endpoints
# ==========================================

@app.route("/api/schemes", methods=["GET"])
def get_schemes():
    """
    Retrieve schemes with search and filtering.
    Query parameters:
      - q: search term (name, description, objective)
      - category: filter by scheme category
      - state: filter by state
      - scope: 'Central' or 'State'
    """
    try:
        search_query = request.args.get("q", "").strip()
        category = request.args.get("category", "").strip()
        state = request.args.get("state", "").strip()
        scope = request.args.get("scope", "").strip()

        conditions = ["status = 'Active'"]
        params = []

        if search_query:
            conditions.append("(name LIKE %s OR description LIKE %s OR objective LIKE %s OR benefits LIKE %s)")
            like_term = f"%{search_query}%"
            params.extend([like_term, like_term, like_term, like_term])

        if category and category != "All":
            conditions.append("category = %s")
            params.append(category)

        if state and state != "All":
            conditions.append("(state_requirement = 'All' OR state_requirement = %s)")
            params.append(state)

        if scope == "Central":
            conditions.append("state_requirement = 'All'")
        elif scope == "State":
            conditions.append("state_requirement != 'All'")

        where_clause = " AND ".join(conditions)
        sql = f"""
            SELECT id, name, category, description, objective, benefits,
                   age_min, age_max, income_limit, gender, occupation,
                   category_requirement, state_requirement, student_requirement,
                   farmer_requirement, disability_requirement, required_documents,
                   application_process, official_portal_url, deadline, status, created_at
            FROM schemes
            WHERE {where_clause}
            ORDER BY id ASC
        """

        schemes = query_all(sql, tuple(params))

        # Clean formatting for JSON serialization
        formatted_schemes = []
        for s in schemes:
            s_dict = dict(s)
            if s_dict.get("income_limit") is not None:
                s_dict["income_limit"] = float(s_dict["income_limit"])
            if s_dict.get("created_at"):
                s_dict["created_at"] = str(s_dict["created_at"])
            formatted_schemes.append(s_dict)

        return api_response(True, f"Retrieved {len(formatted_schemes)} schemes", formatted_schemes)
    except Exception as err:
        print(f"[API Error /api/schemes]: {err}")
        return api_response(False, "Failed to retrieve schemes from database.", None, 500)

@app.route("/api/schemes/<int:scheme_id>", methods=["GET"])
def get_scheme_by_id(scheme_id):
    """Retrieve details for a specific scheme by ID."""
    try:
        sql = """
            SELECT id, name, category, description, objective, benefits,
                   eligibility_rules, age_min, age_max, income_limit, gender,
                   occupation, category_requirement, state_requirement,
                   student_requirement, farmer_requirement, disability_requirement,
                   required_documents, application_process, official_portal_url,
                   deadline, status, created_at, updated_at
            FROM schemes
            WHERE id = %s
        """
        scheme = query_one(sql, (scheme_id,))
        if not scheme:
            return api_response(False, f"Scheme with ID {scheme_id} was not found.", None, 404)

        scheme_data = dict(scheme)
        if scheme_data.get("income_limit") is not None:
            scheme_data["income_limit"] = float(scheme_data["income_limit"])
        if scheme_data.get("created_at"):
            scheme_data["created_at"] = str(scheme_data["created_at"])
        if scheme_data.get("updated_at"):
            scheme_data["updated_at"] = str(scheme_data["updated_at"])

        return api_response(True, "Scheme details retrieved successfully", scheme_data)
    except Exception as err:
        print(f"[API Error /api/schemes/<id>]: {err}")
        return api_response(False, "Failed to retrieve scheme details.", None, 500)

@app.route("/api/schemes/categories", methods=["GET"])
def get_categories():
    """Retrieve distinct categories and count of active schemes."""
    try:
        sql = """
            SELECT category, COUNT(*) as scheme_count
            FROM schemes
            WHERE status = 'Active'
            GROUP BY category
            ORDER BY category ASC
        """
        rows = query_all(sql)
        categories = [{"category": r["category"], "count": int(r["scheme_count"])} for r in rows]
        return api_response(True, "Categories retrieved successfully", categories)
    except Exception as err:
        print(f"[API Error /api/schemes/categories]: {err}")
        return api_response(False, "Failed to retrieve scheme categories.", None, 500)

@app.route("/api/schemes/<int:scheme_id>/required-docs", methods=["GET"])
def get_scheme_required_docs(scheme_id):
    """Retrieve the required document types for a specific scheme."""
    try:
        scheme = query_one("SELECT id, name FROM schemes WHERE id = %s", (scheme_id,))
        if not scheme:
            return api_response(False, f"Scheme with ID {scheme_id} was not found.", None, 404)

        docs = query_all(
            "SELECT doc_type, is_mandatory, display_label FROM scheme_required_doc_types WHERE scheme_id = %s ORDER BY is_mandatory DESC, id ASC",
            (scheme_id,)
        )
        doc_list = []
        for d in docs:
            doc_list.append({
                "doc_type": d["doc_type"],
                "is_mandatory": bool(d["is_mandatory"]),
                "display_label": d["display_label"]
            })

        if not doc_list:
            s_row = query_one("SELECT required_documents FROM schemes WHERE id = %s", (scheme_id,))
            if s_row and s_row.get("required_documents"):
                doc_list = _parse_required_docs_string(s_row["required_documents"])

        return api_response(True, "Required documents retrieved", {"scheme_id": scheme_id, "scheme_name": scheme["name"], "required_docs": doc_list})
    except Exception as err:
        print(f"[API Error /api/schemes/<id>/required-docs]: {err}")
        return api_response(False, "Failed to retrieve required documents.", None, 500)

# ==========================================
# Rule-Based Eligibility Engine Endpoint
# ==========================================

@app.route("/api/eligibility/check", methods=["POST"])
def check_eligibility():
    """
    Rule-based eligibility checker comparing user criteria against schemes in MySQL.
    Expects JSON payload:
    {
       "age": int,
       "gender": "Male"|"Female"|"Other",
       "state": string,
       "annual_income": float/int,
       "occupation": string,
       "category": "General"|"OBC"|"SC"|"ST"|"EWS",
       "student_status": bool,
       "farmer_status": bool,
       "disability_status": bool
    }
    """
    try:
        data = request.get_json() or {}

        # Validate inputs
        try:
            age = int(data.get("age", 0))
        except (ValueError, TypeError):
            return api_response(False, "Age must be a valid number.", None, 400)

        if age < 0 or age > 130:
            return api_response(False, "Please enter a realistic age between 0 and 130.", None, 400)

        try:
            income_val = data.get("annual_income")
            annual_income = float(income_val) if income_val not in (None, "") else 0.0
        except (ValueError, TypeError):
            return api_response(False, "Annual income must be a valid numeric amount.", None, 400)

        gender = data.get("gender", "All")
        state = data.get("state", "All")
        occupation = data.get("occupation", "All")
        category = data.get("category", "General")
        student_status = bool(data.get("student_status", False))
        farmer_status = bool(data.get("farmer_status", False))
        disability_status = bool(data.get("disability_status", False))

        # Fetch all active schemes from MySQL
        sql = """
            SELECT id, name, category, description, benefits,
                   age_min, age_max, income_limit, gender, occupation,
                   category_requirement, state_requirement, student_requirement,
                   farmer_requirement, disability_requirement, official_portal_url
            FROM schemes
            WHERE status = 'Active'
            ORDER BY id ASC
        """
        all_schemes = query_all(sql)

        eligible_schemes = []
        not_eligible_schemes = []

        for s in all_schemes:
            scheme = dict(s)
            if scheme.get("income_limit") is not None:
                scheme["income_limit"] = float(scheme["income_limit"])

            unmet_reasons = []
            matched_reasons = []

            # 1. Age check
            age_min = scheme.get("age_min", 0)
            age_max = scheme.get("age_max", 120)
            if age < age_min:
                unmet_reasons.append(f"Minimum age required is {age_min} years (Applicant age: {age}).")
            elif age > age_max:
                unmet_reasons.append(f"Maximum eligible age is {age_max} years (Applicant age: {age}).")
            else:
                matched_reasons.append(f"Age {age} falls within the permitted bracket ({age_min}-{age_max} yrs).")

            # 2. Income limit check
            income_limit = scheme.get("income_limit")
            if income_limit is not None and annual_income > income_limit:
                unmet_reasons.append(f"Annual income ₹{annual_income:,.0f} exceeds scheme ceiling of ₹{income_limit:,.0f}.")
            elif income_limit is not None:
                matched_reasons.append(f"Income ₹{annual_income:,.0f} is within the ₹{income_limit:,.0f} ceiling.")

            # 3. Gender check
            scheme_gender = scheme.get("gender", "All")
            if scheme_gender != "All" and scheme_gender.lower() != gender.lower():
                unmet_reasons.append(f"Scheme is exclusively targeted for {scheme_gender} applicants.")
            elif scheme_gender != "All":
                matched_reasons.append(f"Gender requirement matched ({scheme_gender}).")

            # 4. Social Category requirement
            scheme_cat = scheme.get("category_requirement", "All")
            if scheme_cat != "All" and scheme_cat.upper() != category.upper():
                unmet_reasons.append(f"Requires applicant to belong to {scheme_cat} category.")
            elif scheme_cat != "All":
                matched_reasons.append(f"Social category matched ({scheme_cat}).")

            # 5. State / Geographic requirement
            scheme_state = scheme.get("state_requirement", "All")
            if scheme_state != "All" and state != "All" and scheme_state.lower() != state.lower():
                unmet_reasons.append(f"Applicable exclusively in the state of {scheme_state}.")
            elif scheme_state != "All":
                matched_reasons.append(f"State requirement matched ({scheme_state}).")

            # 6. Farmer requirement
            if scheme.get("farmer_requirement") and not farmer_status:
                unmet_reasons.append("Applicant must be a certified landholding farmer.")
            elif scheme.get("farmer_requirement") and farmer_status:
                matched_reasons.append("Registered landholding farmer status verified.")

            # 7. Student requirement
            if scheme.get("student_requirement") and not student_status:
                unmet_reasons.append("Applicant must be an actively enrolled student.")
            elif scheme.get("student_requirement") and student_status:
                matched_reasons.append("Enrolled student status verified.")

            # 8. Disability requirement
            if scheme.get("disability_requirement") and not disability_status:
                unmet_reasons.append("Requires applicant to hold a certified Disability ID (min 40%).")
            elif scheme.get("disability_requirement") and disability_status:
                matched_reasons.append("Person with Disability (PwD) requirement satisfied.")

            # Categorize result
            if len(unmet_reasons) == 0:
                summary_reason = "Eligible: " + (" ".join(matched_reasons) if matched_reasons else "All citizen criteria align with scheme rules.")
                scheme["eligibility_verdict"] = "Eligible"
                scheme["eligibility_reason"] = summary_reason
                scheme["matched_reasons"] = matched_reasons
                eligible_schemes.append(scheme)
            else:
                scheme["eligibility_verdict"] = "Not Eligible"
                scheme["unmet_reasons"] = unmet_reasons
                scheme["eligibility_reason"] = "Not eligible: " + " ".join(unmet_reasons)
                not_eligible_schemes.append(scheme)

        return api_response(True, "Eligibility evaluation completed successfully", {
            "eligible": eligible_schemes,
            "not_eligible": not_eligible_schemes,
            "total_evaluated": len(all_schemes),
            "eligible_count": len(eligible_schemes),
            "not_eligible_count": len(not_eligible_schemes)
        })
    except Exception as err:
        print(f"[API Error /api/eligibility/check]: {err}")
        return api_response(False, "Failed to process eligibility evaluation.", None, 500)


def _evaluate_scheme_eligibility(scheme, age, gender, state, annual_income, category,
                                  occupation, student_status, farmer_status, disability_status):
    """Internal helper: evaluate a single scheme and return verdict + reasons."""
    if scheme.get("income_limit") is not None:
        scheme["income_limit"] = float(scheme["income_limit"])

    unmet_reasons = []
    matched_reasons = []

    age_min = scheme.get("age_min", 0) or 0
    age_max = scheme.get("age_max", 120) or 120
    if age < age_min:
        unmet_reasons.append(f"Minimum age required is {age_min} years (your age: {age}).")
    elif age > age_max:
        unmet_reasons.append(f"Maximum eligible age is {age_max} years (your age: {age}).")
    else:
        matched_reasons.append(f"Age {age} within required range ({age_min}–{age_max} yrs).")

    income_limit = scheme.get("income_limit")
    if income_limit is not None and annual_income > income_limit:
        unmet_reasons.append(f"Annual income ₹{annual_income:,.0f} exceeds the limit of ₹{income_limit:,.0f}.")
    elif income_limit is not None:
        matched_reasons.append(f"Income ₹{annual_income:,.0f} within limit ₹{income_limit:,.0f}.")

    scheme_gender = scheme.get("gender", "All")
    if scheme_gender != "All" and scheme_gender.lower() != gender.lower():
        unmet_reasons.append(f"Scheme is for {scheme_gender} applicants only.")
    elif scheme_gender != "All":
        matched_reasons.append(f"Gender requirement met ({scheme_gender}).")

    scheme_cat = scheme.get("category_requirement", "All")
    if scheme_cat != "All" and scheme_cat.upper() != category.upper():
        unmet_reasons.append(f"Requires {scheme_cat} social category.")
    elif scheme_cat != "All":
        matched_reasons.append(f"Social category {scheme_cat} matched.")

    scheme_state = scheme.get("state_requirement", "All")
    if scheme_state != "All" and state != "All" and scheme_state.lower() != state.lower():
        unmet_reasons.append(f"Applicable only in {scheme_state}.")
    elif scheme_state != "All":
        matched_reasons.append(f"State requirement met ({scheme_state}).")

    if scheme.get("farmer_requirement") and not farmer_status:
        unmet_reasons.append("Must be a certified landholding farmer.")
    elif scheme.get("farmer_requirement"):
        matched_reasons.append("Farmer status satisfied.")

    if scheme.get("student_requirement") and not student_status:
        unmet_reasons.append("Must be an actively enrolled student.")
    elif scheme.get("student_requirement"):
        matched_reasons.append("Student status satisfied.")

    if scheme.get("disability_requirement") and not disability_status:
        unmet_reasons.append("Must hold a certified Disability ID (min 40%).")
    elif scheme.get("disability_requirement"):
        matched_reasons.append("PwD status satisfied.")

    is_eligible = len(unmet_reasons) == 0
    return is_eligible, matched_reasons, unmet_reasons


@app.route("/api/eligibility/scheme/<int:scheme_id>", methods=["GET"])
@token_required
def check_scheme_eligibility_for_user(current_user, scheme_id):
    """
    Check eligibility for a specific scheme using the logged-in user's profile + documents.
    Combines:
    - User Profile
    - Uploaded Document Vault
    - OCR/Extracted Document Information
    - Scheme Eligibility Rules
    - Scheme Required Documents
    Returns structured 3-state result: ELIGIBLE, NOT ELIGIBLE, or INCOMPLETE INFORMATION.
    """
    try:
        user_id = current_user["user_id"]

        # 1. Fetch scheme
        scheme_row = query_one("""
            SELECT id, name, category, description, benefits,
                   eligibility_rules, age_min, age_max, income_limit, gender, occupation,
                   category_requirement, state_requirement, student_requirement,
                   farmer_requirement, disability_requirement, required_documents,
                   official_portal_url, deadline, status
            FROM schemes WHERE id = %s AND status = 'Active'
        """, (scheme_id,))
        if not scheme_row:
            return api_response(False, f"Scheme {scheme_id} not found.", None, 404)
        scheme = dict(scheme_row)
        if scheme.get("income_limit"):
            scheme["income_limit"] = float(scheme["income_limit"])

        # 2. Fetch user profile
        profile_row = query_one("""
            SELECT u.full_name, p.age, p.gender, p.state, p.annual_income,
                   p.occupation, p.category, p.student_status, p.farmer_status, p.disability_status
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = %s
        """, (user_id,))
        profile = dict(profile_row) if profile_row else {}

        # 3. Fetch user's active documents from document vault
        doc_rows = query_all(
            "SELECT id, doc_type, original_filename, status, extracted_data, uploaded_at FROM user_documents WHERE user_id = %s AND is_active = TRUE ORDER BY uploaded_at DESC",
            (user_id,)
        )
        user_docs_by_slot = {}
        user_docs_by_detected = {}
        for d in doc_rows:
            dt = d["doc_type"]
            doc_dict = {
                "id": d["id"],
                "doc_type": dt,
                "original_filename": d["original_filename"],
                "status": d["status"],
                "uploaded_at": str(d["uploaded_at"]) if d["uploaded_at"] else None,
                "extracted_data": {},
                "detected_doc_type": None,
                "detected_doc_label": None,
                "classification_confidence": 0.0,
                "classification_state": "NEEDS_REVIEW",
                "is_slot_mismatch": False
            }
            if d.get("extracted_data"):
                try:
                    ext = json.loads(d["extracted_data"]) if isinstance(d["extracted_data"], str) else d["extracted_data"]
                    if isinstance(ext, dict):
                        doc_dict["extracted_data"] = ext
                        doc_dict["detected_doc_type"] = ext.get("detected_doc_type")
                        doc_dict["detected_doc_label"] = ext.get("detected_doc_label")
                        doc_dict["classification_confidence"] = ext.get("confidence", 0.0)
                        doc_dict["is_slot_mismatch"] = ext.get("is_slot_mismatch", False)
                except Exception:
                    pass
            user_docs_by_slot[dt] = doc_dict
            detected = doc_dict.get("detected_doc_type")
            if detected and detected != "unrecognized":
                # Prefer higher confidence if multiple documents detected as same type
                if detected not in user_docs_by_detected or doc_dict["classification_confidence"] > user_docs_by_detected[detected]["classification_confidence"]:
                    user_docs_by_detected[detected] = doc_dict

        def get_best_doc(target_type):
            """Return the best document matching target_type: prefer OCR detected type first, then upload slot."""
            if target_type in user_docs_by_detected:
                return user_docs_by_detected[target_type]
            slot_doc = user_docs_by_slot.get(target_type)
            if slot_doc:
                # If slot_doc was confirmed as a DIFFERENT recognized type, do not use for target_type
                if slot_doc.get("detected_doc_type") and slot_doc.get("detected_doc_type") not in (target_type, "unrecognized", None):
                    return None
                return slot_doc
            return None

        # 4. Fetch required doc types for this scheme
        req_docs_rows = query_all(
            "SELECT doc_type, is_mandatory, display_label FROM scheme_required_doc_types WHERE scheme_id = %s ORDER BY is_mandatory DESC, id ASC",
            (scheme_id,)
        )
        required_docs = [{"doc_type": r["doc_type"], "is_mandatory": bool(r["is_mandatory"]), "display_label": r["display_label"]} for r in req_docs_rows]
        if not required_docs and scheme.get("required_documents"):
            required_docs = _parse_required_docs_string(scheme["required_documents"])

        # 5. Document Checklist evaluation
        doc_checklist = []
        missing_mandatory_docs = []
        information_sources = ["Citizen Profile"] if any(profile.values()) else []
        extracted_data_used = {}

        for req in required_docs:
            dt = req["doc_type"]
            best_doc = get_best_doc(dt)
            slot_doc = user_docs_by_slot.get(dt)

            if best_doc:
                is_mismatched = (best_doc.get("doc_type") != dt)
                doc_checklist.append({
                    "doc_type": dt,
                    "display_label": req["display_label"],
                    "is_mandatory": req["is_mandatory"],
                    "user_doc_id": best_doc["id"],
                    "status": best_doc["status"],
                    "original_filename": best_doc["original_filename"],
                    "uploaded_at": best_doc["uploaded_at"],
                    "present": True,
                    "detected_doc_type": best_doc.get("detected_doc_type"),
                    "detected_doc_label": best_doc.get("detected_doc_label"),
                    "slot_mismatch_resolved": is_mismatched,
                    "note": f"Document identified from {best_doc['doc_type']} slot as '{best_doc.get('detected_doc_label', dt)}'" if is_mismatched else None
                })
                # Add to information sources if document has extracted data
                doc_lbl = req["display_label"].split('/')[0].strip()
                if doc_lbl not in information_sources:
                    information_sources.append(doc_lbl)
                if best_doc.get("extracted_data"):
                    extracted_data_used[dt] = best_doc["extracted_data"]
            elif slot_doc and slot_doc.get("is_slot_mismatch"):
                # A file was uploaded into this slot, but OCR detected it as a different document type
                doc_checklist.append({
                    "doc_type": dt,
                    "display_label": req["display_label"],
                    "is_mandatory": req["is_mandatory"],
                    "user_doc_id": slot_doc["id"],
                    "status": "Needs Review",
                    "original_filename": slot_doc["original_filename"],
                    "uploaded_at": slot_doc["uploaded_at"],
                    "present": False,
                    "detected_doc_type": slot_doc.get("detected_doc_type"),
                    "detected_doc_label": slot_doc.get("detected_doc_label"),
                    "note": f"Slot Mismatch: Document uploaded here was detected by OCR as '{slot_doc.get('detected_doc_label', 'different document')}'."
                })
                if req["is_mandatory"]:
                    missing_mandatory_docs.append(req["display_label"])
            else:
                doc_checklist.append({
                    "doc_type": dt,
                    "display_label": req["display_label"],
                    "is_mandatory": req["is_mandatory"],
                    "user_doc_id": None,
                    "status": "Missing",
                    "original_filename": None,
                    "uploaded_at": None,
                    "present": False
                })
                if req["is_mandatory"]:
                    missing_mandatory_docs.append(req["display_label"])

        # 6. Synthesize Profile + Extracted Document Data + Evaluate Rules
        matched_criteria = []
        unmet_criteria = []
        missing_criteria = []
        doc_insights = []
        conflicts = []

        # (A) Age Evaluation
        prof_age = profile.get("age")
        doc_dob = None
        doc_age = None
        for dt_key in ["aadhaar", "birth_certificate"]:
            matched_doc = get_best_doc(dt_key)
            if matched_doc and matched_doc.get("extracted_data", {}).get("date_of_birth"):
                doc_dob = matched_doc["extracted_data"]["date_of_birth"]
                yr_match = re.search(r'(19\d{2}|20\d{2})', doc_dob)
                if yr_match:
                    try:
                        doc_age = datetime.date.today().year - int(yr_match.group(1))
                    except Exception:
                        pass
                break

        if prof_age is not None and doc_age is not None and abs(prof_age - doc_age) > 2:
            conf_msg = f"Age conflict: Profile states {prof_age} years whereas document indicates birth year {yr_match.group(1)} (~{doc_age} years). Profile age is retained."
            conflicts.append(conf_msg)
            doc_insights.append({"type": "mismatch", "field": "age", "profile_value": f"{prof_age} yrs", "document_value": f"{doc_age} yrs", "message": conf_msg})

        effective_age = prof_age if prof_age is not None else doc_age
        age_min = scheme.get("age_min", 0) or 0
        age_max = scheme.get("age_max", 120) or 120

        if effective_age is not None:
            if age_min <= effective_age <= age_max:
                matched_criteria.append(f"Age requirement satisfied: {effective_age} years (Eligible range: {age_min} to {age_max} years)")
            else:
                unmet_criteria.append(f"Age requirement not met: Applicant is {effective_age} years old (Eligible range: {age_min} to {age_max} years)")
        else:
            if age_min > 0 or age_max < 120:
                missing_criteria.append(f"Age is required ({age_min} to {age_max} years) but not available in profile or documents")
            else:
                matched_criteria.append("Age requirement: Open to all age groups")

        # (B) Gender Evaluation
        prof_gender = profile.get("gender")
        aadhaar_doc = get_best_doc("aadhaar")
        doc_gender = aadhaar_doc.get("extracted_data", {}).get("gender_hint") if aadhaar_doc else None

        if prof_gender and doc_gender and prof_gender.lower() != doc_gender.lower() and prof_gender != "All":
            conf_msg = f"Gender discrepancy: Profile states {prof_gender} whereas Aadhaar extraction suggests {doc_gender}. Profile value is retained."
            conflicts.append(conf_msg)
            doc_insights.append({"type": "mismatch", "field": "gender", "profile_value": prof_gender, "document_value": doc_gender, "message": conf_msg})

        effective_gender = prof_gender if (prof_gender and prof_gender != "All") else doc_gender
        scheme_gender = scheme.get("gender", "All")

        if scheme_gender and scheme_gender != "All":
            if effective_gender and effective_gender.lower() == scheme_gender.lower():
                matched_criteria.append(f"Gender requirement satisfied ({scheme_gender})")
            elif effective_gender:
                unmet_criteria.append(f"Gender requirement not met: Scheme is designated for {scheme_gender} applicants (Applicant: {effective_gender})")
            else:
                missing_criteria.append(f"Gender information is required ({scheme_gender}) but not provided in profile")
        else:
            matched_criteria.append("Gender requirement: Open to all genders")

        # (C) State / Domicile Evaluation
        prof_state = profile.get("state")
        doc_state = None
        for dt_key in ["domicile_certificate", "aadhaar", "address_proof"]:
            matched_doc = get_best_doc(dt_key)
            if matched_doc and matched_doc.get("extracted_data", {}).get("state"):
                doc_state = matched_doc["extracted_data"]["state"]
                break

        if prof_state and doc_state and prof_state != "All" and prof_state.lower() != doc_state.lower():
            conf_msg = f"Domicile discrepancy: Profile states {prof_state} whereas document states {doc_state}. Profile state is retained."
            conflicts.append(conf_msg)
            doc_insights.append({"type": "mismatch", "field": "state", "profile_value": prof_state, "document_value": doc_state, "message": conf_msg})

        effective_state = prof_state if (prof_state and prof_state != "All") else doc_state
        scheme_state = scheme.get("state_requirement", "All")

        if scheme_state and scheme_state != "All":
            if effective_state and (scheme_state.lower() in effective_state.lower() or effective_state.lower() in scheme_state.lower()):
                matched_criteria.append(f"State/Domicile requirement satisfied ({scheme_state})")
            elif effective_state:
                unmet_criteria.append(f"State requirement not met: Scheme is restricted to {scheme_state} (Applicant state: {effective_state})")
            else:
                missing_criteria.append(f"State/Domicile information is required ({scheme_state}) but not provided in profile or documents")
        else:
            matched_criteria.append("State/Domicile: Pan-India (All States & Union Territories)")

        # (D) Annual Income Evaluation
        prof_income = profile.get("annual_income")
        inc_doc = get_best_doc("income_certificate")
        doc_income = inc_doc.get("extracted_data", {}).get("annual_income") if inc_doc else None

        if prof_income is not None and doc_income is not None:
            p_inc = float(prof_income)
            d_inc = float(doc_income)
            if abs(p_inc - d_inc) > 5000:
                conf_msg = f"Income conflict: Profile states ₹{p_inc:,.0f} whereas uploaded Income Certificate indicates ₹{d_inc:,.0f}. Both values preserved."
                conflicts.append(conf_msg)
                doc_insights.append({
                    "type": "mismatch",
                    "field": "annual_income",
                    "profile_value": f"₹{p_inc:,.0f}",
                    "document_value": f"₹{d_inc:,.0f}",
                    "message": conf_msg
                })

        income_limit = scheme.get("income_limit")
        if income_limit is not None and income_limit > 0:
            limit_f = float(income_limit)
            if prof_income is not None:
                p_inc = float(prof_income)
                if doc_income is not None:
                    d_inc = float(doc_income)
                    if p_inc <= limit_f and d_inc <= limit_f:
                        matched_criteria.append(f"Income requirement satisfied: Profile income (₹{p_inc:,.0f}) and certificate (₹{d_inc:,.0f}) are within ceiling of ₹{limit_f:,.0f}/year")
                    elif p_inc <= limit_f and d_inc > limit_f:
                        unmet_criteria.append(f"Income ceiling discrepancy: Profile income (₹{p_inc:,.0f}) is within limit, but uploaded Income Certificate states ₹{d_inc:,.0f} (exceeds ₹{limit_f:,.0f})")
                    elif p_inc > limit_f:
                        unmet_criteria.append(f"Income ceiling exceeded: Applicant annual income ₹{p_inc:,.0f} exceeds maximum ceiling of ₹{limit_f:,.0f}/year")
                else:
                    if p_inc <= limit_f:
                        matched_criteria.append(f"Income requirement satisfied: Annual income of ₹{p_inc:,.0f} is within ceiling of ₹{limit_f:,.0f}/year")
                    else:
                        unmet_criteria.append(f"Income ceiling exceeded: Annual income of ₹{p_inc:,.0f} exceeds maximum ceiling of ₹{limit_f:,.0f}/year")
            elif doc_income is not None:
                d_inc = float(doc_income)
                if d_inc <= limit_f:
                    matched_criteria.append(f"Income requirement satisfied: Income Certificate verifies ₹{d_inc:,.0f}/year (Within ceiling of ₹{limit_f:,.0f}/year)")
                else:
                    unmet_criteria.append(f"Income ceiling exceeded: Uploaded Income Certificate shows ₹{d_inc:,.0f} (Exceeds ceiling of ₹{limit_f:,.0f}/year)")
            else:
                missing_criteria.append(f"Annual income information is required (Income ceiling: ₹{limit_f:,.0f}/year), but missing from profile and no Income Certificate uploaded")
        else:
            matched_criteria.append("Income requirement: No income ceiling for this scheme")

        # (E) Social Category Evaluation
        prof_cat = profile.get("category")
        caste_doc = get_best_doc("caste_certificate")
        doc_cat = caste_doc.get("extracted_data", {}).get("category") if caste_doc else None

        if prof_cat and doc_cat and prof_cat != "All" and prof_cat.upper() != doc_cat.upper():
            conf_msg = f"Category discrepancy: Profile specifies '{prof_cat}' whereas Caste Certificate indicates '{doc_cat}'. Both values preserved."
            conflicts.append(conf_msg)
            doc_insights.append({"type": "mismatch", "field": "category", "profile_value": prof_cat, "document_value": doc_cat, "message": conf_msg})

        effective_cat = prof_cat if (prof_cat and prof_cat != "All") else doc_cat
        scheme_cat = scheme.get("category_requirement", "All")

        if scheme_cat and scheme_cat != "All":
            if effective_cat:
                if effective_cat.upper() in scheme_cat.upper() or scheme_cat.upper() in effective_cat.upper():
                    matched_criteria.append(f"Social category requirement satisfied ({effective_cat})")
                else:
                    unmet_criteria.append(f"Social category requirement not met: Scheme is reserved for {scheme_cat} (Applicant category: {effective_cat})")
            else:
                missing_criteria.append(f"Social category is required ({scheme_cat}) but not specified in profile or caste certificate")
        else:
            matched_criteria.append("Social category: Open to all social categories")

        # (F) Disability (PwD) Evaluation
        if scheme.get("disability_requirement"):
            has_dis_prof = bool(profile.get("disability_status"))
            dis_doc = get_best_doc("disability_certificate")
            if dis_doc:
                dis_pct = dis_doc.get("extracted_data", {}).get("disability_percentage")
                if dis_pct:
                    matched_criteria.append(f"Disability requirement satisfied: Verified with UDID/Certificate ({dis_pct}% disability)")
                else:
                    matched_criteria.append("Disability requirement satisfied: Disability certificate present in vault")
            elif has_dis_prof:
                matched_criteria.append("Disability requirement satisfied: PwD status declared in profile")
            else:
                unmet_criteria.append("Scheme requires Person with Disability (PwD) / UDID qualification, which is not indicated in profile or documents")

        # (G) Farmer Requirement Evaluation
        if scheme.get("farmer_requirement"):
            has_farmer_prof = bool(profile.get("farmer_status"))
            has_land_doc = get_best_doc("land_records") is not None
            if has_land_doc:
                matched_criteria.append("Farmer requirement satisfied: Verified with Land Holding Papers / RoR")
            elif has_farmer_prof:
                matched_criteria.append("Farmer requirement satisfied: Landholding farmer status declared in profile")
            else:
                unmet_criteria.append("Scheme requires landholding farmer status, which is not indicated in profile or land records")

        # (H) Student Requirement Evaluation
        if scheme.get("student_requirement"):
            has_student_prof = bool(profile.get("student_status"))
            student_doc = get_best_doc("student_bonafide") or get_best_doc("marksheet_12th") or get_best_doc("marksheet_10th")
            has_student_doc = student_doc is not None
            doc_pct = student_doc.get("extracted_data", {}).get("percentage") if student_doc else None
            if has_student_doc:
                if doc_pct:
                    matched_criteria.append(f"Student enrollment & academic record satisfied: Verified with Marksheet ({doc_pct}%)")
                else:
                    matched_criteria.append("Student enrollment satisfied: Verified with Academic / Student documents")
            elif has_student_prof:
                matched_criteria.append("Student enrollment satisfied: Enrolled student status declared in profile")
            else:
                unmet_criteria.append("Scheme requires enrolled student status, which is not indicated in profile or documents")

        # (I) Occupation Requirement Evaluation
        scheme_occ = scheme.get("occupation", "All")
        if scheme_occ and scheme_occ != "All":
            prof_occ = profile.get("occupation")
            has_emp_doc = get_best_doc("employment_certificate") is not None
            if (prof_occ and scheme_occ.lower() in prof_occ.lower()) or has_emp_doc:
                matched_criteria.append(f"Occupation requirement satisfied: {scheme_occ}")
            elif prof_occ and prof_occ != "All":
                unmet_criteria.append(f"Occupation requirement not met: Scheme is intended for {scheme_occ} (Applicant: {prof_occ})")
            else:
                missing_criteria.append(f"Occupation information is required ({scheme_occ}) but not specified in profile")

        # 7. Determine 3-State Verdict
        if unmet_criteria:
            verdict = "NOT ELIGIBLE"
            status_code = "not_eligible"
            reason = f"You do not meet {len(unmet_criteria)} eligibility criterion/criteria for this scheme."
        elif missing_criteria or missing_mandatory_docs:
            verdict = "INCOMPLETE INFORMATION"
            status_code = "incomplete_information"
            total_missing = len(missing_criteria) + len(missing_mandatory_docs)
            reason = f"Eligibility evaluation is incomplete because {total_missing} required item(s) are missing (see missing criteria & documents below)."
        else:
            verdict = "ELIGIBLE"
            status_code = "eligible"
            reason = "Congratulations! You satisfy all eligibility criteria and all mandatory supporting documents are available in your vault."

        result = {
            "scheme_id": scheme_id,
            "scheme_name": scheme["name"],
            "scheme_category": scheme["category"],
            "verdict": verdict,
            "status_code": status_code,
            "reason": reason,
            "matched_criteria": matched_criteria,
            "unmet_criteria": unmet_criteria,
            "missing_criteria": missing_criteria,
            "missing_mandatory_docs": missing_mandatory_docs,
            "missing_documents": missing_mandatory_docs,
            "information_sources": information_sources,
            "doc_checklist": doc_checklist,
            "doc_insights": doc_insights,
            "conflicts": conflicts,
            "extracted_data_used": extracted_data_used,
            "profile_used": {
                "age": profile.get("age"),
                "gender": profile.get("gender"),
                "state": profile.get("state"),
                "annual_income": float(profile.get("annual_income")) if profile.get("annual_income") is not None else None,
                "category": profile.get("category"),
                "student_status": bool(profile.get("student_status")),
                "farmer_status": bool(profile.get("farmer_status")),
                "disability_status": bool(profile.get("disability_status"))
            }
        }
        return api_response(True, "Scheme eligibility evaluated successfully.", result)

    except Exception as err:
        print(f"[API Error /api/eligibility/scheme/<id>]: {err}")
        return api_response(False, "Failed to evaluate scheme eligibility.", None, 500)


# ==========================================
# Authentication Endpoints (Part 2)
# ==========================================

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@app.route("/api/auth/register", methods=["POST"])
def register():
    """
    Register a new user account.
    Expects JSON: { full_name, email, password, confirm_password }
    """
    try:
        data = request.get_json() or {}
        full_name = data.get("full_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")

        # 1. Required fields validation
        if not full_name:
            return api_response(False, "Full name is required.", None, 400)
        if not email:
            return api_response(False, "Email address is required.", None, 400)
        if not password:
            return api_response(False, "Password is required.", None, 400)
        if not confirm_password:
            return api_response(False, "Please confirm your password.", None, 400)

        # 2. Email format validation
        if not re.match(EMAIL_REGEX, email):
            return api_response(False, "Please enter a valid email address.", None, 400)

        # 3. Password matching and strength validation
        if password != confirm_password:
            return api_response(False, "Password and confirm password do not match.", None, 400)
        if len(password) < 6:
            return api_response(False, "Password must be at least 6 characters long.", None, 400)

        # 4. Check for duplicate email (parameterized query)
        existing_user = query_one("SELECT id FROM users WHERE email = %s", (email,))
        if existing_user:
            return api_response(False, "An account with this email address already exists. Please login.", None, 409)

        # 5. Hash password with Werkzeug (never store plaintext)
        pwd_hash = generate_password_hash(password)

        # 6. Insert new user with default role 'USER'
        user_id = execute_db(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (full_name, email, pwd_hash, "USER")
        )

        # 7. Create default profile row linked to this user
        execute_db("INSERT INTO profiles (user_id) VALUES (%s)", (user_id,))

        # 8. Generate session token
        token = generate_token(user_id, email, "USER")

        user_info = {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "role": "USER"
        }

        return api_response(True, "Registration successful. Welcome to Unified Civic Portal!", {
            "token": token,
            "user": user_info
        }, 201)

    except Exception as err:
        print(f"[API Error /api/auth/register]: {err}")
        return api_response(False, "An unexpected error occurred during registration. Please try again.", None, 500)

@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    Authenticate an existing user.
    Expects JSON: { email, password }
    """
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return api_response(False, "Please provide both email address and password.", None, 400)

        # Query user from MySQL with parameterized query
        user = query_one(
            "SELECT id, full_name, email, password_hash, role FROM users WHERE email = %s",
            (email,)
        )

        if not user or not check_password_hash(user["password_hash"], password):
            return api_response(False, "Invalid email or password. Please check your credentials.", None, 401)

        role = user.get("role") or "USER"
        token = generate_token(user["id"], user["email"], role)

        user_info = {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": role
        }

        return api_response(True, "Login successful.", {
            "token": token,
            "user": user_info
        }, 200)

    except Exception as err:
        print(f"[API Error /api/auth/login]: {err}")
        return api_response(False, "An error occurred during login. Please try again later.", None, 500)

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """
    Logout user endpoint (stateless token clearance confirmation).
    """
    return api_response(True, "Logged out successfully.", None, 200)

# ==========================================
# User Profile Endpoints (Part 2)
# ==========================================

@app.route("/api/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    """
    Retrieve logged-in citizen's complete profile.
    Requires Bearer token authorization.
    """
    try:
        user_id = current_user["user_id"]

        sql = """
            SELECT u.id AS user_id, u.full_name, u.email, u.role,
                   p.id AS profile_id, p.age, p.gender, p.state, p.annual_income,
                   p.occupation, p.category, p.student_status, p.farmer_status,
                   p.disability_status, p.updated_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = %s
        """
        row = query_one(sql, (user_id,))

        if not row:
            return api_response(False, "User account not found.", None, 404)

        # If profile record doesn't exist yet, create one
        if row.get("profile_id") is None:
            execute_db("INSERT INTO profiles (user_id) VALUES (%s)", (user_id,))
            row = query_one(sql, (user_id,))

        profile_data = {
            "user_id": row["user_id"],
            "full_name": row["full_name"],
            "email": row["email"],
            "role": row["role"] or "USER",
            "age": row["age"],
            "gender": row["gender"] or "All",
            "state": row["state"] or "All",
            "annual_income": float(row["annual_income"]) if row["annual_income"] is not None else None,
            "occupation": row["occupation"] or "All",
            "category": row["category"] or "General",
            "student_status": bool(row["student_status"]),
            "farmer_status": bool(row["farmer_status"]),
            "disability_status": bool(row["disability_status"]),
            "updated_at": str(row["updated_at"]) if row.get("updated_at") else None
        }

        return api_response(True, "Profile retrieved successfully.", profile_data)

    except Exception as err:
        print(f"[API Error GET /api/profile]: {err}")
        return api_response(False, "Failed to retrieve user profile.", None, 500)

@app.route("/api/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    """
    Update logged-in citizen's profile details.
    Requires Bearer token authorization.
    """
    try:
        user_id = current_user["user_id"]
        data = request.get_json() or {}

        # 1. Full name update on users table
        full_name = data.get("full_name", "").strip()
        if full_name:
            execute_db("UPDATE users SET full_name = %s WHERE id = %s", (full_name, user_id))

        # 2. Validate age
        raw_age = data.get("age")
        age = None
        if raw_age not in (None, ""):
            try:
                age = int(raw_age)
                if age < 0 or age > 130:
                    return api_response(False, "Age must be between 0 and 130 years.", None, 400)
            except (ValueError, TypeError):
                return api_response(False, "Age must be a valid integer number.", None, 400)

        # 3. Validate annual income
        raw_income = data.get("annual_income")
        annual_income = None
        if raw_income not in (None, ""):
            try:
                annual_income = float(raw_income)
                if annual_income < 0:
                    return api_response(False, "Annual income cannot be negative.", None, 400)
            except (ValueError, TypeError):
                return api_response(False, "Annual income must be a valid numeric amount.", None, 400)

        gender = data.get("gender", "All") or "All"
        state = data.get("state", "All") or "All"
        occupation = data.get("occupation", "All") or "All"
        category = data.get("category", "General") or "General"
        student_status = bool(data.get("student_status", False))
        farmer_status = bool(data.get("farmer_status", False))
        disability_status = bool(data.get("disability_status", False))

        # 4. Upsert profile in MySQL
        existing_profile = query_one("SELECT id FROM profiles WHERE user_id = %s", (user_id,))
        if existing_profile:
            execute_db(
                """
                UPDATE profiles SET
                    age = %s,
                    gender = %s,
                    state = %s,
                    annual_income = %s,
                    occupation = %s,
                    category = %s,
                    student_status = %s,
                    farmer_status = %s,
                    disability_status = %s
                WHERE user_id = %s
                """,
                (age, gender, state, annual_income, occupation, category, student_status, farmer_status, disability_status, user_id)
            )
        else:
            execute_db(
                """
                INSERT INTO profiles (
                    user_id, age, gender, state, annual_income,
                    occupation, category, student_status, farmer_status, disability_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, age, gender, state, annual_income, occupation, category, student_status, farmer_status, disability_status)
            )

        # 5. Fetch updated profile data to return
        sql = """
            SELECT u.id AS user_id, u.full_name, u.email, u.role,
                   p.age, p.gender, p.state, p.annual_income, p.occupation,
                   p.category, p.student_status, p.farmer_status, p.disability_status,
                   p.updated_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = %s
        """
        row = query_one(sql, (user_id,))

        profile_data = {
            "user_id": row["user_id"],
            "full_name": row["full_name"],
            "email": row["email"],
            "role": row["role"] or "USER",
            "age": row["age"],
            "gender": row["gender"] or "All",
            "state": row["state"] or "All",
            "annual_income": float(row["annual_income"]) if row["annual_income"] is not None else None,
            "occupation": row["occupation"] or "All",
            "category": row["category"] or "General",
            "student_status": bool(row["student_status"]),
            "farmer_status": bool(row["farmer_status"]),
            "disability_status": bool(row["disability_status"]),
            "updated_at": str(row["updated_at"]) if row.get("updated_at") else None
        }

        return api_response(True, "Profile updated successfully.", profile_data)

    except Exception as err:
        print(f"[API Error PUT /api/profile]: {err}")
        return api_response(False, "Failed to update user profile.", None, 500)

# ==========================================
# Saved Schemes Endpoints
# ==========================================

@app.route("/api/saved", methods=["GET"])
@token_required
def get_saved_schemes(current_user):
    """Retrieve all schemes saved by the logged-in user."""
    try:
        user_id = current_user["user_id"]

        sql = """
            SELECT
                s.id,
                s.name,
                s.category,
                s.description,
                s.objective,
                s.benefits,
                s.age_min,
                s.age_max,
                s.income_limit,
                s.gender,
                s.occupation,
                s.category_requirement,
                s.state_requirement,
                s.student_requirement,
                s.farmer_requirement,
                s.disability_requirement,
                s.required_documents,
                s.application_process,
                s.official_portal_url,
                s.deadline,
                s.status,
                ss.saved_at
            FROM saved_schemes ss
            INNER JOIN schemes s ON ss.scheme_id = s.id
            WHERE ss.user_id = %s
            ORDER BY ss.saved_at DESC
        """

        saved = query_all(sql, (user_id,))

        formatted_saved = []

        for scheme in saved:
            scheme_data = dict(scheme)

            if scheme_data.get("income_limit") is not None:
                scheme_data["income_limit"] = float(
                    scheme_data["income_limit"]
                )

            if scheme_data.get("saved_at"):
                scheme_data["saved_at"] = str(
                    scheme_data["saved_at"]
                )

            formatted_saved.append(scheme_data)

        return api_response(
            True,
            f"Retrieved {len(formatted_saved)} saved schemes.",
            formatted_saved
        )

    except Exception as err:
        print(f"[API Error GET /api/saved]: {err}")
        return api_response(
            False,
            "Failed to retrieve saved schemes.",
            None,
            500
        )


@app.route("/api/saved", methods=["POST"])
@token_required
def save_scheme(current_user):
    """Save a scheme for the logged-in user."""
    try:
        user_id = current_user["user_id"]
        data = request.get_json() or {}
        scheme_id = data.get("scheme_id")

        if not scheme_id:
            return api_response(
                False,
                "Scheme ID is required.",
                None,
                400
            )

        # Check whether scheme exists
        scheme = query_one(
            "SELECT id FROM schemes WHERE id = %s",
            (scheme_id,)
        )

        if not scheme:
            return api_response(
                False,
                "Scheme not found.",
                None,
                404
            )

        # Check whether already saved
        existing = query_one(
            """
            SELECT id
            FROM saved_schemes
            WHERE user_id = %s AND scheme_id = %s
            """,
            (user_id, scheme_id)
        )

        if existing:
            return api_response(
                False,
                "Scheme is already saved.",
                None,
                409
            )

        execute_db(
            """
            INSERT INTO saved_schemes (user_id, scheme_id)
            VALUES (%s, %s)
            """,
            (user_id, scheme_id)
        )

        return api_response(
            True,
            "Scheme saved successfully.",
            {"scheme_id": scheme_id},
            201
        )

    except Exception as err:
        print(f"[API Error POST /api/saved]: {err}")
        return api_response(
            False,
            "Failed to save scheme.",
            None,
            500
        )


@app.route("/api/saved/<int:scheme_id>", methods=["DELETE"])
@token_required
def remove_saved_scheme(current_user, scheme_id):
    """Remove a saved scheme for the logged-in user."""
    try:
        user_id = current_user["user_id"]

        existing = query_one(
            """
            SELECT id
            FROM saved_schemes
            WHERE user_id = %s AND scheme_id = %s
            """,
            (user_id, scheme_id)
        )

        if not existing:
            return api_response(
                False,
                "Scheme is not saved.",
                None,
                404
            )

        execute_db(
            """
            DELETE FROM saved_schemes
            WHERE user_id = %s AND scheme_id = %s
            """,
            (user_id, scheme_id)
        )

        return api_response(
            True,
            "Scheme removed from saved schemes.",
            {"scheme_id": scheme_id}
        )

    except Exception as err:
        print(f"[API Error DELETE /api/saved/<id>]: {err}")
        return api_response(
            False,
            "Failed to remove saved scheme.",
            None,
            500
        )

# ==========================================
# Document Management Endpoints
# ==========================================

def allowed_file(filename):
    """Check file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/api/documents", methods=["GET"])
@token_required
def get_user_documents(current_user):
    """
    Retrieve all active documents for the logged-in user.
    Returns one document per doc_type (most recently uploaded active one).
    """
    try:
        user_id = current_user["user_id"]
        rows = query_all("""
            SELECT id, doc_type, original_filename, mime_type, file_size_bytes,
                   status, extracted_data, processing_notes, uploaded_at, updated_at
            FROM user_documents
            WHERE user_id = %s AND is_active = TRUE
            ORDER BY doc_type ASC, uploaded_at DESC
        """, (user_id,))

        # Group by doc_type, keep most recent per type
        docs_by_type = {}
        for row in rows:
            dt = row["doc_type"]
            if dt not in docs_by_type:
                d = dict(row)
                d["uploaded_at"] = str(d["uploaded_at"]) if d["uploaded_at"] else None
                d["updated_at"] = str(d["updated_at"]) if d["updated_at"] else None
                d["file_size_kb"] = round(d["file_size_bytes"] / 1024, 1) if d["file_size_bytes"] else 0
                # Parse extracted_data safely
                if d.get("extracted_data"):
                    try:
                        if isinstance(d["extracted_data"], str):
                            d["extracted_data"] = json.loads(d["extracted_data"])
                    except Exception:
                        d["extracted_data"] = {}
                else:
                    d["extracted_data"] = {}
                # Strip processing_notes to safe summary
                d.pop("processing_notes", None)
                docs_by_type[dt] = d

        # Build response with all doc types, even missing ones
        all_doc_types = []
        for dt, label in VALID_DOC_TYPES.items():
            if dt in docs_by_type:
                entry = docs_by_type[dt]
                entry["display_label"] = label
                all_doc_types.append(entry)
            else:
                all_doc_types.append({
                    "id": None,
                    "doc_type": dt,
                    "display_label": label,
                    "original_filename": None,
                    "mime_type": None,
                    "file_size_bytes": 0,
                    "file_size_kb": 0,
                    "status": "Missing",
                    "extracted_data": {},
                    "uploaded_at": None,
                    "updated_at": None
                })

        return api_response(True, f"Retrieved documents for user.", all_doc_types)

    except Exception as err:
        print(f"[API Error GET /api/documents]: {err}")
        return api_response(False, "Failed to retrieve documents.", None, 500)


@app.route("/api/documents/upload", methods=["POST"])
@token_required
def upload_document(current_user):
    """
    Upload or replace a document for the logged-in user.
    Form data: file (multipart), doc_type (string)
    """
    try:
        user_id = current_user["user_id"]

        # Validate doc_type
        doc_type = request.form.get("doc_type", "").strip().lower()
        if not doc_type or doc_type not in VALID_DOC_TYPES:
            return api_response(False, f"Invalid document type. Must be one of: {', '.join(VALID_DOC_TYPES.keys())}", None, 400)

        # Validate file presence
        if 'file' not in request.files:
            return api_response(False, "No file was provided. Please select a file to upload.", None, 400)

        file = request.files['file']
        if not file or file.filename == '':
            return api_response(False, "No file selected.", None, 400)

        # Validate extension
        original_name = file.filename
        if not allowed_file(original_name):
            return api_response(False, "Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.", None, 400)

        # Read file content and validate size
        file_content = file.read()
        file_size = len(file_content)
        if file_size > MAX_FILE_SIZE_BYTES:
            return api_response(False, f"File size ({round(file_size/1024/1024, 1)} MB) exceeds the 10 MB limit.", None, 400)
        if file_size == 0:
            return api_response(False, "The uploaded file appears to be empty.", None, 400)

        # Validate MIME type from content-type header
        mime_type = file.content_type or 'application/octet-stream'
        # Normalize common aliases
        if mime_type in ('image/jpg',):
            mime_type = 'image/jpeg'
        if mime_type not in ALLOWED_MIME_TYPES:
            # Fallback: infer from extension
            ext = original_name.rsplit('.', 1)[1].lower()
            ext_mime_map = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
            mime_type = ext_mime_map.get(ext, mime_type)
            if mime_type not in ALLOWED_MIME_TYPES:
                return api_response(False, "File content type is not allowed.", None, 400)

        # Generate secure random filename
        ext = original_name.rsplit('.', 1)[1].lower()
        stored_filename = f"{uuid.uuid4().hex}_{doc_type}.{ext}"
        file_path = str(UPLOAD_FOLDER / stored_filename)

        # Save file to disk
        with open(file_path, 'wb') as f:
            f.write(file_content)

        # Mark existing active docs of this type as inactive (replace)
        execute_db(
            "UPDATE user_documents SET is_active = FALSE WHERE user_id = %s AND doc_type = %s AND is_active = TRUE",
            (user_id, doc_type)
        )

        # Insert new document record with status 'Submitted'
        doc_id = execute_db("""
            INSERT INTO user_documents
                (user_id, doc_type, original_filename, stored_filename, file_path, mime_type, file_size_bytes, status, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Submitted', TRUE)
        """, (user_id, doc_type, original_name[:500], stored_filename, file_path, mime_type, file_size))

        # Process document asynchronously (inline for now since no task queue)
        proc_result = process_document(doc_id, file_path, mime_type, doc_type)

        # Update status and extracted data
        extracted_json = json.dumps(proc_result["extracted_data"]) if proc_result["extracted_data"] else None
        execute_db("""
            UPDATE user_documents
            SET status = %s, extracted_data = %s, processing_notes = %s
            WHERE id = %s
        """, (proc_result["status"], extracted_json, proc_result["notes"][:1000] if proc_result["notes"] else None, doc_id))

        return api_response(True, f"Document '{VALID_DOC_TYPES[doc_type]}' uploaded and processed successfully.", {
            "doc_id": doc_id,
            "doc_type": doc_type,
            "display_label": VALID_DOC_TYPES[doc_type],
            "original_filename": original_name,
            "file_size_kb": round(file_size / 1024, 1),
            "status": proc_result["status"],
            "processing_notes": proc_result["notes"],
            "detected_doc_type": proc_result.get("detected_doc_type"),
            "detected_doc_label": proc_result.get("detected_doc_label"),
            "classification_confidence": proc_result.get("classification_confidence"),
            "extracted_data": proc_result.get("extracted_data") or {}
        }, 201)

    except Exception as err:
        print(f"[API Error POST /api/documents/upload]: {type(err).__name__}: {err}")
        return api_response(False, "Document upload failed. Please try again.", None, 500)


@app.route("/api/documents/<int:doc_id>/view", methods=["GET"])
@token_required
def view_document(current_user, doc_id):
    """
    Securely serve a document file to the authenticated owner only.
    """
    try:
        user_id = current_user["user_id"]
        row = query_one(
            "SELECT user_id, file_path, mime_type, original_filename FROM user_documents WHERE id = %s AND is_active = TRUE",
            (doc_id,)
        )
        if not row:
            return api_response(False, "Document not found.", None, 404)

        # Strict ownership check
        if row["user_id"] != user_id:
            return api_response(False, "You are not authorized to access this document.", None, 403)

        file_path = row["file_path"]
        if not Path(file_path).exists():
            return api_response(False, "Document file is no longer available on the server.", None, 404)

        return send_file(
            file_path,
            mimetype=row["mime_type"],
            as_attachment=False,
            download_name=row["original_filename"]
        )

    except Exception as err:
        print(f"[API Error GET /api/documents/<id>/view]: {type(err).__name__}")
        return api_response(False, "Failed to retrieve document.", None, 500)


@app.route("/api/documents/<int:doc_id>", methods=["DELETE"])
@token_required
def delete_document(current_user, doc_id):
    """Delete (deactivate) a document. The physical file is retained for audit purposes."""
    try:
        user_id = current_user["user_id"]
        row = query_one(
            "SELECT user_id, doc_type, status FROM user_documents WHERE id = %s AND is_active = TRUE",
            (doc_id,)
        )
        if not row:
            return api_response(False, "Document not found.", None, 404)
        if row["user_id"] != user_id:
            return api_response(False, "You are not authorized to delete this document.", None, 403)

        execute_db("UPDATE user_documents SET is_active = FALSE WHERE id = %s", (doc_id,))
        return api_response(True, "Document removed successfully.", {"doc_id": doc_id})

    except Exception as err:
        print(f"[API Error DELETE /api/documents/<id>]: {type(err).__name__}")
        return api_response(False, "Failed to delete document.", None, 500)


@app.route("/api/documents/<int:doc_id>/reprocess", methods=["POST"])
@token_required
def reprocess_document(current_user, doc_id):
    """Trigger reprocessing of an existing document."""
    try:
        user_id = current_user["user_id"]
        row = query_one(
            "SELECT user_id, file_path, mime_type, doc_type FROM user_documents WHERE id = %s AND is_active = TRUE",
            (doc_id,)
        )
        if not row:
            return api_response(False, "Document not found.", None, 404)
        if row["user_id"] != user_id:
            return api_response(False, "Not authorized.", None, 403)
        if not Path(row["file_path"]).exists():
            return api_response(False, "Document file not found on server.", None, 404)

        proc_result = process_document(doc_id, row["file_path"], row["mime_type"], row["doc_type"])
        extracted_json = json.dumps(proc_result["extracted_data"]) if proc_result["extracted_data"] else None
        execute_db("""
            UPDATE user_documents
            SET status = %s, extracted_data = %s, processing_notes = %s
            WHERE id = %s
        """, (proc_result["status"], extracted_json, proc_result["notes"][:1000] if proc_result["notes"] else None, doc_id))

        return api_response(True, "Document reprocessed.", {
            "doc_id": doc_id,
            "status": proc_result["status"],
            "processing_notes": proc_result["notes"]
        })

    except Exception as err:
        print(f"[API Error POST /api/documents/<id>/reprocess]: {type(err).__name__}")
        return api_response(False, "Reprocessing failed.", None, 500)


# ==========================================
# Application Workflow Endpoints
# ==========================================

def _generate_reference_number():
    """Generate a unique application reference number."""
    timestamp = int(time.time())
    rand_suffix = uuid.uuid4().hex[:6].upper()
    return f"APP-{timestamp}-{rand_suffix}"


@app.route("/api/applications", methods=["GET"])
@token_required
def get_user_applications(current_user):
    """List all applications for the logged-in user."""
    try:
        user_id = current_user["user_id"]
        rows = query_all("""
            SELECT a.id, a.scheme_id, a.reference_number, a.submission_date,
                   a.status, a.deadline, a.notes, a.created_at, a.updated_at,
                   s.name AS scheme_name, s.category AS scheme_category
            FROM applications a
            INNER JOIN schemes s ON a.scheme_id = s.id
            WHERE a.user_id = %s
            ORDER BY a.created_at DESC
        """, (user_id,))

        apps = []
        for row in rows:
            d = dict(row)
            d["created_at"] = str(d["created_at"]) if d["created_at"] else None
            d["updated_at"] = str(d["updated_at"]) if d["updated_at"] else None
            d["submission_date"] = str(d["submission_date"]) if d["submission_date"] else None
            d["deadline"] = str(d["deadline"]) if d["deadline"] else None
            apps.append(d)

        return api_response(True, f"Retrieved {len(apps)} applications.", apps)

    except Exception as err:
        print(f"[API Error GET /api/applications]: {err}")
        return api_response(False, "Failed to retrieve applications.", None, 500)


@app.route("/api/applications", methods=["POST"])
@token_required
def create_application(current_user):
    """
    Create a new application for a scheme.
    Expects JSON: { scheme_id }
    """
    try:
        user_id = current_user["user_id"]
        data = request.get_json() or {}
        scheme_id = data.get("scheme_id")

        if not scheme_id:
            return api_response(False, "scheme_id is required.", None, 400)

        # Verify scheme exists and is active
        scheme_row = query_one("SELECT id, name, deadline FROM schemes WHERE id = %s AND status = 'Active'", (scheme_id,))
        if not scheme_row:
            return api_response(False, "Scheme not found or not active.", None, 404)

        # Check for existing application for same user+scheme
        existing = query_one(
            "SELECT id, status FROM applications WHERE user_id = %s AND scheme_id = %s",
            (user_id, scheme_id)
        )
        if existing:
            return api_response(False, f"You already have an application (status: {existing['status']}) for this scheme.", None, 409)

        # Fetch profile for eligibility snapshot
        profile_row = query_one("""
            SELECT p.age, p.gender, p.state, p.annual_income,
                   p.occupation, p.category, p.student_status, p.farmer_status, p.disability_status
            FROM profiles p WHERE p.user_id = %s
        """, (user_id,))

        # Build eligibility snapshot
        eligibility_snap = {}
        if profile_row:
            eligibility_snap["profile_at_creation"] = {
                "age": profile_row.get("age"),
                "gender": profile_row.get("gender"),
                "state": profile_row.get("state"),
                "annual_income": float(profile_row["annual_income"]) if profile_row.get("annual_income") else None,
                "category": profile_row.get("category"),
            }

        ref_number = _generate_reference_number()

        app_id = execute_db("""
            INSERT INTO applications (user_id, scheme_id, reference_number, status, eligibility_snapshot)
            VALUES (%s, %s, %s, 'Draft', %s)
        """, (user_id, scheme_id, ref_number, json.dumps(eligibility_snap)))

        return api_response(True, "Application created successfully.", {
            "application_id": app_id,
            "reference_number": ref_number,
            "scheme_id": scheme_id,
            "scheme_name": scheme_row["name"],
            "status": "Draft"
        }, 201)

    except Exception as err:
        print(f"[API Error POST /api/applications]: {err}")
        return api_response(False, "Failed to create application.", None, 500)


@app.route("/api/applications/<int:app_id>", methods=["GET"])
@token_required
def get_application_detail(current_user, app_id):
    """Get full application details including document checklist."""
    try:
        user_id = current_user["user_id"]

        app_row = query_one("""
            SELECT a.id, a.scheme_id, a.reference_number, a.submission_date,
                   a.status, a.deadline, a.notes, a.eligibility_snapshot,
                   a.created_at, a.updated_at,
                   s.name AS scheme_name, s.category AS scheme_category,
                   s.description AS scheme_description
            FROM applications a
            INNER JOIN schemes s ON a.scheme_id = s.id
            WHERE a.id = %s
        """, (app_id,))

        if not app_row:
            return api_response(False, "Application not found.", None, 404)

        # Ownership check
        real_app = query_one("SELECT user_id FROM applications WHERE id = %s", (app_id,))
        if not real_app or real_app["user_id"] != user_id:
            return api_response(False, "You are not authorized to view this application.", None, 403)

        app_data = dict(app_row)
        app_data["created_at"] = str(app_data["created_at"]) if app_data["created_at"] else None
        app_data["updated_at"] = str(app_data["updated_at"]) if app_data["updated_at"] else None
        app_data["submission_date"] = str(app_data["submission_date"]) if app_data["submission_date"] else None

        # Parse eligibility snapshot
        if app_data.get("eligibility_snapshot"):
            try:
                if isinstance(app_data["eligibility_snapshot"], str):
                    app_data["eligibility_snapshot"] = json.loads(app_data["eligibility_snapshot"])
            except Exception:
                app_data["eligibility_snapshot"] = {}

        # Fetch required docs for this scheme
        req_docs = query_all(
            "SELECT doc_type, is_mandatory, display_label FROM scheme_required_doc_types WHERE scheme_id = %s ORDER BY is_mandatory DESC, id ASC",
            (app_data["scheme_id"],)
        )
        if not req_docs:
            s_row = query_one("SELECT required_documents FROM schemes WHERE id = %s", (app_data["scheme_id"],))
            if s_row and s_row.get("required_documents"):
                req_docs = _parse_required_docs_string(s_row["required_documents"])

        # Fetch user's active documents
        doc_rows = query_all(
            "SELECT id, doc_type, original_filename, status, uploaded_at FROM user_documents WHERE user_id = %s AND is_active = TRUE",
            (user_id,)
        )
        user_docs = {d["doc_type"]: dict(d) for d in doc_rows}
        for d in user_docs.values():
            d["uploaded_at"] = str(d["uploaded_at"]) if d["uploaded_at"] else None

        # Build checklist
        checklist = []
        for req_doc in req_docs:
            dt = req_doc["doc_type"]
            user_doc = user_docs.get(dt)
            checklist.append({
                "doc_type": dt,
                "display_label": req_doc["display_label"],
                "is_mandatory": bool(req_doc["is_mandatory"]),
                "user_doc_id": user_doc["id"] if user_doc else None,
                "status": user_doc["status"] if user_doc else "Missing",
                "original_filename": user_doc["original_filename"] if user_doc else None,
                "uploaded_at": user_doc["uploaded_at"] if user_doc else None,
                "present": user_doc is not None
            })

        app_data["doc_checklist"] = checklist
        missing_mandatory = [item["display_label"] for item in checklist if item["is_mandatory"] and not item["present"]]
        app_data["missing_mandatory_docs"] = missing_mandatory
        app_data["can_submit"] = len(missing_mandatory) == 0 and app_data["status"] not in ("Submitted", "Under Review", "Approved", "Rejected")

        return api_response(True, "Application details retrieved.", app_data)

    except Exception as err:
        print(f"[API Error GET /api/applications/<id>]: {err}")
        return api_response(False, "Failed to retrieve application details.", None, 500)


@app.route("/api/applications/<int:app_id>/submit", methods=["PUT"])
@token_required
def submit_application(current_user, app_id):
    """
    Submit an application after backend validation of document checklist.
    Backend validates ownership, scheme, and mandatory documents.
    """
    try:
        user_id = current_user["user_id"]

        # Fetch application with ownership check
        app_row = query_one(
            "SELECT id, user_id, scheme_id, status FROM applications WHERE id = %s",
            (app_id,)
        )
        if not app_row:
            return api_response(False, "Application not found.", None, 404)
        if app_row["user_id"] != user_id:
            return api_response(False, "Not authorized to submit this application.", None, 403)
        if app_row["status"] in ("Submitted", "Under Review", "Approved", "Rejected"):
            return api_response(False, f"Application cannot be submitted (current status: {app_row['status']}).", None, 400)

        scheme_id = app_row["scheme_id"]

        # Verify scheme is still active
        scheme_row = query_one("SELECT id, name, required_documents FROM schemes WHERE id = %s AND status = 'Active'", (scheme_id,))
        if not scheme_row:
            return api_response(False, "Associated scheme is no longer active.", None, 400)

        # Fetch required mandatory docs
        req_docs = query_all(
            "SELECT doc_type, display_label FROM scheme_required_doc_types WHERE scheme_id = %s AND is_mandatory = TRUE",
            (scheme_id,)
        )
        if not req_docs and scheme_row.get("required_documents"):
            parsed = _parse_required_docs_string(scheme_row["required_documents"])
            req_docs = [p for p in parsed if p.get("is_mandatory")]

        # Fetch user's active documents
        doc_rows = query_all(
            "SELECT doc_type FROM user_documents WHERE user_id = %s AND is_active = TRUE",
            (user_id,)
        )
        uploaded_types = {d["doc_type"] for d in doc_rows}

        # Backend validates mandatory docs
        missing = []
        for req in req_docs:
            if req["doc_type"] not in uploaded_types:
                missing.append(req["display_label"])

        if missing:
            return api_response(False,
                f"Cannot submit: {len(missing)} mandatory document(s) are missing: {', '.join(missing)}.",
                {"missing_documents": missing}, 400)

        # All good — mark as Submitted
        from datetime import date
        today = date.today().isoformat()
        execute_db("""
            UPDATE applications
            SET status = 'Submitted', submission_date = %s
            WHERE id = %s
        """, (today, app_id))

        return api_response(True, "Application submitted successfully.", {
            "application_id": app_id,
            "status": "Submitted",
            "submission_date": today,
            "scheme_name": scheme_row["name"]
        })

    except Exception as err:
        print(f"[API Error PUT /api/applications/<id>/submit]: {err}")
        return api_response(False, "Failed to submit application.", None, 500)


@app.route("/api/applications/<int:app_id>/checklist", methods=["GET"])
@token_required
def get_application_checklist(current_user, app_id):
    """Get document checklist for an application."""
    try:
        user_id = current_user["user_id"]

        app_row = query_one("SELECT user_id, scheme_id, status FROM applications WHERE id = %s", (app_id,))
        if not app_row:
            return api_response(False, "Application not found.", None, 404)
        if app_row["user_id"] != user_id:
            return api_response(False, "Not authorized.", None, 403)

        req_docs = query_all(
            "SELECT doc_type, is_mandatory, display_label FROM scheme_required_doc_types WHERE scheme_id = %s ORDER BY is_mandatory DESC",
            (app_row["scheme_id"],)
        )
        doc_rows = query_all(
            "SELECT id, doc_type, original_filename, status, uploaded_at FROM user_documents WHERE user_id = %s AND is_active = TRUE",
            (user_id,)
        )
        user_docs = {d["doc_type"]: dict(d) for d in doc_rows}

        checklist = []
        for rd in req_docs:
            dt = rd["doc_type"]
            ud = user_docs.get(dt)
            checklist.append({
                "doc_type": dt,
                "display_label": rd["display_label"],
                "is_mandatory": bool(rd["is_mandatory"]),
                "user_doc_id": ud["id"] if ud else None,
                "status": ud["status"] if ud else "Missing",
                "uploaded_at": str(ud["uploaded_at"]) if ud and ud.get("uploaded_at") else None,
                "present": ud is not None
            })

        return api_response(True, "Checklist retrieved.", {
            "application_id": app_id,
            "application_status": app_row["status"],
            "checklist": checklist
        })

    except Exception as err:
        print(f"[API Error GET /api/applications/<id>/checklist]: {err}")
        return api_response(False, "Failed to retrieve checklist.", None, 500)


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"[Unified Civic Portal Backend] Running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
