"""
process_cv_to_sheets.py  –  V2 Main Orchestrator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hàm chính: process_cv_to_sheets(pdf_file, sheet_id, ...)
Luồng:
  PDF/DOCX/Image
    → FileReader      (trích xuất text hoặc render ảnh)
    → AIClient V2     (extract 13 trường + chấm điểm)
    → SheetsExporter  (append 1 dòng vào tab "Tổng Hợp")
    → Return result dict
"""

import os
import datetime
from core.file_reader import FileReader
from core.ai_client import AIClient
from core.scorer import CVScorer
from utils.sheets_exporter import SheetsExporter


def process_cv_to_sheets(
    pdf_file: str,
    sheet_id: str,
    jd_text: str = "",
    nguon: str = "N/A",
    nguoi_danh_gia: str = "AI Auto",
    api_key: str = None,
    ngay: str = None,
    credentials_path: str = None,
) -> dict:
    """
    Full V2 pipeline: read CV → AI extract+score → append to Google Sheets.

    Args:
        pdf_file:          Đường dẫn đến file CV (PDF / DOCX / PNG / JPG / TXT).
        sheet_id:          Google Spreadsheet ID hoặc URL đầy đủ.
        jd_text:           Job Description (nếu có, dùng để chấm điểm).
        nguon:             Nguồn CV (vd: "TopCV", "LinkedIn", "Email").
        nguoi_danh_gia:    Tên HR hoặc "AI Auto".
        api_key:           OpenAI API key (nếu không có thì đọc từ .env).
        ngay:              Ngày xử lý (YYYY-MM-DD). Mặc định: hôm nay.
        credentials_path:  Đường dẫn credentials.json (mặc định: thư mục gốc).

    Returns:
        {
            "success":       bool,
            "row_appended":  dict (13 fields),
            "score":         int,
            "summary":       str,
            "recommendation": str,
            "sheet_url":     str,
            "error":         str  (only if success=False)
        }
    """
    if ngay is None:
        ngay = datetime.date.today().strftime("%Y-%m-%d")

    # ── Step 1: Validate input file ──────────────────────────────────
    if not os.path.exists(pdf_file):
        return _error_result(f"File không tồn tại: {pdf_file}")

    # ── Step 2: AI Extract + Score ───────────────────────────────────
    try:
        scorer = CVScorer()
        result = scorer.evaluate_cv(
            cv_file_path=pdf_file,
            jd_text=jd_text,
            api_key=api_key,
            nguon=nguon,
            nguoi_danh_gia=nguoi_danh_gia,
            ngay=ngay,
        )
    except Exception as e:
        return _error_result(f"AI Processing lỗi: {str(e)}")

    extracted_info = result.get("extracted_info", {})

    # ── Step 3: Append to Google Sheets ─────────────────────────────
    sheet_url = None
    sheet_error = None

    try:
        from utils.apps_script_caller import send_to_sheets_via_script
        print(f"[Pipeline] 🚀 Gửi dữ liệu tới Google Sheets qua Apps Script...")
        res_gs = send_to_sheets_via_script(extracted_info)
        
        if res_gs.get("success"):
            sheet_url = res_gs.get("sheet_url")
            stt = res_gs.get("stt")
            print(f"[Pipeline] ✅ Done. Sheet URL: {sheet_url}")
            # Auto-copy PASS CV → Vòng 1
            trang_thai = str(extracted_info.get("trang_thai", "")).strip().upper()
            if trang_thai == "PASS CV" and stt:
                from utils.apps_script_caller import sync_pass_to_vong1
                sync_result = sync_pass_to_vong1(stt)
                if sync_result.get("success"):
                    print(f"[Pipeline] ✅ PASS CV → Vòng 1: Đã copy STT={stt}")
                else:
                    print(f"[Pipeline] ⚠️  Sync Vòng 1 thất bại: {sync_result.get('error')}")
        else:
            sheet_error = res_gs.get("error")
            print(f"[Pipeline] ⚠️  Script Error: {sheet_error}")

    except Exception as e:
        sheet_error = f"Lỗi kết nối Apps Script: {str(e)}"
        print(f"[Pipeline] ⚠️  {sheet_error}")

    return {
        "success":        sheet_error is None,
        "row_appended":   extracted_info,
        "score":          result.get("score", 0),
        "matching_skills": result.get("matching_skills", []),
        "missing_skills":  result.get("missing_skills", []),
        "summary":        result.get("summary", ""),
        "recommendation": result.get("recommendation", ""),
        "sheet_url":      sheet_url,
        "error":          sheet_error,
        "file_path":      pdf_file,
    }


def batch_process(
    cv_files: list,
    sheet_id: str,
    jd_text: str = "",
    nguon: str = "N/A",
    nguoi_danh_gia: str = "AI Auto",
    api_key: str = None,
    credentials_path: str = None,
    on_progress=None,
) -> list:
    """
    Xử lý nhiều file CV tuần tự.
    Args:
        cv_files:    Danh sách đường dẫn file.
        on_progress: Callback function(index, total, result) để cập nhật UI.
    Returns:
        List of result dicts.
    """
    results = []
    total = len(cv_files)
    today = datetime.date.today().strftime("%Y-%m-%d")

    for i, cv_file in enumerate(cv_files):
        print(f"\n[Batch] Processing {i+1}/{total}: {os.path.basename(cv_file)}")
        result = process_cv_to_sheets(
            pdf_file=cv_file,
            sheet_id=sheet_id,
            jd_text=jd_text,
            nguon=nguon,
            nguoi_danh_gia=nguoi_danh_gia,
            api_key=api_key,
            ngay=today,
            credentials_path=credentials_path,
        )
        results.append(result)

        if on_progress:
            on_progress(i + 1, total, result)

    print(f"\n[Batch] ✅ Completed {total} files.")
    return results


# ── Helpers ──────────────────────────────────────────────────────────
def _error_result(error_msg: str) -> dict:
    return {
        "success":        False,
        "row_appended":   {},
        "score":          0,
        "matching_skills": [],
        "missing_skills":  [],
        "summary":        error_msg,
        "recommendation": "Error",
        "sheet_url":      None,
        "error":          error_msg,
        "file_path":      None,
    }


# ── CLI Quick-test ────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 3:
        print("Usage: python -m utils.process_cv_to_sheets <pdf_file> <sheet_id> [nguon] [nguoi_danh_gia]")
        sys.exit(1)

    res = process_cv_to_sheets(
        pdf_file=sys.argv[1],
        sheet_id=sys.argv[2],
        nguon=sys.argv[3] if len(sys.argv) > 3 else "N/A",
        nguoi_danh_gia=sys.argv[4] if len(sys.argv) > 4 else "AI Auto",
    )
    print(json.dumps(res, ensure_ascii=False, indent=2))
