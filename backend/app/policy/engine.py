from backend.app.policy.models import (
    SovereignAction,
    PolicyDecision,
    ApprovalRequest,
)


def evaluate_action(action: SovereignAction) -> PolicyDecision:
    """
    Evaluate a proposed Sovereign action.

    Gemini proposes the action.
    The policy engine makes the final decision.
    """

    if action.action.lower() == "pay":

        if action.amount is None:
            return PolicyDecision(
                decision="DENY",
                reason="Payment amount is missing.",
                risk_level="HIGH",
            )

        if action.amount <= 1000:
            return PolicyDecision(
                decision="ALLOW",
                reason="Payment is within the autonomous spending limit.",
                risk_level="LOW",
            )

        return PolicyDecision(
            decision="REQUIRE_APPROVAL",
            reason="Payment exceeds the autonomous spending limit of ₹1,000.",
            risk_level="MEDIUM",
        )

    return PolicyDecision(
        decision="DENY",
        reason="Action type is not permitted.",
        risk_level="HIGH",
    )


def create_approval_request(
    action: SovereignAction,
    decision: PolicyDecision,
) -> ApprovalRequest | None:
    """
    Create a human approval request when policy requires approval.
    """

    if decision.decision != "REQUIRE_APPROVAL":
        return None

    return ApprovalRequest(
        action=action,
        policy_decision=decision,
        status="PENDING",
    )


def resolve_approval(
    approval: ApprovalRequest,
    approved: bool,
) -> ApprovalRequest:
    """
    Resolve a pending human approval request.

    approved=True  -> APPROVED
    approved=False -> REJECTED
    """

    if approval.status != "PENDING":
        return approval

    if approved:
        approval.status = "APPROVED"
    else:
        approval.status = "REJECTED"

    return approval


if __name__ == "__main__":

    # Simulate a risky payment proposed by Gemini
    test_action = SovereignAction(
        action="pay",
        recipient="Anish",
        amount=5000,
        currency="INR",
        reason="design work",
    )

    # Step 1: Evaluate the action
    decision = evaluate_action(test_action)

    print("POLICY DECISION")
    print(decision)

    # Step 2: Create approval request if required
    approval_request = create_approval_request(
        action=test_action,
        decision=decision,
    )

    if approval_request:
        print("\nAPPROVAL REQUEST")
        print(approval_request)

        # Step 3: Simulate human approval
        resolved = resolve_approval(
            approval=approval_request,
            approved=True,
        )

        print("\nRESOLVED APPROVAL")
        print(resolved)