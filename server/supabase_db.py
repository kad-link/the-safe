import os
import time
from typing import Optional, Dict, List, Any

# In-memory storage fallback when Supabase credentials are not configured yet
_local_citizens: Dict[str, dict] = {}
_local_documents: Dict[str, List[dict]] = {}

_supabase_client = None

def get_supabase_config() -> dict:
    """
    Reads Supabase connection parameters from environment or .env
    Supports both backend (SUPABASE_URL) and frontend (VITE_SUPABASE_URL) naming conventions.
    """
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)
    except Exception:
        pass

    url = (
        os.getenv("SUPABASE_URL") or 
        os.getenv("VITE_SUPABASE_URL") or 
        ""
    ).strip()
    
    # Priority: Service Role Key > JWT Anon Key (starts with ey) > Publishable / Standard Key
    candidates = [
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip(),
        os.getenv("VITE_SUPABASE_ANON_KEY", "").strip(),
        os.getenv("SUPABASE_KEY", "").strip()
    ]
    # Prefer JWT key (starts with 'ey') for PostgREST authorization
    jwt_keys = [k for k in candidates if k.startswith("ey")]
    key = jwt_keys[0] if jwt_keys else next((k for k in candidates if k), "")

    is_configured = bool(url and key and not url.startswith("your-") and not key.startswith("your-"))
    
    return {
        "url": url,
        "key": key,
        "is_configured": is_configured
    }

def get_client():
    """
    Returns an active Supabase client instance, or None if not configured.
    """
    global _supabase_client
    config = get_supabase_config()
    if not config["is_configured"]:
        return None

    if _supabase_client is not None:
        return _supabase_client

    try:
        from supabase import create_client
        _supabase_client = create_client(config["url"], config["key"])
        print(f"[SUPABASE] ✅ Connected to Supabase Project: {config['url']}", flush=True)
        return _supabase_client
    except Exception as err:
        print(f"[SUPABASE ERROR] Failed to initialize Supabase client: {err}", flush=True)
        return None

def get_status() -> dict:
    """
    Returns live connectivity status of Supabase.
    """
    config = get_supabase_config()
    client = get_client()
    
    table_status = "untested"
    error_detail = None
    action_needed = None

    if client:
        try:
            # Test query against citizens table
            resp = client.table("citizens").select("id").limit(1).execute()
            table_status = "connected"
        except Exception as e:
            err_str = str(e)
            if "PGRST205" in err_str or "Could not find the table" in err_str:
                table_status = "tables_missing"
                action_needed = "Tables have not been created in Supabase yet. Run 'supabase_schema.sql' in your Supabase SQL Editor."
            else:
                table_status = "query_error"
                action_needed = "Check table permissions or RLS policies."
            error_detail = err_str

    project_ref = ""
    if "https://" in config["url"] and ".supabase.co" in config["url"]:
        project_ref = config["url"].split("//")[1].split(".")[0]

    return {
        "configured": config["is_configured"],
        "url": config["url"],
        "project_ref": project_ref,
        "has_key": bool(config["key"]),
        "client_active": bool(client),
        "database_status": table_status,
        "action_needed": action_needed,
        "sql_editor_url": f"https://supabase.com/dashboard/project/{project_ref}/sql/new" if project_ref else "https://supabase.com/dashboard",
        "error": error_detail,
        "schema_script": "supabase_schema.sql"
    }

def upsert_citizen(email: str, name: str) -> dict:
    """
    Upserts citizen in Supabase 'citizens' table (or local storage fallback).
    """
    clean_email = email.strip().lower()
    clean_name = name.strip().upper()
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    client = get_client()
    if client:
        try:
            payload = {
                "email": clean_email,
                "name": clean_name,
                "last_login_at": now_iso,
                "updated_at": now_iso
            }
            # Upsert into Supabase citizens table
            resp = client.table("citizens").upsert(payload, on_conflict="email").execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as err:
            print(f"[SUPABASE ERROR] upsert_citizen failed: {err}", flush=True)

    # Local fallback
    record = {
        "email": clean_email,
        "name": clean_name,
        "auth_method": "resend_email_otp",
        "last_login_at": now_iso
    }
    _local_citizens[clean_email] = record
    return record

def get_citizen(email: str) -> Optional[dict]:
    """
    Retrieves citizen record by email.
    """
    clean_email = email.strip().lower()
    client = get_client()
    if client:
        try:
            resp = client.table("citizens").select("*").eq("email", clean_email).limit(1).execute()
            if resp.data and len(resp.data) > 0:
                return resp.data[0]
        except Exception as err:
            print(f"[SUPABASE ERROR] get_citizen failed: {err}", flush=True)

    return _local_citizens.get(clean_email)

