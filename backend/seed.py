import os
from pathlib import Path
import mysql.connector
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from database import get_db_config, get_db_connection, execute_db, query_one, query_all

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

SAMPLE_SCHEMES = [
    {
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "category": "Agriculture",
        "description": "Central Sector scheme providing income support of Rs 6,000 per year in three equal 4-monthly installments directly into the bank accounts of all landholding farmer families across the country.",
        "objective": "Supplement financial needs of small and marginal farmers in procuring various inputs to ensure proper crop health and appropriate yields, commensurate with anticipated farm income at the end of each crop cycle.",
        "benefits": "Direct Benefit Transfer (DBT) of ₹6,000 per annum credited in three equal installments of ₹2,000 each.",
        "eligibility_rules": "All landholding farmer families having cultivable landholding in their names. Institutional landholders and farmer families holding constitutional posts or paying income tax are excluded.",
        "age_min": 18,
        "age_max": 100,
        "income_limit": 400000.0,
        "gender": "All",
        "occupation": "Farmer",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": True,
        "disability_requirement": False,
        "required_documents": "Aadhaar Card, Land Holding Papers / Record of Rights (RoR), Active Bank Account Passbook, Valid Mobile Number",
        "application_process": "Eligible farmers can register online through the PM-KISAN web portal or visit nearby Common Service Centres (CSCs) / State Nodal Officers.",
        "official_portal_url": "https://pmkisan.gov.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Ayushman Bharat - PMJAY (Pradhan Mantri Jan Arogya Yojana)",
        "category": "Health",
        "description": "The world's largest government-sponsored health assurance initiative, providing secondary and tertiary care hospitalization coverage of Rs 5 lakh per family per year to vulnerable households.",
        "objective": "Mitigate catastrophic healthcare expenditures that push millions of Indian families into poverty, ensuring universal, cashless healthcare access.",
        "benefits": "Cashless hospitalization and treatment coverage up to ₹5,00,000 per family annually across empanelled public and private hospitals nationwide.",
        "eligibility_rules": "Families listed in the Socio-Economic Caste Census (SECC) database or falling within specified low-income deprivation criteria.",
        "age_min": 0,
        "age_max": 120,
        "income_limit": 250000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Aadhaar Card or Ration Card, Family ID / Proof of Household, Mobile Number",
        "application_process": "Check eligibility online at pmjay.gov.in or visit any empanelled hospital or Ayushman Mitra kiosk to generate an Ayushman Golden Card.",
        "official_portal_url": "https://pmjay.gov.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
        "category": "Housing",
        "description": "Comprehensive urban housing scheme providing financial interest subsidies and direct assistance to eligible urban households, including slum dwellers, to construct or acquire pucca houses.",
        "objective": "Ensure every eligible urban family has access to a secure, pucca dwelling unit with basic civic amenities including water, sanitation, and electricity.",
        "benefits": "Credit Linked Subsidy Scheme (CLSS) up to ₹2.67 lakh on home loan interest, or direct subsidy of ₹1.5 lakh for new construction / enhancement.",
        "eligibility_rules": "Beneficiary family should not own a pucca house anywhere in India. Annual household income within Economically Weaker Section (EWS) or Low Income Group (LIG) limits.",
        "age_min": 21,
        "age_max": 75,
        "income_limit": 300000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Aadhaar Card, Income Certificate / Salary Slips, Bank Account Statements, Affidavit confirming no other pucca property ownership",
        "application_process": "Apply online through the PMAYMIS official portal or via Citizen Service Centres (CSCs) with biometric Aadhaar e-KYC.",
        "official_portal_url": "https://pmaymis.gov.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Sukanya Samriddhi Yojana (SSY)",
        "category": "Women & Child",
        "description": "Government of India backed small-deposit savings initiative under the 'Beti Bachao Beti Padhao' campaign, dedicated exclusively to the financial prosperity and higher education of the girl child.",
        "objective": "Encourage parents to build a dedicated financial corpus for their daughter's higher education and marriage, fostering social and financial equality.",
        "benefits": "Attractive sovereign guaranteed interest rate (8.2% p.a.), exempt under Section 80C, with partial withdrawal allowed after age 18 for higher education.",
        "eligibility_rules": "Account can be opened by biological parents or legal guardians for a girl child from birth until she attains the age of 10 years. Maximum two accounts per family.",
        "age_min": 0,
        "age_max": 10,
        "income_limit": None,
        "gender": "Female",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Birth Certificate of the Girl Child, Aadhaar Card / Identity Proof of Parent or Legal Guardian, Address Proof, Recent Photograph",
        "application_process": "Open account at any designated Post Office branch or authorized commercial bank with a minimum deposit of ₹250.",
        "official_portal_url": "https://www.india.gov.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "National Means-cum-Merit Scholarship Scheme (NMMSS)",
        "category": "Education",
        "description": "Centrally sponsored scholarship scheme awarded to meritorious students from economically weaker sections to reduce dropouts at class VIII and encourage continuation through secondary education.",
        "objective": "Provide sustained monetary support to bright secondary school students (classes IX to XII) in government and government-aided schools.",
        "benefits": "Scholarship grant of ₹12,000 per academic year (₹1,000 per month) disbursed directly to the student's bank account via DBT.",
        "eligibility_rules": "Students studying in Class IX after clearing the state-level NMMSS selection exam, who scored at least 55% in Class VIII, and parental annual income not exceeding ₹3,50,000.",
        "age_min": 13,
        "age_max": 18,
        "income_limit": 350000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": True,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Class VII & VIII Marksheets, Parental Income Certificate from Competent Authority, School Enrollment ID, Aadhaar Linked Bank Passbook",
        "application_process": "Submit application on the National Scholarship Portal (NSP) and complete verification through the head of the school institute.",
        "official_portal_url": "https://scholarships.gov.in",
        "deadline": "31 October 2026",
        "status": "Active"
    },
    {
        "name": "PM SVANidhi (PM Street Vendor's AtmaNirbhar Nidhi)",
        "category": "Employment",
        "description": "Special micro-credit facility providing collateral-free working capital loans to urban street vendors and micro-traders whose livelihoods were impacted.",
        "objective": "Facilitate access to formalized credit channels, stimulate digital transactions, and enable graduation into larger formal business credit lines.",
        "benefits": "Collateral-free loan of ₹10,000 in first tranche, scalable to ₹20,000 and ₹50,000 upon timely repayment, with 7% interest subsidy and digital cashback.",
        "eligibility_rules": "Street vendors engaged in vending in urban areas on or before the cut-off date possessing a Certificate of Vending or Identity Card issued by Urban Local Bodies (ULBs).",
        "age_min": 18,
        "age_max": 65,
        "income_limit": 200000.0,
        "gender": "All",
        "occupation": "Street Vendor / Self-Employed",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Vending Certificate / Letter of Recommendation from ULB/Town Vending Committee, Aadhaar Card, Bank Account Details",
        "application_process": "Apply via PM SVANidhi mobile app or portal, or approach local Common Service Centres (CSCs) / partner lending institutions.",
        "official_portal_url": "https://pmsvanidhi.mohua.gov.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "category": "Employment",
        "description": "Flagship scheme providing collateral-free micro loans up to Rs 10 lakh to non-corporate, non-farm small and micro enterprises for income-generating activities.",
        "objective": "Foster grassroots entrepreneurship and self-employment by expanding easy, formalized credit to micro enterprises, shopkeepers, and artisans.",
        "benefits": "Loans categorised in three stages: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5,00,000), and Tarun (₹5,00,000 to ₹10,00,000) at competitive interest rates with zero processing fee.",
        "eligibility_rules": "Any Indian citizen having a viable business blueprint for manufacturing, processing, trading, or service sector activity who requires loan up to ₹10 lakh.",
        "age_min": 18,
        "age_max": 65,
        "income_limit": None,
        "gender": "All",
        "occupation": "Business / Self-Employed",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Business Profile Proposal, Proof of Identity (Aadhaar/Voter ID), Proof of Residence, Business Address Proof, Machinery/Asset Quotations",
        "application_process": "Submit application online via the Udyamimitra portal (udyamimitra.in) or visit any commercial, regional rural, or cooperative bank branch.",
        "official_portal_url": "https://www.mudra.org.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Post Matric Scholarship for SC Students",
        "category": "Education",
        "description": "Centrally sponsored scholarship scheme to provide financial assistance to Scheduled Caste students studying at post-matriculation or post-secondary stages.",
        "objective": "Support Scheduled Caste students to complete their education and reduce economic barriers in achieving diploma, graduate, and post-graduate qualifications.",
        "benefits": "Full mandatory non-refundable fees reimbursement (including tuition and exam fee) plus monthly maintenance allowance up to ₹13,500 per year.",
        "eligibility_rules": "Students belonging to the Scheduled Caste (SC) community pursuing recognized post-matriculation courses, with total parental annual income not exceeding ₹2,50,000.",
        "age_min": 16,
        "age_max": 35,
        "income_limit": 250000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "SC",
        "state_requirement": "All",
        "student_requirement": True,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Valid Caste Certificate, Parental Income Certificate from Tahsildar/Revenue Authority, Fee Receipts, Previous Exam Marksheets, Aadhaar Linked Bank Passbook",
        "application_process": "Register on the National Scholarship Portal (NSP) or respective State Scholarship Portal with academic verification by institution.",
        "official_portal_url": "https://scholarships.gov.in",
        "deadline": "30 November 2026",
        "status": "Active"
    },
    {
        "name": "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
        "category": "Social Welfare",
        "description": "National social assistance pension scheme for elderly Indian citizens living below the poverty line to ensure life sustenance and financial dignity.",
        "objective": "Provide essential social security protection to elderly citizens without dependable family economic support or sustainable independent income.",
        "benefits": "Monthly central pension of ₹200 for ages 60-79 (and ₹500 for age 80+), supplemented by additional monthly state contributions up to ₹1,000 - ₹2,000.",
        "eligibility_rules": "Applicant must be 60 years of age or older and belong to a household living Below the Poverty Line (BPL) according to official criteria.",
        "age_min": 60,
        "age_max": 120,
        "income_limit": 150000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": False,
        "required_documents": "Proof of Age (Aadhaar Card, Birth Certificate, Voter Card), BPL Ration Card, Bank Account Details, Passport Sized Photograph",
        "application_process": "Submit application form at the local Gram Panchayat office in rural areas or Municipality / Social Welfare office in urban areas.",
        "official_portal_url": "https://nsap.nic.in",
        "deadline": "Ongoing",
        "status": "Active"
    },
    {
        "name": "Divyangjan Swavalamban Yojana",
        "category": "Social Welfare",
        "description": "Concessional credit scheme designed to promote self-employment, micro-enterprises, and skill development for Persons with Disabilities (PwDs).",
        "objective": "Empower disabled individuals financially by helping them establish commercially viable livelihood ventures with low-interest credit.",
        "benefits": "Concessional loans up to ₹5,00,000 at affordable interest rates (5% to 8% p.a.) with an interest rebate of up to 1% for prompt regular repayment.",
        "eligibility_rules": "Any Indian citizen with 40% or more certified disability, aged between 18 and 65 years, having a viable economic project plan.",
        "age_min": 18,
        "age_max": 65,
        "income_limit": 300000.0,
        "gender": "All",
        "occupation": "All",
        "category_requirement": "All",
        "state_requirement": "All",
        "student_requirement": False,
        "farmer_requirement": False,
        "disability_requirement": True,
        "required_documents": "Unique Disability ID (UDID) / Disability Certificate (min 40%), Age Proof, Project Quotation / Business Plan, Aadhaar Card, Bank Account Details",
        "application_process": "Submit proposal through State Channelising Agencies (SCAs), partner Public Sector Banks, or online via NHFDC official portal.",
        "official_portal_url": "https://www.nhfdc.nic.in",
        "deadline": "Ongoing",
        "status": "Active"
    }
]

