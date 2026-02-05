import customtkinter as ctk
import os
import threading
from tkinter import filedialog, messagebox
from core.scorer import CVScorer

# Cấu hình giao diện chung
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class CVScorerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- CẤU HÌNH WINDOW ---
        self.title("AI CV Scorer - Vibe Coding Version (Enhanced)")
        self.geometry("1100x700")
        
        # Grid Layout: 2 cột (Sidebar 1 phần, Main Content 3 phần)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- KHỞI TẠO LOGIC ---
        self.scorer = CVScorer()
        self.selected_folder = ""
        self.is_processing = False

        # --- UI COMPONENTS ---
        self._setup_sidebar()
        self._setup_main_area()

    def _setup_sidebar(self):
        """Tạo sidebar bên trái chứa cấu hình"""
        self.sidebar_frame = ctk.CTkFrame(self, width=250, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)

        # Title
        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="AI CV SCORER", 
                                     font=ctk.CTkFont(size=20, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        # JD Input
        self.jd_label = ctk.CTkLabel(self.sidebar_frame, text="Mô tả công việc (JD):", anchor="w")
        self.jd_label.grid(row=1, column=0, padx=20, pady=(10, 0), sticky="w")
        
        self.jd_textbox = ctk.CTkTextbox(self.sidebar_frame, height=200)
        self.jd_textbox.grid(row=2, column=0, padx=20, pady=(5, 10), sticky="nsew")
        self.jd_textbox.insert("0.0", "Paste Job Description vào đây...")

        # API Key Input
        self.api_key_entry = ctk.CTkEntry(self.sidebar_frame, placeholder_text="Nhập OpenAI API Key...", show="*")
        self.api_key_entry.grid(row=3, column=0, padx=20, pady=(10, 0), sticky="ew")

        # Folder Selection
        self.folder_btn = ctk.CTkButton(self.sidebar_frame, text="Chọn Thư Mục CV", 
                                      command=self.browse_folder)
        self.folder_btn.grid(row=4, column=0, padx=20, pady=10)
        
        self.folder_path_label = ctk.CTkLabel(self.sidebar_frame, text="Chưa chọn thư mục", 
                                            text_color="gray", wraplength=200)
        self.folder_path_label.grid(row=5, column=0, padx=20, pady=(0, 10), sticky="n")

        # Start Button
        self.start_btn = ctk.CTkButton(self.sidebar_frame, text="BẮT ĐẦU CHẤM ĐIỂM", 
                                     fg_color="green", hover_color="darkgreen",
                                     height=50, font=ctk.CTkFont(size=15, weight="bold"),
                                     command=self.start_scoring)
        self.start_btn.grid(row=6, column=0, padx=20, pady=20, sticky="s")

    def _setup_main_area(self):
        """Tạo khu vực hiển thị kết quả bên phải"""
        self.main_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_rowconfigure(1, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        # Header Area
        self.header_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.header_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        
        self.title_label = ctk.CTkLabel(self.header_frame, text="Kết Quả Đánh Giá", 
                                      font=ctk.CTkFont(size=24, weight="bold"))
        self.title_label.pack(side="left")

        self.progress_bar = ctk.CTkProgressBar(self.header_frame, orientation="horizontal")
        self.progress_bar.pack(side="right", fill="x", expand=True, padx=(20, 0))
        self.progress_bar.set(0)

        # Result Table (Scrollable)
        self.result_scroll = ctk.CTkScrollableFrame(self.main_frame, label_text="Danh Sách Ứng Viên")
        self.result_scroll.grid(row=1, column=0, sticky="nsew")
        
    def browse_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.selected_folder = folder
            self.folder_path_label.configure(text=os.path.basename(folder), text_color="white")

    def start_scoring(self):
        if self.is_processing:
            return

        jd_text = self.jd_textbox.get("1.0", "end-1c").strip()
        if len(jd_text) < 50:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng nhập JD (ít nhất 50 ký tự).")
            return
            
        if not self.selected_folder:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn thư mục chứa CV.")
            return

        # Get API Key
        api_key = self.api_key_entry.get().strip()
        if not api_key:
            # Check env
            if not os.getenv("OPENAI_API_KEY"):
                 messagebox.showwarning("Thiếu thông tin", "Vui lòng nhập API Key để tiếp tục!")
                 return
            api_key = None # Let AIClient load from env

        # Prepare UI
        self.is_processing = True
        self.start_btn.configure(state="disabled", text="Đang xử lý...")
        self.progress_bar.set(0)
        
        # Clear old results
        for widget in self.result_scroll.winfo_children():
            widget.destroy()

        # Start Thread
        t = threading.Thread(target=self._process_files, args=(jd_text, api_key))
        t.start()

    def _process_files(self, jd_text, api_key):
        files = [f for f in os.listdir(self.selected_folder) 
                 if f.lower().endswith(('.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'))]
        
        total_files = len(files)
        if total_files == 0:
            self.after(0, lambda: messagebox.showinfo("Thông báo", "Không tìm thấy file CV nào hợp lệ."))
            self.after(0, self._reset_ui)
            return

        for idx, filename in enumerate(files):
            filepath = os.path.join(self.selected_folder, filename)
            
            # Call Core Logic
            result = self.scorer.evaluate_cv(filepath, jd_text, api_key=api_key)
            
            # Prepare data for UI
            display_data = {
                "name": result.get("candidate_name", filename),
                "score": result.get("score", 0),
                "summary": result.get("summary", "Không có nhận xét"),
                "status": result.get("recommendation", "Unknown"),
                "matching_skills": result.get("matching_skills", []),
                "missing_skills": result.get("missing_skills", []),
                "raw_result": result # Keep complete data for details
            }
            
            # Update UI safely
            self.after(0, lambda d=display_data: self._add_result_row(d))
            self.after(0, lambda p=(idx + 1) / total_files: self.progress_bar.set(p))

        self.after(0, lambda: messagebox.showinfo("Hoàn tất", f"Đã chấm xong {total_files} hồ sơ."))
        self.after(0, self._reset_ui)

    def _get_score_color(self, score):
        if score >= 75:
            return "#2ecc71" # Green
        elif score >= 50:
            return "#f1c40f" # Yellow
        else:
            return "#e74c3c" # Red

    def _add_result_row(self, data):
        """Thêm một dòng kết quả vào bảng với giao diện chi tiết"""
        row_frame = ctk.CTkFrame(self.result_scroll, fg_color=("#2b2b2b", "#333333"))
        row_frame.pack(fill="x", pady=5, padx=5)
        
        # 1. Avatar (Initials)
        initials = "".join([n[0] for n in data["name"].split()[:2]]).upper()
        avatar = ctk.CTkLabel(row_frame, text=initials, width=40, height=40, 
                            fg_color="gray", corner_radius=20)
        avatar.pack(side="left", padx=10, pady=10)

        # 2. View Details Button (Right) - Pack FIRST to reserve space
        detail_btn = ctk.CTkButton(row_frame, text="📄 Chi tiết", width=80, height=30,
                                 fg_color="#34495e", hover_color="#2c3e50",
                                 command=lambda: self.show_details_popup(data))
        detail_btn.pack(side="right", padx=10)

        # 3. Score Badge (Right) - Pack SECOND to reserve space
        score_val = data["score"]
        score_color = self._get_score_color(score_val)
        
        score_frame = ctk.CTkFrame(row_frame, fg_color="transparent")
        score_frame.pack(side="right", padx=10)
        
        score_label = ctk.CTkLabel(score_frame, text=f"{score_val}", 
                                 font=ctk.CTkFont(size=24, weight="bold"), text_color=score_color)
        score_label.pack(anchor="e")
        
        score_sub = ctk.CTkLabel(score_frame, text="/100", font=ctk.CTkFont(size=10), text_color="gray")
        score_sub.pack(anchor="e")

        # 4. Info (Name + Status) - Pack LAST to fill remaining space
        info_frame = ctk.CTkFrame(row_frame, fg_color="transparent")
        info_frame.pack(side="left", fill="both", expand=True, padx=5)
        
        name_label = ctk.CTkLabel(info_frame, text=data["name"], 
                                font=ctk.CTkFont(size=14, weight="bold"), anchor="w")
        name_label.pack(fill="x")
        
        # Display Summary instead of just Status for better context, truncated
        summary_text = data["summary"].split('\n')[0][:100] + "..." if len(data["summary"]) > 100 else data["summary"].split('\n')[0]
        status_label = ctk.CTkLabel(info_frame, text=f"• {summary_text}", 
                                  font=ctk.CTkFont(size=12), text_color="silver", anchor="w")
        status_label.pack(fill="x")
    def show_details_popup(self, data):
        """Hiển thị cửa sổ chi tiết (Toplevel)"""
        toplevel = ctk.CTkToplevel(self)
        toplevel.title(f"Chi tiết: {data['name']}")
        toplevel.geometry("600x500")
        toplevel.attributes("-topmost", True) # Giữ cửa sổ luôn ở trên

        # Header
        header_frame = ctk.CTkFrame(toplevel, fg_color="transparent")
        header_frame.pack(fill="x", padx=20, pady=20)
        
        name_lbl = ctk.CTkLabel(header_frame, text=data["name"], font=ctk.CTkFont(size=20, weight="bold"))
        name_lbl.pack(side="left")
        
        score_color = self._get_score_color(data["score"])
        score_lbl = ctk.CTkLabel(header_frame, text=f"Score: {data['score']}/100", 
                               font=ctk.CTkFont(size=20, weight="bold"), text_color=score_color)
        score_lbl.pack(side="right")

        # Content - Scrollable
        scroll = ctk.CTkScrollableFrame(toplevel)
        scroll.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        # Section: Summary
        ctk.CTkLabel(scroll, text="NHẬN XÉT TỔNG QUAN:", font=ctk.CTkFont(weight="bold"), anchor="w").pack(fill="x", pady=(10, 5))
        summary_box = ctk.CTkTextbox(scroll, height=100)
        summary_box.pack(fill="x", pady=5)
        summary_box.insert("0.0", data["summary"])
        summary_box.configure(state="disabled") # Read-only

        # Section: Matching Skills
        ctk.CTkLabel(scroll, text="KỸ NĂNG PHÙ HỢP ✅:", font=ctk.CTkFont(weight="bold"), text_color="#2ecc71", anchor="w").pack(fill="x", pady=(15, 5))
        skills = data.get("matching_skills", [])
        skills_text = "\n".join([f"- {s}" for s in skills]) if skills else "Không tìm thấy kỹ năng phù hợp."
        
        skills_box = ctk.CTkTextbox(scroll, height=80)
        skills_box.pack(fill="x", pady=5)
        skills_box.insert("0.0", skills_text)
        skills_box.configure(state="disabled")

        # Section: Missing Skills
        ctk.CTkLabel(scroll, text="KỸ NĂNG CÒN THIẾU ⚠️:", font=ctk.CTkFont(weight="bold"), text_color="#e74c3c", anchor="w").pack(fill="x", pady=(15, 5))
        missing = data.get("missing_skills", [])
        missing_text = "\n".join([f"- {s}" for s in missing]) if missing else "Không phát hiện thiếu kỹ năng quan trọng."
        
        missing_box = ctk.CTkTextbox(scroll, height=80)
        missing_box.pack(fill="x", pady=5)
        missing_box.insert("0.0", missing_text)
        missing_box.configure(state="disabled")
        
        # Close Button
        ctk.CTkButton(toplevel, text="Đóng", command=toplevel.destroy, fg_color="gray").pack(pady=10)

    def _reset_ui(self):
        self.is_processing = False
        self.start_btn.configure(state="normal", text="BẮT ĐẦU CHẤM ĐIỂM")

if __name__ == "__main__":
    app = CVScorerApp()
    app.mainloop()
