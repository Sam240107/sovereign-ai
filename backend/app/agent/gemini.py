import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from backend.app.policy.models import SovereignAction

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

# Initialize the Gemini client
client = genai.Client(api_key=api_key)


def parse_user_intent(user_message: str) -> SovereignAction:
    """
    Takes a natural language prompt from the user and uses Gemini's 
    structured output (Pydantic integration) to extract a SovereignAction.
    """
    prompt = f"Extract the structured intent from this user request: '{user_message}'"

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",  # Active standard production model endpoint
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SovereignAction,
            temperature=0.0
        ),
    )

    # The response.parsed automatically instantiates the SovereignAction Pydantic model
    action_data: SovereignAction = response.parsed
    return action_data


# ==========================================
# TEST BLOCK
# ==========================================
if __name__ == "__main__":
    print("Testing Gemini Intent Parser...")
    sample_msg = "Pay ₹5000 to Anish for the design work."
    result = parse_user_intent(sample_msg)
    print("SOVEREIGN ACTION PARSED:")
    print(result)