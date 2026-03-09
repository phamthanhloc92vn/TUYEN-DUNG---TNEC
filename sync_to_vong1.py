"""
sync_to_vong1.py  
─────────────────
Script tạm thời: Đọc toàn bộ "Tổng Hợp" từ Sheets,
tìm các dòng PASS CV, và dùng trigger update để ép copy sang Vòng 1.

CÁCH DÙNG: python sync_to_vong1.py
"""
import requests, json

WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyuagVDy-jqhljPKHrcZidoz3uyDa_NKqTq9Cxu9l5MpqucAD6PY3Zc6uLozVbj0G3h/exec"
SECRET = "CV_SCORER_SECRET_2025"

def post(payload):
    r = requests.post(
        WEBHOOK_URL,
        data=json.dumps(payload),
        headers={"Content-Type": "application/json"},
        timeout=60,
        allow_redirects=True
    )
    return r.json()

# Đọc toàn bộ Tổng Hợp
print("📥 Đang đọc dữ liệu từ Tổng Hợp...")
r = requests.get(WEBHOOK_URL + "?action=getData&sheet=T%E1%BB%95ng%20H%E1%BB%A3p", timeout=30)

try:
    data = r.json()
except Exception:
    print("❌ Apps Script chưa được deploy bản mới!")
    print("Response:", r.text[:200])
    print("\n👉 Hướng dẫn deploy:")
    print("  1. Mở Google Apps Script Editor")
    print("  2. Copy nội dung file: apps_script/Code.gs")
    print("  3. Save → Deploy → Manage Deployments → Edit → New Version → Deploy")
    exit(1)

if not data.get("success"):
    print("❌ Lỗi API:", data)
    exit(1)

rows = data.get("data", [])
pass_cv_rows = [r for r in rows if str(r.get("Trạng thái","")).strip().upper() == "PASS CV"]

print(f"✅ Tìm thấy {len(pass_cv_rows)} ứng viên PASS CV trong Tổng Hợp:")
for row in pass_cv_rows:
    print(f"   - [{row.get('STT')}] {row.get('Tên ứng viên')} | {row.get('Ngày')}")

if not pass_cv_rows:
    print("⚠️  Không có ứng viên PASS CV nào để chuyển.")
    exit(0)

# Re-append vào Vòng 1 thông qua trigger update status
copied = 0
for row in pass_cv_rows:
    # Gửi update để trigger auto-copy  
    res = post({
        "secret": SECRET,
        "action": "update",
        "stt": int(row.get("STT", 0)),
        "updates": {"Trạng thái": "PASS CV"},
        "sheet": "Tổng Hợp"
    })
    print(f"   → Update STT {row.get('STT')}: {res}")
    copied += 1

print(f"\n✅ Hoàn tất! Đã xử lý {copied} dòng.")
print("   (Nếu Vòng 1 vẫn chưa có dữ liệu, hãy deploy Code.gs mới và chạy lại)")