def get_documents(email: str) -> List[dict]:
    """
    Fetches all documents associated with a citizen.
    """
    clean_email = email.strip().lower()
    client = get_client()
    if client:
        try:
            resp = client.table("documents").select("*").eq("citizen_email", clean_email).order("created_at", desc=True).execute()
            if resp.data is not None:
                # Map snake_case DB columns to frontend camelCase
                formatted = []
                for row in resp.data:
                    formatted.append({
                        "id": row.get("id"),
                        "title": row.get("title"),
                        "shortCode": row.get("short_code"),
                        "issuer": row.get("issuer"),
                        "docType": row.get("doc_type"),
                        "maskedNumber": row.get("masked_number"),
                        "unmaskedNumber": row.get("unmasked_number"),
                        "holder": row.get("holder"),
                        "status": row.get("status"),
                        "colorTheme": row.get("color_theme", "cyan"),
                        "desc": row.get("description"),
                        "dob": row.get("dob"),
                        "gender": row.get("gender"),
                        "address": row.get("address"),
                        "isSynced": row.get("is_synced", False),
                        "createdAt": row.get("created_at")
                    })
                return formatted
        except Exception as err:
            print(f"[SUPABASE ERROR] get_documents failed: {err}", flush=True)

    return _local_documents.get(clean_email, [])

def add_document(email: str, doc: dict) -> dict:
    """
    Inserts a citizen document into Supabase (or local fallback).
    """
    clean_email = email.strip().lower()
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    doc_id = doc.get("id") or f"DOC-{int(time.time() * 1000)}"

    db_payload = {
        "id": doc_id,
        "citizen_email": clean_email,
        "title": doc.get("title", "UNTITLED CITIZEN RECORD"),
        "short_code": doc.get("shortCode") or doc.get("short_code") or "DOC",
        "issuer": doc.get("issuer", "Government of India"),
        "doc_type": doc.get("docType") or doc.get("doc_type") or "Citizen Upload",
        "masked_number": doc.get("maskedNumber") or doc.get("masked_number") or "XXXX-XXXX",
        "unmasked_number": doc.get("unmaskedNumber") or doc.get("unmasked_number") or "XXXX-XXXX",
        "holder": doc.get("holder", "Citizen"),
        "status": doc.get("status", "AUTHENTICATED"),
        "color_theme": doc.get("colorTheme") or doc.get("color_theme") or "cyan",
        "description": doc.get("desc") or doc.get("description") or "",
        "dob": doc.get("dob"),
        "gender": doc.get("gender"),
        "address": doc.get("address"),
        "is_synced": doc.get("isSynced", False),
        "created_at": now_iso,
        "updated_at": now_iso
    }

    client = get_client()
    if client:
        try:
            # Ensure citizen exists first
            upsert_citizen(clean_email, doc.get("holder", "Citizen"))
            resp = client.table("documents").upsert(db_payload).execute()
            if resp.data and len(resp.data) > 0:
                print(f"[SUPABASE SUCCESS] Document '{db_payload['title']}' saved for {clean_email}", flush=True)
        except Exception as err:
            print(f"[SUPABASE ERROR] add_document failed: {err}", flush=True)

    # Keep in local fallback cache as well
    if clean_email not in _local_documents:
        _local_documents[clean_email] = []
    
    formatted_doc = {
        "id": db_payload["id"],
        "title": db_payload["title"],
        "shortCode": db_payload["short_code"],
        "issuer": db_payload["issuer"],
        "docType": db_payload["doc_type"],
        "maskedNumber": db_payload["masked_number"],
        "unmaskedNumber": db_payload["unmasked_number"],
        "holder": db_payload["holder"],
        "status": db_payload["status"],
        "colorTheme": db_payload["color_theme"],
        "desc": db_payload["description"],
        "dob": db_payload["dob"],
        "gender": db_payload["gender"],
        "address": db_payload["address"],
        "isSynced": db_payload["is_synced"],
        "createdAt": db_payload["created_at"]
    }
    _local_documents[clean_email] = [formatted_doc] + [d for d in _local_documents[clean_email] if d["id"] != doc_id]
    return formatted_doc

def sync_default_documents(email: str, citizen_name: str = "") -> List[dict]:
    """
    Returns genuine citizen documents from Supabase. No hardcoded records are generated.
    """
    clean_email = email.strip().lower()
    return get_documents(clean_email)

def delete_document(email: str, doc_id: str) -> bool:
    """
    Deletes a document by ID.
    """
    clean_email = email.strip().lower()
    client = get_client()
    if client:
        try:
            client.table("documents").delete().eq("citizen_email", clean_email).eq("id", doc_id).execute()
        except Exception as err:
            print(f"[SUPABASE ERROR] delete_document failed: {err}", flush=True)

    if clean_email in _local_documents:
        _local_documents[clean_email] = [d for d in _local_documents[clean_email] if d["id"] != doc_id]

    return True
