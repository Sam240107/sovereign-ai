from pydantic import BaseModel
from typing import Optional, Dict, Any

class ExecutionRequest(BaseModel):
    action_type: str
    recipient: str
    amount: float
    currency: str = "INR"
    reason: str
    idempotency_key: str

class ExecutionResponse(BaseModel):
    provider: str
    environment: str
    transaction_id: str
    status: str
    raw_response: Dict[str, Any]