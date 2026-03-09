import imaplib
import email
import os
import re
from email.header import decode_header

class EmailHandler:
    def __init__(self):
        self.imap_server = "imap.gmail.com"

    def fetch_emails_and_download(self, username, password, keyword, save_dir):
        """
        Connects to Gmail, searches for emails with keyword in Subject,
        and downloads PDF/DOCX attachments.
        Returns: (success: bool, message: str, file_count: int)
        """
        try:
            # Create download directory if not exists
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)

            # Connect to GMAIL
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(username, password)
            mail.select("inbox")

            # Search emails
            # Search for emails where Subject contains keyword
            # Note: Gmail search might be case-insensitive, but depend on server
            status, messages = mail.search(None, f'(SUBJECT "{keyword}")')
            
            if status != "OK":
                return False, "Không tìm thấy email nào hoặc lỗi tìm kiếm.", 0

            email_ids = messages[0].split()
            if not email_ids:
                return True, f"Không tìm thấy email nào có tiêu đề chứa: '{keyword}'", 0

            downloaded_count = 0
            
            # Process emails (newest first)
            for e_id in reversed(email_ids):
                status, msg_data = mail.fetch(e_id, "(RFC822)")
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        subject = self._decode_subject(msg["Subject"])
                        
                        # Process attachments
                        if msg.get_content_maintype() != 'multipart':
                            continue

                        for part in msg.walk():
                            if part.get_content_maintype() == 'multipart' or part.get('Content-Disposition') is None:
                                continue

                            filename = part.get_filename()
                            if filename:
                                filename = self._decode_subject(filename)
                                ext = filename.lower().split('.')[-1]
                                
                                # Filter extensions
                                if ext in ['pdf', 'docx', 'doc']:
                                    # Create safe filename with Applicant Name if possible? 
                                    # For now, just prepend Subject or distinct ID to avoid overwrite
                                    safe_filename = f"{subject}_{filename}"
                                    safe_filename = re.sub(r'[\\/*?:"<>|]', "", safe_filename) # Sanitize
                                    
                                    filepath = os.path.join(save_dir, safe_filename)
                                    
                                    with open(filepath, "wb") as f:
                                        f.write(part.get_payload(decode=True))
                                    downloaded_count += 1
            
            mail.close()
            mail.logout()
            
            if downloaded_count == 0:
                return True, "Tìm thấy email nhưng không có file CV (.pdf, .docx).", 0
                
            return True, f"Đã tải thành công {downloaded_count} CV từ Email.", downloaded_count

        except imaplib.IMAP4.error as e:
            return False, f"Lỗi đăng nhập: {str(e)}\nKiểm tra lại Email/App Password.", 0
        except Exception as e:
            return False, f"Lỗi hệ thống Email: {str(e)}", 0

    def _decode_subject(self, encoded_subject):
        decoded_list = decode_header(encoded_subject)
        decoded_text = ""
        for text, encoding in decoded_list:
            if isinstance(text, bytes):
                if encoding:
                    try:
                        decoded_text += text.decode(encoding)
                    except:
                        decoded_text += text.decode('utf-8', errors='ignore')
                else:
                    decoded_text += text.decode('utf-8', errors='ignore')
            else:
                decoded_text += str(text)
        return decoded_text
