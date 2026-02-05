import json
from .file_reader import FileReader
from .ai_client import AIClient

class CVScorer:
    def __init__(self):
        self.reader = FileReader()

    def evaluate_cv(self, cv_file_path: str, jd_text: str, api_key: str = None) -> dict:
        """
        Orchestrates the scoring process.
        """
        try:
            # Init AI Client with optional key
            ai = AIClient(api_key)

            # Step 1: Read File (Returns Dict now)
            print(f"Reading file: {cv_file_path}...")
            cv_data = self.reader.read_file(cv_file_path)
            
            # Check Reader Errors
            if cv_data.get("error"):
                return {
                    "candidate_name": "File Error",
                    "score": 0,
                    "summary": cv_data["error"],
                    "recommendation": "Error"
                }

            # Step 2: Call AI (Pass Dict)
            print("Analyzing with AI..." + (" (Vision Mode)" if cv_data.get("is_scanned") else ""))
            json_response = ai.get_score(cv_data, jd_text)
            
            # Step 3: Parse JSON
            clean_json = json_response.replace('```json', '').replace('```', '').strip()
            result = json.loads(clean_json)
            
            result['file_path'] = cv_file_path
            return result

        except json.JSONDecodeError:
            return {
                "candidate_name": "AI Error",
                "score": 0,
                "summary": "AI trả về format sai, không parse được JSON.",
                "recommendation": "Retry"
            }
        except Exception as e:
            return {
                "candidate_name": "System Error",
                "score": 0,
                "summary": f"Lỗi không xác định: {str(e)}",
                "recommendation": "Error"
            }

if __name__ == "__main__":
    print("CVScorer Module Ready (Vision Integrated)")
