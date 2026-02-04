import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("🚀 AI CV Scorer is starting...")
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or "sk-..." in api_key:
        print("⚠️ Warning: OPENAI_API_KEY not found or invalid in .env")
    else:
        print("✅ API Key loaded.")

    print("✅ API Key loaded.")

    print("🚀 Launching GUI...")
    from ui.main_window import CVScorerApp
    app = CVScorerApp()
    app.mainloop()

if __name__ == "__main__":
    main()
