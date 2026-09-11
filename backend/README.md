# Backend - Unified Civic Scheme & Eligibility Portal

The backend is built with **Python**, **Flask**, and **MySQL**. It exposes REST APIs for searching welfare schemes, viewing comprehensive scheme details, filtering schemes by sector/state, and executing rule-based eligibility assessments.

## Prerequisites
- Python 3.10+
- MySQL Server (version 8.0 or 9.x)

## Setup Instructions

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # On Windows (PowerShell or Command Prompt)
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=gov_scheme_tracker
   FLASK_PORT=5000
   FLASK_DEBUG=True
   ```

5. **Initialize Database Schema and Seed Data:**
   Run the seed script (this creates the database, tables, and inserts realistic sample schemes):
   ```bash
   python seed.py
   ```

6. **Start the Flask Development Server:**
   ```bash
   python app.py
   ```
   The backend API will start at `http://127.0.0.1:5000`.

## API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and health check |
| `GET` | `/api/schemes` | Fetch schemes (supports `?q=`, `?category=`, `?state=`, `?scope=`) |
| `GET` | `/api/schemes/<id>` | Fetch detailed profile of a single scheme |
| `GET` | `/api/schemes/categories` | List distinct scheme categories with scheme count |
| `POST` | `/api/eligibility/check` | Rule-based evaluation of citizen criteria against MySQL schemes |
