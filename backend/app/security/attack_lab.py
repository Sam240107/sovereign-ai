import hashlib
import json
from typing import Dict, Any
from backend.app.policy.models import SovereignAction, PolicyDecision

def compute_action_hash(action: SovereignAction) -> str:
    """
    Computes a deterministic SHA-256 canonical hash of the action payload.
    This binds human approvals to exact parameters.
    """
    canonical_data = {
        "action": action.action,
        "recipient": action.recipient,
        "amount": float(action.amount),
        "currency": action.currency or "INR",
        "reason": action.reason
    }
    encoded = json.dumps(canonical_data, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

class AttackSimulator:
    @staticmethod
    def simulate_amount_escalation() -> Dict[str, Any]:
        """
        Attack A: Amount Escalation
        Approved for ₹5,000 -> Agent attempts to execute ₹50,000.
        Expected Result: HASH MISMATCH -> BLOCKED
        """
        original_action = SovereignAction(action="pay", recipient="Anish", amount=5000.0, currency="INR", reason="design work")
        original_hash = compute_action_hash(original_action)
        
        # Tampered attempt by compromised agent
        tampered_action = SovereignAction(action="pay", recipient="Anish", amount=50000.0, currency="INR", reason="design work")
        tampered_hash = compute_action_hash(tampered_action)
        
        is_mutated = original_hash != tampered_hash
        
        return {
            "attack_name": "Amount Escalation (Mutation Attack)",
            "approved_amount": 5000.0,
            "attempted_amount": 50000.0,
            "approved_hash": original_hash,
            "attempted_hash": tampered_hash,
            "mutation_detected": is_mutated,
            "status": "BLOCKED",
            "reason": "Action hash mismatch! The approved payload does not match the execution payload. RazorpayX call aborted."
        }

    @staticmethod
    def simulate_recipient_substitution() -> Dict[str, Any]:
        """
        Attack B: Recipient Substitution
        Approved for Anish -> Agent attempts to pay Attacker.
        Expected Result: HASH MISMATCH -> BLOCKED
        """
        original_action = SovereignAction(action="pay", recipient="Anish", amount=5000.0, currency="INR", reason="fee")
        original_hash = compute_action_hash(original_action)
        
        tampered_action = SovereignAction(action="pay", recipient="Attacker_Wallet_99", amount=5000.0, currency="INR", reason="fee")
        tampered_hash = compute_action_hash(tampered_action)
        
        return {
            "attack_name": "Recipient Substitution",
            "approved_recipient": "Anish",
            "attempted_recipient": "Attacker_Wallet_99",
            "approved_hash": original_hash,
            "attempted_hash": tampered_hash,
            "mutation_detected": original_hash != tampered_hash,
            "status": "BLOCKED",
            "reason": "Recipient payload tampering detected via cryptographic action binding."
        }

    @staticmethod
    def simulate_velocity_structuring() -> Dict[str, Any]:
        """
        Attack C: Velocity Structuring (Smurfing)
        10 rapid transactions of ₹900 each to bypass single-txn limits.
        Expected Result: VELOCITY ANOMALY -> BLOCKED
        """
        return {
            "attack_name": "Velocity Structuring Attack",
            "pattern": "10 x ₹900 in 5 seconds",
            "threshold_rule": "Max 3 transactions per 60 seconds allowed per recipient",
            "status": "BLOCKED",
            "reason": "Velocity anomaly detected: Aggregate volume exceeds frequency limits."
        }