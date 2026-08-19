from datetime import datetime, timezone
from backend.app.policy.models import SovereignAction, PolicyDecision, ApprovalRequest


def evaluate_policy(action: SovereignAction) -> PolicyDecision:
    """
    Deterministic policy engine for Sovereign AI.
    Rules:
      - Unknown action -> DENY
      - Missing amount on payment -> DENY
      - Amount <= 1000 -> ALLOW (LOW risk)
      - Amount > 1000 -> REQUIRE_APPROVAL (MEDIUM risk)
    """
    action_type = action.action.lower()

    if action_type != "pay":
        return PolicyDecision(
            decision="DENY",
            reason=f"Action '{action_type}' is not supported or is prohibited by policy.",
            risk_level="HIGH"
        )

    if action.amount is None:
        return PolicyDecision(
            decision="DENY",
            reason="Payment action is missing a valid amount.",
            risk_level="HIGH"
        )

    # Spending Limit Rule
    if action.amount <= 1000.0:
        return PolicyDecision(
            decision="ALLOW",
            reason=f"Payment of ₹{action.amount} is within the autonomous spending limit of ₹1,000.",
            risk_level="LOW"
        )
    else:
        return PolicyDecision(
            decision="REQUIRE_APPROVAL",
            reason=f"Payment of ₹{action.amount} exceeds the autonomous spending limit of ₹1,000.",
            risk_level="MEDIUM"
        )


def create_approval_request(action: SovereignAction, policy_decision: PolicyDecision) -> ApprovalRequest:
    """
    Creates a new pending ApprovalRequest when policy demands human review.
    """
    return ApprovalRequest(
        action=action,
        policy_decision=policy_decision,
        status="PENDING"
    )


def resolve_approval_request(
    approval_request: ApprovalRequest, 
    approver_id: str, 
    approved: bool,
    authorized_approvers: set = {"campus-admin-001", "finance-lead-001", "security-admin-root"}
) -> ApprovalRequest:
    """
    Resolves a pending approval request with strict approver authorization checks.
    Raises ValueError if the approver_id is not in the authorized list.
    """
    if approver_id not in authorized_approvers:
        raise ValueError(f"Security Alert: Unauthorized approver ID '{approver_id}' attempted to sign off on action.")

    approval_request.approver_id = approver_id
    approval_request.status = "APPROVED" if approved else "REJECTED"
    approval_request.resolved_at = datetime.now(timezone.utc)
    
    return approval_request


# ==========================================
# TEST BLOCK
# ==========================================
if __name__ == "__main__":
    print("Testing Policy Engine...")
    test_action = SovereignAction(action="pay", recipient="Anish", amount=5000.0, currency="INR", reason="design work")
    decision = evaluate_policy(test_action)
    print("POLICY DECISION:", decision)