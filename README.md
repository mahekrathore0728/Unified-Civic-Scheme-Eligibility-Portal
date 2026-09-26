Unified Civic Scheme & Eligibility Portal

A civic-tech web application for discovering Indian government welfare schemes, evaluating scheme eligibility, and managing citizen profile information through a connected frontend-backend system.

**Project Overview**

The Unified Civic Scheme & Eligibility Portal is a full-stack application designed to help citizens explore welfare schemes, review scheme details, and compare their profile against eligibility rules in a transparent manner. The system is built around a React frontend, a Flask API layer, and a MySQL-backed data model that stores scheme information and user-related records.

The application includes scheme search and filtering, eligibility checks, protected profile access, and direct links to official government portals for the schemes represented in the database.

**Problem Statement**

Citizens often need to navigate multiple government portals and fragmented public information sources to find relevant benefits and understand eligibility requirements. The project aims to bring that information into a single interface where scheme data and rule-based eligibility evaluation are presented in a clearer, more structured format.

**Our Solution**

This project centralizes welfare scheme discovery and assessment within one portal. Users can browse available schemes, inspect policy details, and submit demographic and socioeconomic inputs to compare their profile against stored eligibility requirements. The application also includes user authentication and profile management for users who want to save and reuse their details.

**Key Features**

- Search and filter schemes by keyword, category, state, and scope
- View detailed scheme information including objective, benefits, documents, and application guidance
- Run a rule-based eligibility check using user profile data
- Compare results into qualifying and non-qualifying scheme groups
- Register, log in, and maintain a personal citizen profile
- Access protected profile pages through authenticated routes
- Review official portal links associated with each scheme
- **Document Vault**: Upload, view, reprocess, and manage personal eligibility documents (Aadhaar, Marksheets, Income, Caste, Domicile, Bank Passbook)
- **Document-Assisted Processing**: OCR & text extraction (PyMuPDF / pytesseract) parsing structured fields to assist eligibility checking
- **Scheme-Specific Document Checklist**: Dynamic verification of mandatory vs optional documents for each scheme
- **Application Readiness & Tracking Workflow**: Internal portal workflow tracking states from Draft to Submitted with mandatory document checks

**How the System Works**

The portal follows a simple layered flow:

1. The React frontend renders the user interface for home, scheme listing, profile, login, signup, and eligibility evaluation screens.
2. The Flask backend exposes API endpoints for scheme data, category listing, authentication, profile updates, and eligibility checks.
3. The MySQL database stores scheme metadata, user accounts, profiles, and application-related records.
4. The eligibility engine compares user inputs against scheme rules stored in the database and returns matching results.

**Technology Stack**

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router DOM, CSS |
| Backend | Python, Flask, Flask-CORS, python-dotenv, Werkzeug |
| Database | MySQL |
| Client-Server Integration | REST API with JSON responses |

**System Architecture**

The system is organized as a standard three-tier application:

- Frontend: user-facing application pages and navigation
- Backend: API endpoints, authentication, token validation, and eligibility logic
- Database: scheme records, user records, profile records, and application-related tables

The application logic uses a signed token pattern for session-based authentication and parameterized SQL calls for database access.

**Project Structure**

```text
Unified-Civic-Scheme-Eligibility-Portal/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── README.md
│   ├── requirements.txt
│   ├── schema.sql
│   ├── seed.py
│   ├── test_auth_api.py
│   └── .env
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── README.md
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
├── .gitignore
├── README.md
├── run_project.bat
└── backend/.env
```

**Database Overview**

The project creates a MySQL database named gov_scheme_tracker. The schema includes tables for users, profiles, schemes, saved_schemes, applications, documents, and notifications. The schemes table contains scheme outcomes, eligibility values, required documents, and official portal URLs.

**Getting Started**

The project requires Python, Node.js, and a running MySQL instance. The backend dependencies are defined in backend/requirements.txt and the frontend dependencies are defined in frontend/package.json.

Essential setup commands used by the project are kept minimal:

```bash
cd backend
python -m venv venv
pip install -r requirements.txt
python seed.py
python app.py
```

```bash
cd frontend
npm install
npm run dev
```

**Application Usage**

The portal supports the following user flows:

- Home page for scheme discovery and overview
- Schemes page for browsing and filtering available programs
- Scheme detail page for eligibility rules, benefits, application steps, and portal references
- Eligibility checker for evaluating user suitability against schemes
- Signup and login flow for user authentication
- Profile page for saving and updating personal citizen information

The app also includes a protected route to restrict profile access to authenticated users.

**Future Scope**

The current codebase is structured around core scheme discovery, eligibility evaluation, and profile-based workflows. The database schema also includes tables for saved schemes, applications, document tracking, and notifications, which indicates a wider application-tracking and civic-service workflow that can be expanded further in future development.

**Team / Contributors**

The project footer lists the following contributors:

- Mahek
- Kratika
- Mansi
- Harshita

**License**

No explicit project license file was found in the reviewed repository. This project does not currently include a license declaration in the workspace files examined.

**Disclaimer**

This portal is an independent digital platform designed to help citizens discover government welfare schemes and understand eligibility criteria. It is not an official Government of India website or government agency, and users should verify any latest scheme details on the relevant official government portal before applying.


This project is an independent digital platform designed to help citizens discover government welfare schemes and understand eligibility criteria. The portal is not an official Government of India website or government agency, and scheme information may change. Users should verify the latest information on the respective official government portal before applying.

## License

No explicit license file is included in the current workspace. This repository does not show a project-specific license statement in the files reviewed.
