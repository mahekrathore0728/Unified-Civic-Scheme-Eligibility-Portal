from database import execute_db, query_all

def run_migration():
    existing_cols = {c['Field'] for c in query_all('DESCRIBE user_documents')}
    new_cols = [
        ('detected_doc_type', 'VARCHAR(60) DEFAULT NULL'),
        ('detected_doc_label', 'VARCHAR(120) DEFAULT NULL'),
        ('classification_confidence', 'FLOAT DEFAULT 0.0'),
        ('classification_state', "VARCHAR(30) DEFAULT 'NEEDS_REVIEW'"),
        ('classification_reason', 'TEXT DEFAULT NULL'),
        ('ocr_quality', "VARCHAR(30) DEFAULT 'UNKNOWN'")
    ]
    for col, ctype in new_cols:
        if col not in existing_cols:
            execute_db(f'ALTER TABLE user_documents ADD COLUMN {col} {ctype}')
            print(f'Added column {col}')
        else:
            print(f'Column {col} already exists')

    print('Current columns in user_documents:', [c['Field'] for c in query_all('DESCRIBE user_documents')])

if __name__ == '__main__':
    run_migration()
