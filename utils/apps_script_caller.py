"""
apps_script_caller.py
─────────────────────
Module Python gọi Google Apps Script Webhook.
Dữ liệu URL và Secret được ưu tiên lấy từ ConfigManager (config.json).
"""

import os
import json
import time
import requests
from datetime import date
from core.config_manager import ConfigManager


def send_to_sheets_via_script(
    extracted_info: dict,
    max_retries: int = 3,
) -> dict:
    """
    Gửi 1 dòng ứng viên đến Google Sheets qua Apps Script Webhook.
    """
    config = ConfigManager.load_config()
    
    # Prioritize config.json
    webhook_url = config.get("apps_script_url") or os.getenv("APPS_SCRIPT_WEBHOOK_URL")
    webhook_secret = config.get("apps_script_secret") or os.getenv("APPS_SCRIPT_SECRET", "CV_SCORER_SECRET_2025")

    if not webhook_url or "ĐÂY_LÀ" in webhook_url:
        return {"success": False, "error": "Chưa cấu hình Apps Script Webhook URL trong Cài đặt."}

    row = _build_row_array(extracted_info)
    payload = {
        "secret": webhook_secret,
        "row":    row,
    }

    for attempt in range(max_retries):
        try:
            resp = requests.post(
                webhook_url,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
                timeout=30,
                allow_redirects=True,
            )
            resp.raise_for_status()
            result = resp.json()
            return result

        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            return {"success": False, "error": f"Request lỗi: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


def sync_pass_to_vong1(
    stt: int,
    max_retries: int = 2,
) -> dict:
    """
    Gọi Apps Script để copy 1 dòng PASS CV sang sheet Vòng 1.
    """
    config = ConfigManager.load_config()
    webhook_url = config.get("apps_script_url") or os.getenv("APPS_SCRIPT_WEBHOOK_URL")
    webhook_secret = config.get("apps_script_secret") or os.getenv("APPS_SCRIPT_SECRET", "CV_SCORER_SECRET_2025")
    if not webhook_url or "ĐÂY_LÀ" in webhook_url:
        return {"success": False, "error": "Chưa cấu hình Apps Script URL"}

    payload = {"secret": webhook_secret, "action": "sync_pass", "stt": stt}
    for attempt in range(max_retries):
        try:
            resp = requests.post(
                webhook_url, data=json.dumps(payload),
                headers={"Content-Type": "application/json"}, timeout=20, allow_redirects=True,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return {"success": False, "error": "Không gọi được sync PASS"}


def _build_row_array(info: dict) -> list:
    """Map extracted_info dict → list 15 giá trị theo thứ tự cột (không có STT, Apps Script tự tính)."""
    sdt_raw = str(info.get("sdt", "N/A")).strip()
    sdt_formatted = _format_phone(sdt_raw)

    return [
        info.get("ngay",               date.today().strftime("%Y-%m-%d")),
        info.get("ten_ung_vien",       "N/A"),
        info.get("email",              "N/A"),
        sdt_formatted,
        info.get("bang_cap",           "N/A"),
        info.get("chuyen_nganh",       "N/A"),
        info.get("kinh_nghiem",        "N/A"),      # Cột mới
        info.get("chuc_danh_gan_nhat", "N/A"),      # Cột mới
        info.get("cong_ty_gan_nhat",   "N/A"),      # Cột mới
        info.get("khu_vuc",            "N/A"),
        info.get("phong_ban",          "N/A"),
        info.get("vi_tri",             "N/A"),
        info.get("trang_thai",         "FAIL"),
        info.get("nguon",              "N/A"),
        info.get("nguoi_danh_gia",     "AI Auto"),
    ]


def _format_phone(s: str) -> str:
    """Convert any digit string to '0xxx xxx xxx format (apostrophe prefix keeps leading zero in Sheets)."""
    if not s or s == "N/A" or not any(c.isdigit() for c in s):
        return s
    
    # Keep only digits
    digits = "".join(filter(str.isdigit, s))
    
    # Logic for Vietnam phone numbers (usually 10 digits)
    if len(digits) == 10:
        formatted = f"{digits[:4]} {digits[4:7]} {digits[7:]}"
    elif len(digits) == 9:  # missing leading 0
        digits = "0" + digits
        formatted = f"{digits[:4]} {digits[4:7]} {digits[7:]}"
    else:
        return s  # return as is if doesn't match
    
    # Apostrophe prefix forces Google Sheets to treat as text, preserving leading zero
    return "'" + formatted
