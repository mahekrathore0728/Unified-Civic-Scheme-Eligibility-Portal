import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database import query_all, query_one, execute_db

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

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
# Future Phases Modular Stubs
# ==========================================

@app.route("/api/auth/<action>", methods=["POST"])
def auth_placeholder(action):
    """Modular placeholder for Phase 2 authentication."""
    return api_response(True, f"Authentication action '{action}' is configured for Phase 2.", {
        "phase": 2,
        "feature": "User Authentication & Session Management"
    })

@app.route("/api/saved", methods=["GET", "POST"])
@app.route("/api/saved/<int:scheme_id>", methods=["DELETE"])
def saved_placeholder(scheme_id=None):
    """Modular placeholder for Phase 2 bookmarking."""
    return api_response(True, "Saved schemes feature is configured for Phase 2.", {
        "phase": 2,
        "feature": "Bookmark & Saved Schemes"
    })

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
