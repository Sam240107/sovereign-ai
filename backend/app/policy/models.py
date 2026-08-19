from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


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


class ApprovalRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid4()))
    action: SovereignAction
    policy_decision: PolicyDecision
    status: str = "PENDING"

    approver_id: str | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    resolved_at: datetime | None = None