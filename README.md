# Unified Civic Scheme & Eligibility Portal

A college-level full-stack civic-tech web application for discovering Indian government welfare schemes, checking citizen eligibility through a deterministic rule-based engine, viewing required document checklists, and consulting authoritative portal procedures.

---

## 1. Project Overview

Citizens frequently struggle to discover and evaluate welfare benefits due to fragmented administrative portals, dense official gazettes, and unclear eligibility criteria. The **Unified Civic Scheme & Eligibility Portal** provides a centralized, transparent platform where citizens can:
- Discover central and state welfare schemes across key sectors (Agriculture, Healthcare, Education, Housing, Women & Child, Social Welfare, and Employment).
- Inspect statutory requirements, benefit allowances, and document checklists.
- Execute a transparent, rule-based eligibility check to evaluate qualifying welfare schemes without relying on opaque algorithms.
- Review authoritative official government portal references for verified application procedures.

---

## 2. Features

### Part 1: Core Scheme Discovery & Eligibility
- **Civic Home Portal**: Clean hero interface with quick keyword search, service pillars, and live featured schemes dynamically retrieved from MySQL.
- **Schemes Directory**:
  - Full-text search across scheme titles, objectives, and benefits.
  - Multi-faceted filtering by sector/category, state/region, and central vs. state jurisdiction.
  - Detailed metadata chips (age bracket, income limits, beneficiary status).
- **Comprehensive Scheme Profile**:
  - Detailed objectives and exact benefit amounts.
  - Granular eligibility criteria breakdown (age, gender, income, caste category, occupation, state).
  - Physical and digital document checklist.
  - Step-by-step application guidance.
  - Authoritative government portal links with clear informational disclaimers.
- **Rule-Based Eligibility Checker**:
  - Input demographic and socioeconomic parameters (age, gender, state, income, occupation, category, student/farmer/disability status).
  - Evaluates rules deterministically against MySQL database records using parameterized queries.
  - Categorizes results into **Qualifying Schemes** (with criteria match reasons) and **Criteria Not Matched** (with exact unmet conditions).
  - Interactive preset personas (Farmer, SC Student, Senior Citizen, Street Vendor) for rapid professor viva demonstration.
  - **Autofill from My Profile**: Logged-in citizens can instantly populate the eligibility checker using their saved profile data.

### Part 2: Authentication & Citizen Profile
- **Citizen Registration (Signup)**: Full Name, Email, Password, and Password Confirmation with validation, duplicate detection, and secure password hashing using Werkzeug.
- **Citizen Login**: Email and password authentication against MySQL database returning secure session tokens.
- **User Roles**: Supported `USER` (default for registered citizens) and `ADMIN`.
- **Citizen Profile**: View and update full demographic, economic, and beneficiary attributes (Age, Gender, Domicile State, Annual Income, Occupation, Social Category, Student/Farmer/Disability flags).
- **Protected Routes**: Secure navigation ensuring the Profile page is accessible exclusively by authenticated citizens.
- **Session State & Logout**: Stateless token verification with auto-login, header-based Bearer authentication, and clean logout handling.

---

## 3. Technology Stack

- **Frontend**:
  - React.js (v18+)
  - Vite
  - React Router DOM (v6+)
  - Semantic HTML5 & Responsive CSS3
- **Backend**:
  - Python 3.10+
  - Flask & Flask-CORS
  - `mysql-connector-python`
  - `python-dotenv`
  - `Werkzeug` (Password hashing)
- **Database**:
  - MySQL Server (v8.0 or v9.x)
  - Parameterized queries exclusively (no ORM overhead, zero SQLite)

---

## 4. Project Structure

```
Unified-Civic-Scheme-Eligibility-Portal/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SchemeCard.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Schemes.jsx
│   │   │   ├── SchemeDetails.jsx
│   │   │   └── EligibilityChecker.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── schema.sql
│   ├── seed.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── README.md
└── .gitignore
```

---

## 5. MySQL Database Structure

The database `gov_scheme_tracker` is organized with referential integrity:

1. **`schemes`**: Stores core welfare scheme data, eligibility thresholds (`age_min`, `age_max`, `income_limit`, `gender`, `category_requirement`, `state_requirement`, `farmer_requirement`, `student_requirement`, `disability_requirement`), benefits, required documents, and official portal URLs.
2. **`users`**: User records with hashed passwords (`role`: admin or citizen).
3. **`profiles`**: Extended demographic profile linked to `users`.
4. **`saved_schemes`**: User bookmarks with unique composite key `(user_id, scheme_id)`.
5. **`applications`**: Application tracking records with status lifecycle and unique reference numbers.
6. **`documents`**: Document verification checklist linked to applications.
7. **`notifications`**: System alerts and status updates.

---

## 6. MySQL Setup

