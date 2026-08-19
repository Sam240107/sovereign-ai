from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from backend.app.policy.models import SovereignAction, PolicyDecision, ApprovalRequest
from backend.app.execution.gateway import ExecutionGateway
from backend.app.execution.models import ExecutionRequest
from backend.app.integrations.razorpay.client import RazorpayXProvider

class ToolExecutionError(Exception):
    """Raised when a tool execution is blocked or fails."""
    pass


def execute_payment_via_gateway(action: SovereignAction) -> Dict[str, Any]:
    """
    Routes the approved payment action through the Execution Gateway 
    into RazorpayX Test Mode with idempotency protection.
    """
    if action.amount is None or action.recipient is None:
        raise ToolExecutionError("Invalid action payload for payment: missing amount or recipient.")

    try:
        # Initialize Gateway with RazorpayX Provider
        provider = RazorpayXProvider()
        gateway = ExecutionGateway(provider)
        
        # Generate strict Idempotency Key bound to action properties
        idempotency_key = f"sov_{uuid.uuid5(uuid.NAMESPACE_DNS, str(action.amount) + action.recipient)}"

        exec_request = ExecutionRequest(
            action_type=action.action,
            recipient=action.recipient,
            amount=action.amount,
            currency=action.currency or "INR",
            reason=action.reason or "No reason provided",
            idempotency_key=idempotency_key
        )

        # Dispatch execution to RazorpayX test infrastructure
        result = gateway.dispatch(exec_request)
        
        return {
            "status": "SUCCESS" if result.status in ["processed", "queued", "created"] else result.status.upper(),
            "transaction_id": result.transaction_id,
            "gateway": f"{result.provider} ({result.environment})",
            "idempotency_key": idempotency_key,
            "message": f"Successfully processed payout of {exec_request.currency} {exec_request.amount} to {exec_request.recipient} via RazorpayX Test Mode.",
            "raw_response": result.raw_response
        }
    except Exception as e:
        raise ToolExecutionError(f"Execution Gateway failure: {str(e)}")


# Tool Registry mapping action strings to their gateway-connected executor functions
TOOL_REGISTRY = {
    "pay": execute_payment_via_gateway,
}


def execute_action_safely(
    action: SovereignAction, 
    policy_decision: PolicyDecision, 
    approval_request: Optional[ApprovalRequest] = None
) -> Dict[str, Any]:
    """
    The Sovereign Gatekeeper for Tool Execution.
    Enforces that a tool can ONLY run if:
     1. Policy Decision is ALLOW, OR
     2. Policy Decision is REQUIRE_APPROVAL AND ApprovalRequest status is APPROVED.
    Otherwise, execution is strictly blocked.
    """
    decision = policy_decision.decision

    if decision == "DENY":
        raise ToolExecutionError(f"Execution blocked: Policy decision was DENY. Reason: {policy_decision.reason}")

    if decision == "REQUIRE_APPROVAL":
        if not approval_request:
            raise ToolExecutionError("Execution blocked: Action requires human approval, but no approval request exists.")
        if approval_request.status != "APPROVED":
            raise ToolExecutionError(f"Execution blocked: Approval status is '{approval_request.status}' (Must be 'APPROVED').")

    # If decision is ALLOW or successfully APPROVED, lookup and execute the tool
    tool_func = TOOL_REGISTRY.get(action.action.lower())
    if not tool_func:
        raise ToolExecutionError(f"No registered tool found for action type: '{action.action}'")

    # Run the tool through the execution gateway
    result = tool_func(action)
    return result


# ==========================================
# TEST BLOCK FOR TOOL EXECUTION & GATEKEEPER
# ==========================================
if __name__ == "__main__":
    print("=== RUNNING SOVEREIGN EXECUTION GATEWAY TESTS ===\n")

    # Scenario 1: ALLOW Action (e.g., ₹500 payment via RazorpayX Test)
    print("Test 1: ALLOW Action (₹500)")
    action_small = SovereignAction(action="pay", recipient="Anish", amount=500.0, currency="INR", reason="lunch")
    policy_allow = PolicyDecision(decision="ALLOW", reason="Within autonomous limit", risk_level="LOW")
    
    try:
        res1 = execute_action_safely(action_small, policy_allow)
        print("✅ SUCCESS:", res1)
    except Exception as e:
        print("❌ FAILED:", e)

    print("-" * 50)

    # Scenario 2: REQUIRE_APPROVAL Action WITHOUT Approval - Should Block
    print("Test 2: REQUIRE_APPROVAL Action WITHOUT Approval (₹5000) - Should Block")
    action_large = SovereignAction(action="pay", recipient="Anish", amount=5000.0, currency="INR", reason="design work")
    policy_approval = PolicyDecision(decision="REQUIRE_APPROVAL", reason="Exceeds autonomous limit", risk_level="MEDIUM")
    
    try:
        execute_action_safely(action_large, policy_approval, approval_request=None)
        print("❌ FAILED: Security breach! Unapproved action executed.")
    except ToolExecutionError as e:
        print("✅ BLOCKED CORRECTLY:", e)

    print("-" * 50)

    # Scenario 3: REQUIRE_APPROVAL Action WITH APPROVED Status -> Hits RazorpayX Test Mode
    print("Test 3: REQUIRE_APPROVAL Action WITH APPROVED Status (₹5000)")
    approval_req = ApprovalRequest(
        action=action_large,
        policy_decision=policy_approval,
        status="APPROVED",
        approver_id="campus-admin-001",
        resolved_at=datetime.now(timezone.utc)
    )
    
    try:
        res3 = execute_action_safely(action_large, policy_approval, approval_request=approval_req)
        print("✅ SUCCESS:", res3)
    except Exception as e:
        print("❌ FAILED:", e)

    print("\n=== ALL TOOL GATEWAY TESTS COMPLETED ===")