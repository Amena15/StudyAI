import os
from google import genai
from dotenv import load_dotenv

# Load .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print(f"🔑 Testing API Key: {api_key[:8]}...{api_key[-4:]}")

try:
    print("⏳ Connecting to Google AI...")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Say exactly: Hello, the API key works!"
    )

    print("✅ SUCCESS! Your API key is valid.")
    print(f"🤖 AI Response: {response.text}")

except Exception as e:
    print("❌ FAILED!")
    print(f"🚨 Error details: {e}")