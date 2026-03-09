from utils.process_cv_to_sheets import process_cv_to_sheets
import json
import os

def run_test():
    jd = """
    Vị trí: Nhân viên Văn thư. 
    Yêu cầu: 
    - Có kỹ năng lưu trữ hồ sơ, soạn thảo văn bản.
    - Nhanh nhẹn, trung thực, cẩn thận.
    - Thành thạo tin học văn phòng.
    """
    
    # Path to a real PDF
    cv_path = os.path.join("cv ung vien", "CV LÊ THỊ THU THẢO VAN THU 2026.pdf")
    
    # Sheet ID from user (or URL)
    sheet_id = "1XpbJYs0q3RJEGLkSHkVBBzsjAbgPEpFAml2CkAh3myc"
    
    print(f"🚀 Starting V2 E2E Test...")
    print(f"File: {cv_path}")
    
    result = process_cv_to_sheets(
        pdf_file=cv_path,
        sheet_id=sheet_id,
        jd_text=jd,
        nguon="Test E2E Automated",
        nguoi_danh_gia="Antigravity AI"
    )
    
    print("\n" + "="*50)
    print("✨ TEST RESULT ✨")
    print("="*50)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if result.get("success"):
        print("\n✅ SUCCESS: Data appended to Google Sheets via Apps Script!")
        print(f"URL: {result.get('sheet_url')}")
    else:
        print("\n❌ FAILED: " + result.get("error", "Unknown error"))

if __name__ == "__main__":
    run_test()