def init_database_tables():
    """Execute schema.sql to ensure database and tables are created."""
    config = get_db_config()
    schema_path = Path(__file__).resolve().parent / 'schema.sql'
    if not schema_path.exists():
        print(f"Schema file not found at {schema_path}")
        return False
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    # Connect to MySQL server without database first to ensure DB exists
    conn = mysql.connector.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password']
    )
    cursor = conn.cursor()
    try:
        # Split statements by semicolon
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        for statement in statements:
            cursor.execute(statement)
        conn.commit()
        print("[Database] Schema initialized successfully.")
        return True
    finally:
        cursor.close()
        conn.close()

def seed_schemes():
    """Seed sample schemes if the table is empty."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS count FROM schemes")
        row = cursor.fetchone()
        if row and row['count'] > 0:
            print(f"[Seed] Schemes table already contains {row['count']} schemes. Skipping seed.")
            return

        insert_sql = """
            INSERT INTO schemes (
                name, category, description, objective, benefits, eligibility_rules,
                age_min, age_max, income_limit, gender, occupation,
                category_requirement, state_requirement, student_requirement,
                farmer_requirement, disability_requirement, required_documents,
                application_process, official_portal_url, deadline, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """

        for s in SAMPLE_SCHEMES:
            cursor.execute(insert_sql, (
                s["name"], s["category"], s["description"], s["objective"], s["benefits"], s["eligibility_rules"],
                s["age_min"], s["age_max"], s["income_limit"], s["gender"], s["occupation"],
                s["category_requirement"], s["state_requirement"], s["student_requirement"],
                s["farmer_requirement"], s["disability_requirement"], s["required_documents"],
                s["application_process"], s["official_portal_url"], s["deadline"], s["status"]
            ))
        conn.commit()
        print(f"[Seed] Successfully seeded {len(SAMPLE_SCHEMES)} realistic government welfare schemes.")

        # Seed sample demo users (one admin, one citizen)
        cursor.execute("SELECT COUNT(*) AS count FROM users WHERE email = %s", ("admin@civicportal.gov.in",))
        if cursor.fetchone()['count'] == 0:
            admin_hash = generate_password_hash("Admin@123")
            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ("Portal Administrator", "admin@civicportal.gov.in", admin_hash, "ADMIN")
            )

        cursor.execute("SELECT COUNT(*) AS count FROM users WHERE email = %s", ("citizen@example.com",))
        if cursor.fetchone()['count'] == 0:
            user_hash = generate_password_hash("Citizen@123")
            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ("Ramesh Sharma", "citizen@example.com", user_hash, "USER")
            )
            citizen_id = cursor.lastrowid
            cursor.execute(
                """INSERT INTO profiles (user_id, age, gender, state, annual_income, occupation, category, student_status, farmer_status, disability_status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (citizen_id, 34, "Male", "Maharashtra", 180000.0, "Farmer", "OBC", False, True, False)
            )
        conn.commit()
        print("[Seed] Successfully created demo admin and citizen records.")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Starting database schema initialization and seed process...")
    init_database_tables()
    seed_schemes()
    print("Seed complete.")
