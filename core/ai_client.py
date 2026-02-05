import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIClient:
    """
    Wrapper for OpenAI compatible APIs (OpenAI / DeepSeek).
    Supports Text-Only and Multimodal (Vision) requests.
    Enforces deterministic scoring logic (Chain-of-Thought).
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key if api_key else os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini") 
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables or provided argument.")

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
                temperature=0.0, # NO RANDOMNESS
                seed=42,         # FIXED SEED
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            return json.dumps({
                "candidate_name": "Lỗi hệ thống",
                "score": 0,
                "summary": f"API Error: {str(e)}",
                "recommendation": "Reject",
                "matching_skills": [],
                "missing_skills": []
            })

    def _construct_payload(self, cv_data: dict, jd_text: str):
        """
        Constructs the messages payload. 
        """
        system_msg = """
        Bạn là Chuyên gia Tuyển dụng AI (AI Recruitment Expert).
        Nhiệm vụ: Chấm điểm CV ứng viên dựa trên JD một cách logic, công bằng và NHẤT QUÁN.
        
        QUY TRÌNH CHẤM ĐIỂM (CHAIN-OF-THOUGHT):
        Bước 1: Phân tích JD để tìm ra Top 5 "Hard Skills" (Từ khóa kỹ thuật) quan trọng nhất.
        Bước 2: Quét CV tìm các từ khóa này. Đếm số lượng trùng khớp.
        Bước 3: Tính điểm sơ bộ theo công thức:
            - Điểm Kỹ Năng (Max 50): (Số từ khóa khớp / 5) * 50.
            - Điểm Kinh Nghiệm (Max 30): Dựa trên số năm và độ phù hợp dự án.
            - Điểm Trình Bày & Soft Skills (Max 20): Bố cục, tiếng Anh, tư duy.
        Bước 4: Áp dụng hình phạt (Penalty):
            - Nếu thiếu kỹ năng "Must-have" (Bắt buộc) trong JD: TRỪ NGAY 30 ĐIỂM.
        Bước 5: Tổng hợp và đưa ra kết luận.

        OUTPUT FORMAT (JSON ONLY):
        {
            "candidate_name": "Tên ứng viên",
            "score": (0-100),
            "matching_skills": ["List các hard skills tìm thấy"],
            "missing_skills": ["List các hard skills không thấy"],
            "summary": "Giải thích cách tính điểm (VD: Khớp 3/5 skill (+30), Kinh nghiệm tốt (+25), Thiếu tiếng Anh (-5)). Kết luận ngắn.",
            "recommendation": "Interview" | "Hold" | "Reject"
        }
        """

        user_content = []
        
        # 1. Add JD
        user_content.append({
            "type": "text",
            "text": f"--- MÔ TẢ CÔNG VIỆC (JD) ---\nMy Top Priority Requirements:\n{jd_text}\n\n"
        })

        # 2. Add CV
        if cv_data.get("is_scanned") and cv_data.get("images"):
            user_content.append({
                "type": "text", 
                "text": "--- ẢNH CHỤP CV (SCANNED) ---\nHãy đọc kỹ text trong ảnh dưới đây để chấm điểm.\n"
            })
            for b64_img in cv_data["images"]:
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{b64_img}"
                    }
                })
        else:
            user_content.append({
                "type": "text",
                "text": f"--- NỘI DUNG CV (TEXT) ---\n{cv_data.get('text', '')}"
            })

        # 3. Reminder
        user_content.append({
            "type": "text",
            "text": "\nHÃY TÍNH TOÁN CẨN THẬN. TRẢ VỀ JSON."
        })

        return system_msg, user_content

if __name__ == "__main__":
    print("AIClient (Deterministic Logic) Ready.")