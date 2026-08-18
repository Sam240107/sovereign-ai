from pydantic import BaseModel


class SovereignAction(BaseModel):
    action: str
    recipient: str | None = None
    amount: float | None = None
    currency: str | None = None
    reason: str | None = None

class PolicyDecision(BaseModel):
    decision: str
    reason: str
    risk_level: str