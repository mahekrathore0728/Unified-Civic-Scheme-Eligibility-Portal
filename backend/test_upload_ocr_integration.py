import urllib.request
import urllib.parse
import json
import io

BASE = 'http://127.0.0.1:5000'

def test_document_upload_and_ocr():
    # 1. Login
    req = urllib.request.Request(f'{BASE}/api/auth/login', 
                                 data=json.dumps({'email': 'citizen@example.com', 'password': 'Citizen@123'}).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read().decode('utf-8'))['data']['token']
    
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Upload Aadhaar Card (multipart form data)
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []
    
    # doc_type field
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="doc_type"\r\n')
    body.append(b'aadhaar\r\n')

    # file field (real Aadhaar PDF using fitz)
    import fitz
    pdf_doc = fitz.open()
    pdf_page = pdf_doc.new_page()
    pdf_page.insert_text((50, 72), "GOVERNMENT OF INDIA\nUnique Identification Authority of India\nAADHAAR\nName: Ramesh Sharma\nDOB: 12/04/1990\nGender: Male\nAddress: Pune, Maharashtra\n2345 6789 0123")
    aadhaar_content = pdf_doc.tobytes()
    pdf_doc.close()

    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(b'Content-Disposition: form-data; name="file"; filename="aadhaar_card.pdf"\r\nContent-Type: application/pdf\r\n')
    body.append(aadhaar_content + b'\r\n')
    body.append(f'--{boundary}--\r\n'.encode('utf-8'))

    payload = b'\r\n'.join(body)

    upload_req = urllib.request.Request(
        f'{BASE}/api/documents/upload',
        data=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': f'multipart/form-data; boundary={boundary}'
        },
        method='POST'
    )
    with urllib.request.urlopen(upload_req) as resp:
        upload_res = json.loads(resp.read().decode('utf-8'))
        print("Upload Result:", upload_res.get('success'), upload_res.get('message'))
        print("Extracted Data:", upload_res.get('data', {}).get('extracted_data'))

    # 3. View Document Auth Endpoint check
    doc_id = upload_res['data']['doc_id']
    view_req = urllib.request.Request(f'{BASE}/api/documents/{doc_id}/view', headers=headers, method='GET')
    with urllib.request.urlopen(view_req) as v_resp:
        print("View Document Status:", v_resp.status, "Content-Type:", v_resp.headers.get('Content-Type'))

    # 4. Check Scheme Eligibility again to verify document is recognized in vault
    eval_req = urllib.request.Request(f'{BASE}/api/eligibility/scheme/1', headers=headers, method='GET')
    with urllib.request.urlopen(eval_req) as ev_resp:
        eval_data = json.loads(ev_resp.read().decode('utf-8'))['data']
        print("Updated Information Sources:", eval_data.get('information_sources'))
        print("Checklist Aadhaar status:", [c for c in eval_data.get('doc_checklist', []) if c['doc_type'] == 'aadhaar'])

if __name__ == '__main__':
    test_document_upload_and_ocr()
