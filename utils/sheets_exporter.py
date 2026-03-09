"""
sheets_exporter.py  –  V2
Append một dòng dữ liệu ứng viên vào tab "Tổng Hợp" của Google Sheets CÓ SẴN.
Authentication: Service Account JSON (credentials.json).
"""

import os
import time
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

# Scopes cần thiết
SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

# Đường dẫn mặc định tới credentials.json
DEFAULT_CREDS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "credentials.json"
)

# Tên tab mặc định cần ghi
DEFAULT_SHEET_TAB = "Tổng Hợp"


class SheetsExporter:
    """
    V2: Mở Google Sheet có sẵn → tìm tab "Tổng Hợp" → append 1 dòng mới.
    Auto-tăng STT dựa theo số dòng hiện có.
    """

    def __init__(self, credentials_path: str = None):
        self.creds_path = credentials_path or DEFAULT_CREDS_PATH
        self._client = None

    # ------------------------------------------------------------------
    # PUBLIC: append one candidate row
    # ------------------------------------------------------------------
    def append_candidate(
        self,
        sheet_id: str,
        extracted_info: dict,
        max_retries: int = 3,
        tab_name: str = DEFAULT_SHEET_TAB,
    ) -> str:
        """
        Append one row to the specified tab.

        Args:
            sheet_id:       Google Spreadsheet ID (or full URL).
            extracted_info: Dict with keys matching the 13-column schema.
            max_retries:    Number of retries on API error.
            tab_name:       Worksheet tab name (default: 'Tổng Hợp').

        Returns:
            URL of the spreadsheet.
        """
        client = self._get_client()

        # Accept full URL or bare ID
        if "spreadsheets/d/" in sheet_id:
            sheet_id = sheet_id.split("spreadsheets/d/")[1].split("/")[0]

        spreadsheet = client.open_by_key(sheet_id)

        # Find the target worksheet
        try:
            worksheet = spreadsheet.worksheet(tab_name)
        except gspread.exceptions.WorksheetNotFound:
            raise ValueError(
                f"Không tìm thấy tab '{tab_name}' trong Google Sheet.\n"
                "Vui lòng tạo tab đúng tên trước khi chạy."
            )

        # Determine next STT (row count minus header row)
        existing_rows = worksheet.get_all_values()
        next_stt = max(len(existing_rows), 1)  # header = row 1

        # Build row in column order
        row = self._build_row(extracted_info, next_stt)

        # Append with retry + backoff
        for attempt in range(max_retries):
            try:
                worksheet.append_row(row, value_input_option="USER_ENTERED")
                print(f"[SheetsExporter] ✅ Appended row STT={next_stt} to '{tab_name}'")
                return spreadsheet.url

            except gspread.exceptions.APIError as e:
                if attempt < max_retries - 1:
                    wait = 2 ** attempt
                    print(f"[SheetsExporter] API error, retrying in {wait}s... ({attempt+1}/{max_retries})")
                    time.sleep(wait)
                else:
                    raise RuntimeError(f"Google Sheets API lỗi sau {max_retries} lần thử: {e}") from e

    # ------------------------------------------------------------------
    # LEGACY: V1 – create NEW spreadsheet and write all results at once
    # ------------------------------------------------------------------
    def export(self, results_data: list, spreadsheet_title: str = None) -> str:
        """V1 method – kept for backward compatibility."""
        if not results_data:
            raise ValueError("Chưa có dữ liệu để xuất.")

        client = self._get_client()
        if not spreadsheet_title:
            now = datetime.now().strftime("%Y-%m-%d %H:%M")
            spreadsheet_title = f"Kết Quả Chấm CV - {now}"

        spreadsheet = client.create(spreadsheet_title)
        sheet = spreadsheet.sheet1
        sheet.update_title("Kết Quả")

        headers = ["Họ Tên", "Năm Sinh", "Điểm Số", "Nhận Xét", "Trạng Thái", "Đường Dẫn File"]
        rows = [headers]

        for item in results_data:
            raw = item.get("raw_result", {})
            status_map = {
                "Interview": "✅ Mời Phỏng Vấn",
                "Hold":      "⏸ Xem Xét Thêm",
                "Reject":    "❌ Không Phù Hợp",
            }
            status_vn = status_map.get(item.get("status", ""), item.get("status", ""))
            rows.append([
                item.get("name", "N/A"),
                raw.get("birth_year", "N/A"),
                item.get("score", 0),
                item.get("summary", ""),
                status_vn,
                raw.get("file_path", "N/A"),
            ])

        sheet.update("A1", rows)
        return spreadsheet.url

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _build_row(self, info: dict, stt: int) -> list:
        """Map extracted_info dict → ordered list matching sheet columns."""
        return [
            stt,
            info.get("ngay", "N/A"),
            info.get("ten_ung_vien", "N/A"),
            info.get("email", "N/A"),
            str(info.get("sdt", "N/A")),
            info.get("bang_cap", "N/A"),
            info.get("chuyen_nganh", "N/A"),
            info.get("kinh_nghiem", "N/A"),
            info.get("chuc_danh_gan_nhat", "N/A"),
            info.get("cong_ty_gan_nhat", "N/A"),
            info.get("khu_vuc", "N/A"),
            info.get("phong_ban", "N/A"),
            info.get("vi_tri", "N/A"),
            info.get("trang_thai", "FAIL"),
            info.get("nguon", "N/A"),
            info.get("nguoi_danh_gia", "N/A"),
        ]

    def _get_client(self) -> gspread.Client:
        """Lazy-init gspread client."""
        if self._client is None:
            if not os.path.exists(self.creds_path):
                raise FileNotFoundError(
                    f"Không tìm thấy file credentials.json tại:\n{self.creds_path}\n\n"
                    "Vui lòng xem hướng dẫn trong README_GOOGLE_SHEETS.md."
                )
            creds = Credentials.from_service_account_file(self.creds_path, scopes=SCOPES)
            self._client = gspread.authorize(creds)
        return self._client


if __name__ == "__main__":
    print("SheetsExporter V2 (append_candidate mode) Ready.")
