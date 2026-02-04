import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIClient:
    """
    Wrapper for OpenAI compatible APIs (OpenAI / DeepSeek).
    Supports Text-Only and Multimodal (Vision) requests.
    """
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        # Vision requires gpt-4o or gpt-4o-mini usually. 
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini") 
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables.")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def get_score(self, cv_data: dict, jd_text: str) -> str:
        """
        Sends CV (Text or Images) and JD to LLM.
        cv_data: dict from FileReader {'text': str, 'images': list[b64], 'is_scanned': bool}
        """
        system_msg, user_msg_content = self._construct_payload(cv_data, jd_text)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg_content}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            return json.dumps({
                "candidate_name": "Lỗi hệ thống",
                "score": 0,
                "summary": f"API Error: {str(e)}",
                "recommendation": "Reject"
            })

    def _construct_payload(self, cv_data: dict, jd_text: str):
        """
        Constructs the messages payload. 
        If scanned, sends images. If text, sends text.
        """
        system_msg = """
        Bạn là Trưởng phòng Tuyển dụng. Đánh giá CV dựa trên JD.
        Output: JSON {candidate_name, score, matching_skills, missing_skills, summary, recommendation}.
        Quy tắc: Khắt khe, khách quan.
        """

        user_content = []
        
        # 1. Add JD Instructions
        user_content.append({
            "type": "text",
            "text": f"--- MÔ TẢ CÔNG VIỆC (JD) ---\n{jd_text}\n\n"
        })

        # 2. Add CV Content (Text or Images)
        if cv_data.get("is_scanned") and cv_data.get("images"):
            user_content.append({
                "type": "text", 
                "text": "--- FILE PDF DẠNG ẢNH (SCANNED) ---\nDưới đây là hình ảnh các trang CV. Hãy đọc kỹ nội dung trong ảnh để chấm điểm.\n"
            })
            for b64_img in cv_data["images"]:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{b64_img}"
                    }
                })
        else:
            # Normal Text Mode
            user_content.append({
                "type": "text",
                "text": f"--- HỒ SƠ ỨNG VIÊN (TEXT) ---\n{cv_data.get('text', '')}"
            })

        # 3. Add Output Format Reminder
        user_content.append({
            "type": "text",
            "text": "\n--- YÊU CẦU: Trả về JSON duy nhất."
        })

        return system_msg, user_content

if __name__ == "__main__":
    print("AIClient Vision Ready.")