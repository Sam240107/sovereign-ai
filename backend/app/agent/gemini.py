
from dotenv import load_dotenv
from google import genai
import os
from backend.app.policy.models import SovereignAction
from backend.app.policy.engine import evaluate_action

# Load environment variables
load_dotenv()


# Get Gemini API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")


# Gemini client
client = genai.Client(api_key=api_key)


# User request
user_request = "Pay ₹5000 to Anish for the design work."


# Ask Gemini to convert natural language into a structured action
response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=f"""
You are the intent parser for Sovereign, a safety-first AI agent.

Convert the user's request into a structured action.

User request:
{user_request}

Rules:
- Identify the intended action.
- Extract recipient, amount, currency and reason when present.
- Never invent information.
- Return only the structured action.
""",
    config={
        "response_mime_type": "application/json",
        "response_schema": SovereignAction,
    },
)


# Parse Gemini's structured response
action = response.parsed

print("SOVEREIGN ACTION")
print(action)
decision = evaluate_action(action)

print("POLICY DECISION")
print(decision)