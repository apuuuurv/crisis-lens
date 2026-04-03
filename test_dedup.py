import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000"

def make_request(method, path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
        
    data_bytes = None
    if data:
        data_bytes = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
        return None
        
def make_login_request(path, data):
    # Form data encoding
    import urllib.parse
    url = f"{BASE_URL}{path}"
    data_encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=data_encoded, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        print(f"Login failed: {e.code} - {e.read().decode('utf-8')}")
        return None

def test_deduplication():
    print("Registering a user...")
    register_data = {
        "name": "Test Dedup",
        "email": "dedup_test@example.com",
        "password": "password123",
        "role": "citizen"
    }
    
    make_request("POST", "/auth/register", register_data)
    
    login_data = {
        "username": "dedup_test@example.com",
        "password": "password123"
    }
    print("Logging in...")
    login_res = make_login_request("/auth/login", login_data)
    if not login_res:
        return
        
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Creating incident 1...")
    payload = {
        "title": "First Fire",
        "description": "Just started",
        "category": "Fire",
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    
    inc1_res = make_request("POST", "/incidents/", payload, headers)
    print(inc1_res)
    
    if not inc1_res:
        print("Failed to create incident 1")
        return
        
    print("Creating incident 2 (same category, exact location)...")
    payload2 = {
        "title": "Second Fire Report",
        "description": "It's big now",
        "category": "Fire",
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    inc2_res = make_request("POST", "/incidents/", payload2, headers)
    print(inc2_res)
    
    if not inc2_res:
        print("Failed to create incident 2")
        return

    print("Verifying if they deduplicated...")
    print(f"Incident 1 ID: {inc1_res['id']}, Report Count: {inc1_res.get('report_count')}")
    print(f"Incident 2 ID: {inc2_res['id']}, Report Count: {inc2_res.get('report_count')}")
    
    if inc1_res['id'] == inc2_res['id'] and inc2_res.get('report_count', 0) > inc1_res.get('report_count', 0):
        print("Success! Deduplication worked.")
    else:
        print("Failure! Deduplication did not behave as expected.")

if __name__ == "__main__":
    test_deduplication()
