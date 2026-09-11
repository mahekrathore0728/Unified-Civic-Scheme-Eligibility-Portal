import os
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load environment variables from .env in the backend folder
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

def get_db_config():
    """Retrieve MySQL configuration parameters from environment."""
    return {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', 3306)),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'gov_scheme_tracker')
    }

def get_db_connection():
    """Establish and return a connection to MySQL database."""
    config = get_db_config()
    try:
        conn = mysql.connector.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database']
        )
        return conn
    except Error as e:
        # Structured error logging without leaking raw passwords
        print(f"[Database Error] Could not connect to MySQL: {e.msg} (Error Code: {e.errno})")
        raise e

def query_all(sql, params=None):
    """Execute a parameterized SELECT query and return all rows as list of dicts."""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        rows = cursor.fetchall()
        return rows
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def query_one(sql, params=None):
    """Execute a parameterized SELECT query and return a single row as a dict."""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params or ())
        row = cursor.fetchone()
        return row
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def execute_db(sql, params=None):
    """Execute an INSERT, UPDATE, or DELETE parameterized query and return lastrowid."""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params or ())
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
