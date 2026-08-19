import hmac
import hashlib
import os
from typing import Dict, Any

def verify_razorpay_webhook_signature(webhook_body: bytes, signature: str) -> bool:
    """
    Verifies the HMAC SHA-256 signature sent by Razorpay in the X-Razorpay-Signature header.
    """
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret")
    
    generated_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        webhook_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(generated_signature, signature)

def process_razorpay_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes incoming payout events from RazorpayX and maps them to Sovereign audit updates.
    """
    event_type = event_data.get("event", "unknown.event")
    payload = event_data.get("payload", {})
    payout_entity = payload.get("payout", {}).get("entity", {})
    
    payout_id = payout_entity.get("id", "unknown_pout")
    status = payout_entity.get("status", "unknown")
    reference_id = payout_entity.get("reference_id", "none")
    
    return {
        "event_received": event_type,
        "payout_id": payout_id,
        "idempotency_reference": reference_id,
        "reconciled_status": status.upper(),
        "logged_to_ledger": True
    }
