import os
import fitz  # PyMuPDF
import docx2txt
import base64

class FileReader:
    """
    Handles reading text OR images from PDF and DOCX files.
    Now supports hybrid mode: Text Extraction + Image Rendering for AI Vision.
    """
    
    @staticmethod
    def read_file(file_path: str) -> dict:
        """
        Reads file content.
        Returns a dict:
        {
            "text": str,          # Extracted text (if available)
            "images": list[str],  # List of base64 encoded images (if scanned)
            "is_scanned": bool,   # Flag indicating if OCR/Vision is needed
            "error": str          # Error message if any
        }
        """
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}", "text": "", "images": []}
            
        ext = file_path.lower().split('.')[-1]
        
        try:
            if ext == 'pdf':
                return FileReader._read_pdf(file_path)
            elif ext == 'docx':
                return FileReader._read_docx(file_path)
            elif ext in ['png', 'jpg', 'jpeg']:
                return FileReader._read_image(file_path)
            elif ext == 'txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return {"text": f.read(), "images": [], "is_scanned": False}
            else:
                return {"error": f"Unsupported format: .{ext}", "text": "", "images": []}
        except Exception as e:
            return {"error": f"Read failed: {str(e)}", "text": "", "images": []}

    @staticmethod
    def _read_pdf(file_path: str) -> dict:
        doc = fitz.open(file_path)
        text_content = ""
        
        # 1. Try to extract text first
        for page in doc:
            text_content += page.get_text() + "\n"
            
        # 2. Check if text is too short (likely scanned)
        is_scanned = len(text_content.strip()) < 50
        images = []

        if is_scanned:
            # Render pages as images for AI Vision
            # Limit to first 3 pages to save tokens/performance
            for i, page in enumerate(doc):
                if i >= 3: break 
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for clarity
                img_data = pix.tobytes("png")
                b64_img = base64.b64encode(img_data).decode('utf-8')
                images.append(b64_img)
                
        return {
            "text": text_content,
            "images": images,
            "is_scanned": is_scanned
        }

    @staticmethod
    def _read_docx(file_path: str) -> dict:
        text = docx2txt.process(file_path)
        is_empty = len(text.strip()) < 10
        # DOCX usually doesn't need Vision unless it contains only images, 
        # but docx2txt doesn't easily extract images as base64. 
        # For Phase 2, we assume DOCX is mostly text.
        return {
            "text": text,
            "images": [],
            "is_scanned": is_empty and len(text) == 0 # Simplistic check
        }

    @staticmethod
    def _read_image(file_path: str) -> dict:
        """
        Reads an image file and converts to base64 for AI Vision.
        """
        try:
            with open(file_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
            return {
                "text": "", # Images have no extracted text
                "images": [encoded_string],
                "is_scanned": True # Treat as scanned to trigger Vision mode
            }
        except Exception as e:
             return {"error": f"Image read failed: {str(e)}", "text": "", "images": []}

if __name__ == "__main__":
    print("FileReader Module Upgrade (Vision Ready)")
