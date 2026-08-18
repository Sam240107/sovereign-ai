from backend.app.policy.models import SovereignAction, PolicyDecision


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


if __name__ == "__main__":
    test_action = SovereignAction(
        action="pay",
        recipient="Anish",
        amount=5000,
        currency="INR",
        reason="design work",
    )

    result = evaluate_action(test_action)

    print("POLICY DECISION")
    print(result)