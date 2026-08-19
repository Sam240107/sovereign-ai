import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sqlite3

from backend.app.agent.gemini import parse_user_intent
from backend.app.policy.engine import evaluate_policy, create_approval_request, resolve_approval_request
from backend.app.agent.tools import execute_action_safely, ToolExecutionError
from backend.app.receipts.generator import generate_receipt
from backend.app.agent.auditor import perform_guardian_audit
from backend.app.db import init_db, save_receipt_to_db, DB_PATH
from backend.app.security.attack_lab import AttackSimulator
from backend.app.integrations.razorpay.webhook import verify_razorpay_webhook_signature, process_razorpay_event

app = FastAPI(
    title="Sovereign AI Control Plane",
    description="Policy-governed, human-authorized, multi-agent autonomous control plane with execution gateway, attack lab, and webhooks.",
    version="0.3.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# In-memory stores
APPROVAL_STORE: Dict[str, Any] = {}

class AgentRequest(BaseModel):
    message: str

class ApprovalResolutionRequest(BaseModel):
    approver_id: str
    approved: bool

@app.get("/")
def health_check():
    return {"status": "online", "system": "Sovereign AI Control Plane"}

@app.post("/v1/agent/plan")
def agent_plan(payload: AgentRequest):
    try:
        action = parse_user_intent(payload.message)
        policy_decision = evaluate_policy(action)
        
        approval_req = None
        execution_result = None
        execution_error = None

        if policy_decision.decision == "ALLOW":
            try:
                execution_result = execute_action_safely(action, policy_decision)
            except ToolExecutionError as e:
                execution_error = str(e)
                
        elif policy_decision.decision == "REQUIRE_APPROVAL":
            approval_req = create_approval_request(action, policy_decision)
            APPROVAL_STORE[approval_req.request_id] = approval_req
            
        receipt = generate_receipt(
            user_intent=payload.message,
            action=action,
            policy_decision=policy_decision,
            approval_request=approval_req,
            execution_result=execution_result,
            execution_error=execution_error
        )
        
        # Save receipt to SQLite database persistently
        save_receipt_to_db(receipt)

        return {
            "action": action,
            "policy": policy_decision,
            "approval_required": policy_decision.decision == "REQUIRE_APPROVAL",
            "approval_request_id": approval_req.request_id if approval_req else None,
            "execution": execution_result,
            "receipt_id": receipt["receipt_id"],
            "receipt_hash": receipt["receipt_hash"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/approval/{request_id}/resolve")
def resolve_approval(request_id: str, resolution: ApprovalResolutionRequest):
    if request_id not in APPROVAL_STORE:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    approval_req = APPROVAL_STORE[request_id]
    
    if approval_req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request already resolved: {approval_req.status}")

    try:
        resolved_req = resolve_approval_request(approval_req, resolution.approver_id, resolution.approved)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    APPROVAL_STORE[request_id] = resolved_req

    execution_result = None
    execution_error = None

    if resolution.approved:
        audit_report = perform_guardian_audit(f"Approve action for {resolved_req.action.action}", resolved_req.action)
        
        if not audit_report.is_safe:
            raise HTTPException(status_code=403, detail=f"Guardian Auditor blocked execution: {audit_report.reason}")

        try:
            execution_result = execute_action_safely(resolved_req.action, resolved_req.policy_decision, resolved_req)
        except ToolExecutionError as e:
            execution_error = str(e)

    receipt = generate_receipt(
        user_intent=f"Action resolution for {resolved_req.action.action}",
        action=resolved_req.action,
        policy_decision=resolved_req.policy_decision,
        approval_request=resolved_req,
        execution_result=execution_result,
        execution_error=execution_error
    )
    
    # Save resolution receipt to SQLite database persistently
    save_receipt_to_db(receipt)

    return {
        "status": resolved_req.status,
        "approver_id": resolved_req.approver_id,
        "resolved_at": resolved_req.resolved_at,
        "execution": execution_result,
        "receipt_id": receipt["receipt_id"],
        "receipt_hash": receipt["receipt_hash"]
    }

@app.get("/v1/audit/verify")
def verify_audit_ledger():
    from backend.app.receipts.generator import verify_ledger_integrity
    return verify_ledger_integrity()

@app.get("/v1/audit/ledger")
def get_all_audit_receipts():
    """
    Retrieves all past audit receipts stored in the persistent SQLite database.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_ledger ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.post("/v1/attack-lab/{attack_type}")
def run_attack_simulation(attack_type: str):
    """
    Executes predefined security breach simulations to prove Sovereign's action-binding 
    and policy firewall protection.
    """
    simulator = AttackSimulator()
    
    if attack_type == "amount-escalation":
        return simulator.simulate_amount_escalation()
    elif attack_type == "recipient-substitution":
        return simulator.simulate_recipient_substitution()
    elif attack_type == "velocity-structuring":
        return simulator.simulate_velocity_structuring()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown attack simulation type: {attack_type}")

@app.post("/v1/webhooks/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: Optional[str] = Header(None)):
    """
    Receives asynchronous payout lifecycle events from RazorpayX and reconciles them in the audit trail.
    """
    body_bytes = await request.body()
    
    if x_razorpay_signature:
        is_valid = verify_razorpay_webhook_signature(body_bytes, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid Razorpay Webhook Signature.")
            
    event_json = await request.json()
    reconciliation_result = process_razorpay_event(event_json)
    
    return {
        "status": "success",
        "message": "Webhook processed and reconciled into Sovereign audit ledger.",
        "details": reconciliation_result
    }