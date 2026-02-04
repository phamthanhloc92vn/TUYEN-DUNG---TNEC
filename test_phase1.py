import os
from core.scorer import CVScorer

def main():
    # Setup paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cv_path = os.path.join(base_dir, "sample_cv.txt")
    jd_path = os.path.join(base_dir, "sample_jd.txt")

    # Load content
    if not os.path.exists(cv_path) or not os.path.exists(jd_path):
        print("❌ Cannot find sample_cv.txt or sample_jd.txt")
        return

    with open(jd_path, "r", encoding="utf-8") as f:
        jd_text = f.read()

    # Initialize Scorer
    scorer = CVScorer()
    
    print(f"--- TESTING PHASE 1 ---")
    print(f"JD Length: {len(jd_text)} chars")
    
    # Run Evaluation
    try:
        result = scorer.evaluate_cv(cv_path, jd_text)
        print("\n✅ SCORING SUCCESSFUL!")
        print("-" * 30)
        print(f"Candidate: {result.get('candidate_name', 'Unknown')}")
        print(f"Score: {result.get('score')}/100")
        print(f"Status: {result.get('recommendation')}")
        print(f"Summary: {result.get('summary')}")
        print("-" * 30)
        print("Raw JSON:", result)
        
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        print("💡 Hint: Did you configure .env with your API Key?")

if __name__ == "__main__":
    main()
