import os
import re
import time
import json
import hmac
import hashlib
import base64
from functools import wraps
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from database import query_all, query_one, execute_db

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.environ.get('SECRET_KEY', 'civic-scheme-portal-secret-key-2026')

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

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
        "version": "1.0.0 (Phase 1)",
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

@app.route("/api/applications", methods=["GET", "POST"])
@app.route("/api/applications/<int:app_id>", methods=["GET", "PUT"])
def applications_placeholder(app_id=None):
    """Modular placeholder for Phase 2 application tracker."""
    return api_response(True, "Application tracking feature is configured for Phase 2.", {
        "phase": 2,
        "feature": "Application Lifecycle Tracking"
    })

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"[Unified Civic Portal Backend] Running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