1. Ensure MySQL Server is running on your system.
2. Log in to your MySQL command line client or MySQL Workbench:
   ```sql
   CREATE DATABASE gov_scheme_tracker;
   ```
3. To initialize the tables manually, you can run:
   ```bash
   mysql -u root -p gov_scheme_tracker < backend/schema.sql
   ```
   *(Alternatively, running `python seed.py` will automatically execute `schema.sql` and insert sample schemes).*

---

## 7. Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=gov_scheme_tracker

# Flask Server Configuration
FLASK_PORT=5000
FLASK_DEBUG=True
```

> **Security Note:** Never commit `.env` or place real passwords in public repositories. `.env` is listed in `.gitignore`.

---

## 8. Backend Setup

Open a terminal in the project root:

```bash
cd backend

# 1. Create a Python virtual environment
python -m venv venv

# 2. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# 3. Install required packages
pip install -r requirements.txt

# 4. Initialize schema and seed realistic government schemes
python seed.py

# 5. Start Flask API server
python app.py
```

The Flask API will run at `http://127.0.0.1:5000`.

---

## 9. Frontend Setup

Open a separate terminal in the project root:

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite React development server
npm run dev
```

The React frontend will be available at `http://localhost:5173`.

---

## 10. How to Run the Complete System

1. **Start MySQL Server** (e.g. Windows Service `MySQL` / `MySQL80` / `MySQL96` or XAMPP).
2. **Terminal 1 (Backend):**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python seed.py
   python app.py
   ```
3. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 11. API Overview

| HTTP Method | Endpoint | Purpose | Authorization |
|---|---|---|---|
| `GET` | `/` | API status and health check | Public |
| `GET` | `/api/schemes` | List schemes with search (`?q=`), category (`?category=`), state (`?state=`), and jurisdiction (`?scope=`) | Public |
| `GET` | `/api/schemes/<id>` | Full profile of a specific scheme | Public |
| `GET` | `/api/schemes/categories` | Distinct categories list with count of schemes | Public |
| `POST` | `/api/eligibility/check` | Rule engine evaluating citizen criteria against MySQL schemes | Public |
| `POST` | `/api/auth/register` | Register new user account with hashed password | Public |
| `POST` | `/api/auth/login` | Authenticate user credentials and return session token | Public |
| `POST` | `/api/auth/logout` | Client logout confirmation | Public |
| `GET` | `/api/profile` | Retrieve authenticated citizen's demographic & socioeconomic profile | `Bearer <token>` |
| `PUT` | `/api/profile` | Update authenticated citizen's demographic & socioeconomic profile | `Bearer <token>` |

---

## 12. Demonstration Accounts & Presets

- **Default Database Seed Schemes**:
  1. *PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)* - Agriculture
  2. *Ayushman Bharat - PMJAY* - Health
  3. *Pradhan Mantri Awas Yojana (PMAY-U)* - Housing
  4. *Sukanya Samriddhi Yojana (SSY)* - Women & Child
  5. *National Means-cum-Merit Scholarship Scheme (NMMSS)* - Education
  6. *PM SVANidhi* - Employment / Street Vendors
  7. *Pradhan Mantri Mudra Yojana (PMMY)* - MSME / Entrepreneurship
  8. *Post Matric Scholarship for SC Students* - Education
  9. *Indira Gandhi National Old Age Pension Scheme (IGNOAPS)* - Social Welfare
  10. *Divyangjan Swavalamban Yojana* - Disability Welfare

- **Eligibility Checker Quick Test Presets**:
  - 🌾 **Farmer Persona**: Age 38, Income ₹1,80,000, Farmer Flag -> Matches *PM-KISAN* and *Ayushman Bharat*.
  - 🎓 **SC Student Persona**: Age 17, Income ₹1,20,000, SC Category, Student Flag -> Matches *Post Matric Scholarship for SC Students* and *NMMSS*.
  - 👴 **Senior Citizen Persona**: Age 68, Income ₹90,000 -> Matches *IGNOAPS* and *Ayushman Bharat*.
  - 🛒 **Street Vendor Persona**: Age 32, Income ₹1,50,000 -> Matches *PM SVANidhi* and *Mudra Yojana*.

---

## 13. Future Scope

The application is structured modularly so advanced capabilities can be phased in:
- **Phase 2**: Full user authentication sessions, scheme bookmarking, and personal application tracker with status timeline.
- **Phase 3**: Natural language scheme search, intelligent eligibility explanations, and automated civic assistant.
- **Phase 4**: Document OCR extraction and automated identity verification.
- **Phase 5**: Government API integration where officially available for real-time status synchronization.
- **Phase 6**: Multilingual translation and regional language support (Hindi, Marathi, Tamil, Telugu, etc.).

---

## 14. Disclaimer

This platform is an independent informational and application-tracking system. Users should verify scheme details, eligibility, deadlines, and application procedures on the official government portal before applying. Direct links to authoritative government portals are provided for each respective scheme.
