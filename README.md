
<div align="center">

# 🛡️ SOVEREIGN AI CONTROL PLANE
### Policy-Governed, Human-Authorized, Multi-Agent Autonomous Financial Control Layer

[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge&logo=shield)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%E2%85%A2-indigo?style=for-the-badge&logo=fastapi)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TailwindCSS-blue?style=for-the-badge&logo=tailwindcss)]()
[![Gateway](https://img.shields.io/badge/Execution-RazorpayX%20Sandbox-blueviolet?style=for-the-badge&logo=razorpay)]()

*The security, compliance, and execution firewall designed to keep autonomous AI agents safe, compliant, and legally bound.*

</div>

---

## 🚀 Overview

As autonomous AI agents gain the ability to execute financial transactions, companies face unprecedented risks: unauthorized amount escalations, malicious recipient substitutions, and uncontrolled velocity structuring. 

**Sovereign** solves this by inserting a deterministic, cryptographic control plane *between* LLMs (Google Gemini) and financial infrastructure (RazorpayX). Nothing executes without passing through intent parsing, strict spending limits, human authorization gates, and tamper-evident audit hashing.

---

## ✨ Key Features

* 🧠 **Natural Language Intent Parsing**: Powered by Google Gemini to convert unstructured user commands into structured, validated transactional actions.
* 🛡️ **Deterministic Policy Firewall**: Evaluates actions in real-time, automatically triggering `ALLOW` for safe limits or `REQUIRE_APPROVAL` for high-risk operations.
* 👤 **Human-in-the-Loop Gating**: Multi-role authorization console pausing high-value payouts until signed off by an administrator.
* 🕵️ **Guardian Auditor**: Pre-execution security agent verifying that payloads have not been mutated during human review.
* ⚡ **RazorpayX Test Gateway Integration**: Secure server-to-server execution layer converting currency to paise with idempotency keys and asynchronous webhook reconciliation (`payout.processed`, `payout.failed`).
* 🔒 **Tamper-Evident SQLite Audit Ledger**: Cryptographically hashed immutable receipts ensuring complete traceability and ledger integrity verification.
* 🛡️ **Attack Lab Simulation**: Interactive security breach testing suite demonstrating real-time defense against amount escalation, recipient substitution, and velocity attacks.
* 💎 **Cyber-Fintech Glassmorphism UI**: High-end React dashboard featuring an interactive AI companion (*Sovereign Sentinel*), live governance timeline, and structured audit tables.

---

## 🏗️ Architecture Flow
```text
[ User Prompt ] 
       │
       ▼
[ Gemini Intent Parser ] ──> [ Policy Engine (ALLOW / REQUIRE_APPROVAL) ]
                                            │
                        ┌───────────────────┴───────────────────┐
                        ▼ (If ALLOW)                            ▼ (If REQUIRE_APPROVAL)
             [ Guardian Auditor ]                      [ Human Authorization Sign-Off ]
                        │                                       │
                        └───────────────────┬───────────────────┘
                                            ▼
                             [ RazorpayX Test Sandbox Payout ]
                                            │
                                            ▼
                             [ Cryptographic Audit Ledger ]
```

---
## 🛠️ Tech Stack
Backend: Python, FastAPI, Pydantic, SQLite, Google GenAI SDK, Razorpay Python SDK, Uvicorn.

Frontend: React, Vite, Tailwind CSS, Lucide Icons, Glassmorphism UI.

Security & Cryptography: HMAC SHA-256 Webhook Verification, SHA-256 Receipt Hashing, Idempotency Enforcers.

---
## ⚙️ Quick Start & Installation
1. Clone the Repository
Bash
git clone [https://github.com/your-username/sovereign-ai.git](https://github.com/your-username/sovereign-ai.git)
cd sovereign-ai
2. Backend Setup
Bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
Create a .env file inside the root directory (sovereign-ai/.env):

Code snippet
GEMINI_API_KEY=your_google_gemini_api_key_here
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpay_x_account_number
RAZORPAY_WEBHOOK_SECRET=mock_webhook_secret
Start the FastAPI backend server:

Bash
uvicorn backend.app.main:app --reload --port 8000
3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and run:

Bash
cd frontend
npm install
npm run dev
Open your browser and navigate to http://localhost:5173.

---
## 🎬 Live Demo Walkthrough
The Happy Path (Autonomous Allow):

Go to the Agent Console.

Type: Pay ₹500 to Roger for lunch.

Watch the policy engine evaluate it as ALLOW and instantly generate a live RazorpayX test payout ID (pout_...).

The High-Value Gating Flow:

Type: Pay ₹5000 to Roger for design work.

Watch it trigger REQUIRE_APPROVAL. Enter your approver ID and click Approve & Execute.

The Security Proof (Attack Lab):

Switch to the Attack Lab tab.

Click Amount Escalation or Recipient Substitution to see Sovereign instantly intercept and block malicious payload alterations.

The Cryptographic Ledger:

Switch to the Audit Ledger tab to review immutable receipt hashes stored securely in SQLite.

---
## 📄 License
Distributed under the MIT License. See LICENSE for more information.
