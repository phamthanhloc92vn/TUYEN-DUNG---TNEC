import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv
from core.config_manager import ConfigManager
from core.department_classifier import classify_and_assign

load_dotenv()

class AIClient:
    """
    Wrapper for OpenAI compatible APIs (OpenAI / DeepSeek).
    V2: Extracts 16 structured fields + scoring in one call.
    Settings are prioritized from ConfigManager (config.json) then Environment Variables.
    """
    def __init__(self, api_key: str = None, model: str = None):
        # Prioritize ConfigManager -> Environment Variables -> Arguments
        config = ConfigManager.load_config()
        
        self.api_key = api_key or config.get("openai_api_key") or os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = model or config.get("openai_model") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        if not self.api_key:
            # We don't raise immediately here because UI might allow user to enter it later
            # But the client object won't be usable for calls yet.
            self.client = None
        else:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )

    def extract_and_score(
        self,
        cv_data: dict,
        jd_text: str,
        nguon: str = "N/A",
        nguoi_danh_gia: str = "AI Auto",
        ngay: str = None,
        max_retries: int = 3,
    ) -> str:
        if not self.client:
            return self._fallback_json("Missing API Key. Please configure it in Settings.")

        import datetime
        if ngay is None:
            ngay = datetime.date.today().strftime("%Y-%m-%d")

        system_msg, user_msg_content = self._construct_v2_payload(
            cv_data, jd_text, nguon, nguoi_danh_gia, ngay
        )

        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user",   "content": user_msg_content}
                    ],
                    temperature=0.0,
                    seed=42,
                    response_format={"type": "json_object"}
                )
                raw_json = response.choices[0].message.content
                # ── Ghi đè phong_ban và nguoi_danh_gia bằng classifier ──
                return self._override_dept_reviewer(raw_json, jd_text)

            except Exception as e:
                error_str = str(e)
                if "rate_limit" in error_str.lower() and attempt < max_retries - 1:
                    wait = 2 ** attempt
                    time.sleep(wait)
                    continue
                return self._fallback_json(f"API Error: {error_str}")

    def _construct_v2_payload(self, cv_data: dict, jd_text: str,
                               nguon: str, nguoi_danh_gia: str, ngay: str):
        system_msg = f"""
Bạn là Chuyên gia Tuyển dụng AI (AI Recruitment Expert).
Nhiệm vụ: Đọc CV ứng viên và thực hiện ĐỒNG THỜI hai việc:
  1. TRÍCH XUẤT thông tin cá nhân theo đúng 16 trường quy định.
  2. CHẤM ĐIỂM mức độ phù hợp với JD (Job Description).

━━━ QUY TẮC TRÍCH XUẤT (extracted_info) ━━━
- Trích xuất chính xác, không suy diễn ngoài CV.
- Trường không có trong CV → điền chính xác chuỗi "N/A".
- Ngày: luôn định dạng YYYY-MM-DD (hôm nay = {ngay}).
- SĐT: Luôn định dạng: 0xxx xxx xxx (ví dụ: 0932 458 213). Bắt buộc có khoảng trắng ngăn cách. Ghi là text (chuỗi), không phải số nguyên.
- Bằng cấp chuẩn hóa về: ĐH | CĐ | Thạc sĩ | THPT | N/A.
- Kinh nghiệm: Tính TỔNG số năm kinh nghiệm làm việc của ứng viên.
  + Định dạng trả về bắt buộc: "X năm" (ví dụ: "1 năm", "3 năm", "10 năm").
  + Nếu là sinh viên mới ra trường hoặc chưa có kinh nghiệm → trả về "Fresher".
  + Nếu không có thông tin trong CV → trả về "N/A".
- Chức danh gần nhất: Tìm vị trí / chức danh công việc GẦN NHẤT (ưu tiên năm mới nhất: 2025 > 2024 > 2023...).
  + Trả về chức danh dạng ngắn gọn (ví dụ: "Nhân viên", "Chuyên viên", "Kỹ sư kết cấu", "Trưởng phòng").
  + Nếu không rõ → trả về "N/A".
- Công ty gần nhất: Tìm tên công ty / tổ chức ứng viên làm việc GẦN NHẤT (ưu tiên năm mới nhất: 2025 > 2024 > 2023...).
  + Trả về tên đầy đủ của công ty (ví dụ: "Công ty TNHH ABC", "Tập đoàn XYZ").
  + Nếu không rõ → trả về "N/A".
- Vị trí ứng tuyển: Vị trí / công việc mà ứng viên MUỐN APPLY (lấy từ CV, không phải từ JD).
  + Tìm trong CV các từ khóa: "Vị trí ứng tuyển", "Mục tiêu nghề nghiệp", "Vị trí mong muốn"...
  + Nếu không ghi rõ → suy từ mục tiêu và kinh nghiệm trong CV (ví dụ: CV toàn đấu thầu → "Kỹ sư Đấu Thầu").
  + CHỈ điền chức danh ngắn gọn (ví dụ: "Kỹ sư kết cấu cầu", "Kế toán tổng hợp", "Nhân viên văn thư").
  + Tuyệt đối KHÔNG sao chép tên phòng ban → chỉ đưa ra chức danh công việc.
- Nguồn = "{nguon}".
- Phòng Ban & Người đánh giá: hệ thống sẽ tự phân loại từ JD, bạn điền "N/A" cho cả hai trường này.

━━━ QUY TẮC CHẤM ĐIỂM (score) ━━━
Bước 1: Phân tích JD → Top 5 Hard Skills bắt buộc.
Bước 2: Quét CV tìm từ khóa. Đếm số khớp.
Bước 3: Tính điểm:
  - Kỹ năng (Max 50): (khớp / 5) × 50
  - Kinh nghiệm (Max 30): số năm & độ phù hợp dự án
  - Trình bày & Soft Skills (Max 20)
Bước 4: Phạt -30 nếu thiếu kỹ năng "Must-have".
Bước 5: Nếu score >= 70 → Trạng thái = "PASS CV", ngược lại = "FAIL".

━━━ OUTPUT FORMAT (JSON ONLY) ━━━
{{
  "extracted_info": {{
    "stt": null,
    "ngay": "{ngay}",
    "ten_ung_vien": "...",
    "email": "...",
    "sdt": "...",
    "bang_cap": "...",
    "chuyen_nganh": "...",
    "kinh_nghiem": "...",
    "chuc_danh_gan_nhat": "...",
    "cong_ty_gan_nhat": "...",
    "khu_vuc": "...",
    "phong_ban": "...",
    "vi_tri": "...",
    "trang_thai": "PASS CV | FAIL",
    "nguon": "{nguon}",
    "nguoi_danh_gia": "{nguoi_danh_gia}"
  }},
  "score": 0-100,
  "matching_skills": ["..."],
  "missing_skills": ["..."],
  "summary": "Giải thích ngắn cách tính điểm.",
  "recommendation": "Interview | Hold | Reject"
}}
"""
        user_content = []
        user_content.append({"type": "text", "text": f"--- MÔ TẢ CÔNG VIỆC (JD) ---\n{jd_text}\n\n"})
        if cv_data.get("is_scanned") and cv_data.get("images"):
            user_content.append({"type": "text", "text": "--- ẢNH CHỤP CV (SCANNED) ---\n"})
            for b64_img in cv_data["images"]:
                user_content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}})
        else:
            user_content.append({"type": "text", "text": f"--- NỘI DUNG CV (TEXT) ---\n{cv_data.get('text', '')}"})
        user_content.append({"type": "text", "text": "\nTRÍCH XUẤT ĐẦY ĐỦ 16 TRƯỜNG VÀ CHẤM ĐIỂM. TRẢ VỀ JSON."})
        return system_msg, user_content

    def _override_dept_reviewer(self, raw_json: str, jd_text: str) -> str:
        """Override phong_ban, nguoi_danh_gia từ JD và fallback vi_tri nếu N/A."""
        try:
            data = json.loads(raw_json)
            vi_tri_ai = data.get("extracted_info", {}).get("vi_tri", "")
            phong_ban, nguoi_danh_gia = classify_and_assign(jd_text, vi_tri_ai)
            if "extracted_info" in data:
                data["extracted_info"]["phong_ban"] = phong_ban
                data["extracted_info"]["nguoi_danh_gia"] = nguoi_danh_gia
                # Nếu AI vẫn trả vi_tri = N/A, dùng chức danh gần nhất làm fallback
                current_vi_tri = str(data["extracted_info"].get("vi_tri", "")).strip()
                if not current_vi_tri or current_vi_tri.upper() == "N/A":
                    chuc_danh = str(data["extracted_info"].get("chuc_danh_gan_nhat", "")).strip()
                    data["extracted_info"]["vi_tri"] = chuc_danh if chuc_danh and chuc_danh.upper() != "N/A" else "N/A"
            return json.dumps(data, ensure_ascii=False)
        except Exception:
            return raw_json

    def _fallback_json(self, error_msg: str) -> str:
        return json.dumps({
            "extracted_info": {
                "stt": None, "ngay": "N/A", "ten_ung_vien": "Lỗi", "trang_thai": "FAIL"
            },
            "score": 0, "matching_skills": [], "missing_skills": [],
            "summary": error_msg, "recommendation": "Reject"
        }, ensure_ascii=False)