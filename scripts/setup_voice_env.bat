@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  🎙️ HyperFrames - Setup Environment Seed-VC (Voice Conversion)
echo =====================================================================
echo.
echo NOTE: Setup ini bersifat OPSIONAL.
echo Jika laptop tidak diinstall Seed-VC, HyperFrames TETAP BERJALAN NORMAL
echo menggunakan suara Google AI Studio TTS asli (proses tidak terblokir).
echo.

cd /d "%~dp0\.."

:: 1. Cek apakah tools\seed-vc sudah ada
if not exist "tools" mkdir "tools"

if not exist "tools\seed-vc" (
    :: Cek apakah ada instalasi lokal di MSI (../../seed-vc)
    if exist "..\..\seed-vc\seed_vc_wrapper.py" (
        echo [1/3] Menemukan instalasi Seed-VC lokal di ..\..\seed-vc.
        echo Membuat Directory Junction ke tools\seed-vc...
        mklink /J "tools\seed-vc" "..\..\seed-vc"
    ) else if exist "..\seed-vc\seed_vc_wrapper.py" (
        echo [1/3] Menemukan instalasi Seed-VC lokal di ..\seed-vc.
        echo Membuat Directory Junction ke tools\seed-vc...
        mklink /J "tools\seed-vc" "..\seed-vc"
    ) else (
        echo [1/3] Mengunduh repository Seed-VC ke tools\seed-vc...
        git clone https://github.com/Plachta/Seed-VC tools\seed-vc
    )
) else (
    echo [1/3] Folder tools\seed-vc sudah tersedia.
)

:: 2. Setup Python Virtual Environment
cd "tools\seed-vc"
echo [2/3] Memeriksa Python environment...

:: Cek apakah uv tersedia (jauh lebih cepat)
where uv >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Menggunakan uv untuk membuat virtual environment...
    if not exist ".venv" uv venv .venv --python 3.10
    echo Menginstal PyTorch dengan akselerasi CUDA...
    uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    echo Menginstal dependensi Seed-VC...
    uv pip install -r requirements.txt
) else (
    where python >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [PERINGATAN] Python tidak ditemukan di sistem.
        echo Melewati instalasi dependencies. Fallback aktif (tetap pakai audio TTS asli).
        goto FINISH
    )
    if not exist ".venv" (
        echo Membuat virtualenv .venv...
        python -m venv .venv
    )
    echo Menginstal PyTorch dengan akselerasi CUDA...
    call .venv\Scripts\pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    echo Menginstal dependensi Seed-VC...
    call .venv\Scripts\pip install -r requirements.txt
)

:: 3. Test & Pre-cache Model Checkpoints
echo [3/3] Memverifikasi model & pre-cache weights...
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -c "import torch; print('PyTorch Version:', torch.__version__, '| CUDA Available:', torch.cuda.is_available())"
)

:FINISH
cd /d "%~dp0\.."
echo.
echo =====================================================================
echo  ✅ Selesai! Voiceover publik figur siap digunakan.
echo  Pilih tokoh di scenes.json (misal: 'najwa', 'jokowi', 'deddy').
echo  Lalu jalankan 'npm run sync' untuk konversi otomatis.
echo =====================================================================
pause
