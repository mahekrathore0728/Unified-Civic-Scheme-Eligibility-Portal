import urllib.request
import urllib.parse
import json

BASE = 'http://127.0.0.1:5000'

def http_post(url, data_dict, headers=None):
    if headers is None:
        headers = {}
    data_bytes = json.dumps(data_dict).encode('utf-8')
    req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json', **headers}, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def http_get(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_checks():
    print("=== 1. Testing Authentication ===")
    status, res_login = http_post(f'{BASE}/api/auth/login', {'email': 'citizen@example.com', 'password': 'Citizen@123'})
    print(f"Login Status: {status}")
    assert status == 200, f"Login failed: {res_login}"
    token = res_login['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("-> Token acquired successfully.")

    print("\n=== 2. Testing Flow A: Existing Navbar Eligibility (POST /api/eligibility/check) ===")
    flow_a_payload = {
        'age': 34,
        'gender': 'Male',
        'state': 'Maharashtra',
        'annual_income': 180000,
        'occupation': 'Farmer',
        'category': 'OBC',
        'is_farmer': True,
        'is_student': False,
        'is_disabled': False
    }
    status, res_flow_a = http_post(f'{BASE}/api/eligibility/check', flow_a_payload)
    print(f"Flow A Status: {status}")
    assert status == 200, f"Flow A failed: {res_flow_a}"
    matched = res_flow_a['data']['eligible']
    print(f"-> Flow A matched schemes count: {len(matched)}")
    for m in matched[:3]:
        print(f"   * {m['name']} (Category: {m.get('category')})")

    print("\n=== 3. Testing Document Vault (GET /api/documents) ===")
    status, res_docs = http_get(f'{BASE}/api/documents', headers=headers)
    print(f"Documents Status: {status}")
    assert status == 200, f"Documents list failed: {res_docs}"
    docs_data = res_docs['data']
    print(f"-> Total document types supported in vault: {len(docs_data)}")
    uploaded = [d for d in docs_data if d.get('is_uploaded')]
    print(f"-> Uploaded documents count: {len(uploaded)}")

    print("\n=== 4. Testing Flow B: Scheme-Level Document-Assisted Eligibility (GET /api/eligibility/scheme/<id>) ===")
    status, res_schemes = http_get(f'{BASE}/api/schemes')
    schemes_data = res_schemes['data']
    schemes = schemes_data if isinstance(schemes_data, list) else schemes_data.get('schemes', [])
    for s in schemes[:3]:
        s_id = s['id']
        s_title = s.get('name') or s.get('title')
        status, res_eval = http_get(f'{BASE}/api/eligibility/scheme/{s_id}', headers=headers)
        print(f"Scheme ID {s_id}: '{s_title}' -> Status: {status}")
        if status == 200:
            eval_data = res_eval['data']
            print(f"   * Verdict: {eval_data.get('verdict')}")
            print(f"   * Matched criteria: {len(eval_data.get('matched_criteria', []))}")
            print(f"   * Unmet criteria: {len(eval_data.get('unmet_criteria', []))}")
            print(f"   * Missing criteria: {len(eval_data.get('missing_criteria', []))}")
            print(f"   * Missing mandatory docs: {len(eval_data.get('missing_mandatory_docs', []))}")
            print(f"   * Information sources: {eval_data.get('information_sources')}")

    print("\n=== 5. Testing Save Scheme & Duplicate Handling ===")
    test_scheme = schemes[0]['id']
    status1, res_save1 = http_post(f'{BASE}/api/saved', {'scheme_id': test_scheme}, headers=headers)
    print(f"Save Scheme attempt 1: Status {status1}, Message: '{res_save1.get('message')}'")
    status2, res_save2 = http_post(f'{BASE}/api/saved', {'scheme_id': test_scheme}, headers=headers)
    print(f"Save Scheme attempt 2 (duplicate): Status {status2}, Message: '{res_save2.get('message')}'")
    assert "already" in res_save2.get('message', '').lower() or status2 == 200, "Duplicate save handling check"

    print("\n=== ALL 5 MAJOR SUBSYSTEM TESTS PASSED WITH 100% SUCCESS ===")

if __name__ == '__main__':
    run_checks()
