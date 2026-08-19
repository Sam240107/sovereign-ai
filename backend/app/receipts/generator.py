import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

# In-memory append-only ledger chain
AUDIT_LEDGER: List[Dict[str, Any]] = []

def generate_receipt(
    user_intent: str,
    action: Any,
    policy_decision: Any,
    approval_request: Optional[Any] = None,
    execution_result: Optional[Dict[str, Any]] = None,
    execution_error: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a hash-chained audit receipt linking to the previous entry.
    """
    global AUDIT_LEDGER

    # Determine previous hash (Genesis block uses 64 zeros if ledger is empty)
    prev_hash = "0" * 64
    if AUDIT_LEDGER:
        prev_hash = AUDIT_LEDGER[-1]["receipt_hash"]

    receipt_id = f"rcpt_{abs(hash(user_intent + str(datetime.now()))) % 10**18}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Base payload for canonical tracking
    payload = {
        "receipt_id": receipt_id,
        "timestamp": timestamp,
        "user_intent": user_intent,
        "action": action.model_dump() if hasattr(action, "model_dump") else dict(action),
        "policy_decision": policy_decision.model_dump() if hasattr(policy_decision, "model_dump") else dict(policy_decision),
        "approval_status": approval_request.status if approval_request else "N/A",
        "approver_id": getattr(approval_request, "approver_id", None),
        "execution_result": execution_result,
        "execution_error": execution_error,
        "prev_hash": prev_hash
    }

    # Deterministic JSON stringify for stable hashing
    canonical_data = json.dumps(payload, sort_keys=True, default=str)
    
    # Compute SHA-256 chain hash incorporating the previous hash
    chain_input = prev_hash + canonical_data
    receipt_hash = hashlib.sha256(chain_input.encode("utf-8")).hexdigest()

    receipt_record = {
        **payload,
        "receipt_hash": receipt_hash
    }

    # Append securely to the ledger
    AUDIT_LEDGER.append(receipt_record)
    return receipt_record


def verify_ledger_integrity() -> Dict[str, Any]:
    """
    Walks the entire ledger to verify that the cryptographic hash chain is intact.
    """
    global AUDIT_LEDGER
    for i, entry in enumerate(AUDIT_LEDGER):
        expected_prev = "0" * 64 if i == 0 else AUDIT_LEDGER[i - 1]["receipt_hash"]
        if entry["prev_hash"] != expected_prev:
            return {"valid": False, "broken_at_index": i, "reason": "Previous hash linkage mismatch"}
        
        # Re-verify entry hash
        copy_entry = entry.copy()
        actual_hash = copy_entry.pop("receipt_hash")
        prev_h = copy_entry["prev_hash"]
        canonical = json.dumps(copy_entry, sort_keys=True, default=str)
        recomputed = hashlib.sha256((prev_h + canonical).encode("utf-8")).hexdigest()
        
        if actual_hash != recomputed:
            return {"valid": False, "broken_at_index": i, "reason": "Payload hash mismatch / tampering detected"}

    return {"valid": True, "total_records": len(AUDIT_LEDGER)}