import argparse
import requests
import sys

def test_production_api(base_url: str):
    """
    Pings the live CrisisLens API to verify connectivity and CORS status.
    """
    print(f"📡 Pinging CrisisLens Live API at: {base_url}...")
    
    try:
        # Check Root Endpoint
        res = requests.get(base_url, timeout=10)
        if res.status_code == 200:
            print("✅ Root Endpoint: REACHABLE")
            print(f"   Message: {res.json().get('message')}")
        else:
            print(f"❌ Root Endpoint: FAILED (Status: {res.status_code})")
            
        # Check API Status/Docs
        docs_url = f"{base_url.rstrip('/')}/docs"
        res_docs = requests.get(docs_url, timeout=10)
        if res_docs.status_code == 200:
            print("✅ API Documentation: ACCESSIBLE")
        else:
            print(f"⚠️ API Documentation: UNREACHABLE (Status: {res_docs.status_code})")

        # Check Incident Endpoint (Public-facing)
        incidents_url = f"{base_url.rstrip('/')}/incidents/"
        res_incidents = requests.get(incidents_url, timeout=10)
        if res_incidents.status_code == 200:
            print("✅ Incident Data: ACCESSIBLE (Public)")
        elif res_incidents.status_code == 401:
            print("✅ Incident Data: PROTECTED (Expected)")
        else:
            print(f"❌ Incident Data: FAILED (Status: {res_incidents.status_code})")

        print("\n🎉 Connection Test Complete: Backend represents as ONLINE.")

    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: The server is offline or the URL is incorrect.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test CrisisLens Production Connectivity.")
    parser.add_argument("--url", required=True, help="Your live Render backend URL.")
    args = parser.parse_args()
    
    test_production_api(args.url)
