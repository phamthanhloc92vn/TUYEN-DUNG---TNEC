# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None
project_root = os.path.abspath('.')

# ─── Datas: kéo theo tất cả file cần thiết ───────────────────────────────────
datas = [
    # Toàn bộ thư mục ui/
    (os.path.join(project_root, 'ui'), 'ui'),
    # Toàn bộ thư mục core/
    (os.path.join(project_root, 'core'), 'core'),
    # Toàn bộ thư mục utils/
    (os.path.join(project_root, 'utils'), 'utils'),
    # config.json (cài đặt API key, URL, ...)
    (os.path.join(project_root, 'config.json'), '.'),
    # Sample files (nếu cần)
    (os.path.join(project_root, 'sample_cv.txt'), '.'),
    (os.path.join(project_root, 'sample_jd.txt'), '.'),
]

# ─── Hidden imports ────────────────────────────────────────────────────────────
hidden_imports = [
    # CustomTkinter
    'customtkinter',
    'tkinter',
    'tkinter.ttk',
    'tkinter.filedialog',
    'tkinter.messagebox',
    # OpenAI
    'openai',
    'openai.types',
    'openai.types.chat',
    # PDF
    'pdfplumber',
    'pdfplumber.page',
    'pymupdf',
    'fitz',
    # Google Sheets
    'gspread',
    'google.auth',
    'google.auth.transport',
    'google.oauth2',
    'google.oauth2.service_account',
    # Requests
    'requests',
    'requests.adapters',
    # Utilities
    'PIL',
    'PIL.Image',
    'PIL.ImageTk',
    'tiktoken',
    'tiktoken.model',
    'dotenv',
    'json',
    'threading',
    'pathlib',
    'docx2txt',
    # Core app
    'ui.main_window',
    'core.ai_client',
    'core.scorer',
    'core.config_manager',
    'utils.apps_script_caller',
    'utils.sheets_exporter',
]

a = Analysis(
    ['main.py'],
    pathex=[project_root],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib', 'numpy', 'scipy', 'sklearn',
        'IPython', 'jupyter', 'notebook', 'pytest',
        'test', '_pytest',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AICVScorer',          # Tên file .exe
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,              # Không hiện console đen
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='assets/icon.ico',   # Thêm icon nếu có
)
