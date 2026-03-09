import json
import datetime
from .file_reader import FileReader
from .ai_client import AIClient


class CVScorer:
    """
    V2: Orchestrates the full pipeline:
        File → FileReader → AIClient (extract + score) → structured result dict
    """

    def __init__(self):
        self.reader = FileReader()

    def evaluate_cv(
        self,
        cv_file_path: str,
        jd_text: str,
        api_key: str = None,
        nguon: str = "N/A",
        nguoi_danh_gia: str = "AI Auto",
        ngay: str = None,
    ) -> dict:
        """
        V2 main method.
        Returns a dict with both extracted_info (16 fields) and scoring data.
        All errors are caught – never raises, always returns safe dict.
        """
        if ngay is None:
            ngay = datetime.date.today().strftime("%Y-%m-%d")

        try:
            ai = AIClient(api_key)

            # Step 1: Read file
            print(f"[Scorer] Reading: {cv_file_path}")
            cv_data = self.reader.read_file(cv_file_path)

            if cv_data.get("error"):
                return self._error_result(cv_file_path, cv_data["error"], nguon, nguoi_danh_gia, ngay)

            # Step 2: AI extract + score
            mode = " (Vision Mode)" if cv_data.get("is_scanned") else ""
            print(f"[Scorer] Analyzing with AI...{mode}")
            json_response = ai.extract_and_score(
                cv_data, jd_text,
                nguon=nguon,
                nguoi_danh_gia=nguoi_danh_gia,
                ngay=ngay
            )

            # Step 3: Parse JSON
            clean_json = json_response.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_json)

            # Step 4: Normalize extracted_info – fill missing keys with "N/A"
            extracted = result.get("extracted_info", {})
            extracted = self._normalize_extracted(extracted, nguon, nguoi_danh_gia, ngay)
            result["extracted_info"] = extracted
            result["file_path"] = cv_file_path

            return result

        except json.JSONDecodeError:
            return self._error_result(
                cv_file_path,
                "AI trả về format sai, không parse được JSON.",
                nguon, nguoi_danh_gia, ngay
            )
        except Exception as e:
            return self._error_result(
                cv_file_path,
                f"Lỗi không xác định: {str(e)}",
                nguon, nguoi_danh_gia, ngay
            )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _normalize_extracted(self, info: dict, nguon: str, nguoi_danh_gia: str, ngay: str) -> dict:
        """Ensure all 16 required keys exist, fill missing ones with N/A."""
        defaults = {
            "stt": None,
            "ngay": ngay,
            "ten_ung_vien": "N/A",
            "email": "N/A",
            "sdt": "N/A",
            "bang_cap": "N/A",
            "chuyen_nganh": "N/A",
            "kinh_nghiem": "N/A",
            "chuc_danh_gan_nhat": "N/A",
            "cong_ty_gan_nhat": "N/A",
            "khu_vuc": "N/A",
            "phong_ban": "N/A",
            "vi_tri": "N/A",
            "trang_thai": "FAIL",
            "nguon": nguon,
            "nguoi_danh_gia": nguoi_danh_gia,
        }
        for key, default_val in defaults.items():
            if key not in info or info[key] is None or str(info[key]).strip() == "":
                info[key] = default_val
        return info

    def _error_result(self, file_path: str, error_msg: str,
                      nguon: str, nguoi_danh_gia: str, ngay: str) -> dict:
        return {
            "extracted_info": self._normalize_extracted({}, nguon, nguoi_danh_gia, ngay),
            "score": 0,
            "matching_skills": [],
            "missing_skills": [],
            "summary": error_msg,
            "recommendation": "Error",
            "file_path": file_path,
        }


if __name__ == "__main__":
    print("CVScorer V2 (Extract + Score + Normalize) Ready.")
