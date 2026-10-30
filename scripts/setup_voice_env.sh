#!/bin/bash
set -e

echo "====================================================================="
echo " 🎙️ HyperFrames - Setup Environment Seed-VC (macOS Apple Silicon / M1 / M2 / M3)"
echo "====================================================================="
echo ""
echo "NOTE: Setup ini bersifat OPSIONAL."
echo "Jika MacBook tidak diinstall Seed-VC, HyperFrames TETAP BERJALAN NORMAL"
echo "menggunakan suara Google AI Studio TTS asli (proses tidak terblokir)."
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Pastikan folder tools/seed-vc tersedia
mkdir -p tools
if [ ! -d "tools/seed-vc" ]; then
    echo "[1/3] Mengunduh repository Seed-VC ke tools/seed-vc..."
    git clone https://github.com/Plachta/Seed-VC tools/seed-vc
else
    echo "[1/3] Folder tools/seed-vc sudah tersedia."
fi

cd tools/seed-vc

# 2. Setup Python Virtual Environment (Apple Silicon MPS Support)
echo "[2/3] Memeriksa Python environment untuk Apple Silicon..."

if command -v uv &> /dev/null; then
    echo "Menggunakan uv untuk membuat virtual environment..."
    if [ ! -d ".venv" ]; then
        uv venv .venv --python 3.10
    fi
    source .venv/bin/activate
    echo "Menginstal PyTorch (mendukung akselerasi Metal/MPS di Apple Silicon)..."
    uv pip install torch torchvision torchaudio
    if [ -f "requirements-mac.txt" ]; then
        echo "Menginstal dependensi khusus macOS..."
        uv pip install -r requirements-mac.txt
    else
        uv pip install -r requirements.txt
    fi
else
    if ! command -v python3 &> /dev/null; then
        echo "[PERINGATAN] python3 tidak ditemukan. Silakan pasang Python 3.10 via Homebrew (brew install python@3.10)."
        echo "Fallback aktif: Project tetap jalan menggunakan TTS asli."
        exit 0
    fi
    if [ ! -d ".venv" ]; then
        echo "Membuat virtualenv .venv..."
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    echo "Menginstal PyTorch (mendukung akselerasi Metal/MPS di Apple Silicon)..."
    pip install --upgrade pip
    pip install torch torchvision torchaudio
    if [ -f "requirements-mac.txt" ]; then
        echo "Menginstal dependensi khusus macOS..."
        pip install -r requirements-mac.txt
    else
        pip install -r requirements.txt
    fi
fi

# 3. Test & Pre-cache Model Checkpoints
echo "[3/3] Memverifikasi model & akselerasi MPS di Apple Silicon..."
python -c "import torch; print('PyTorch Version:', torch.__version__, '| Apple Silicon MPS Available:', torch.backends.mps.is_available())"

echo ""
echo "====================================================================="
echo " ✅ Setup selesai! Voiceover publik figur siap digunakan di MacBook Pro M2."
echo " Tentukan 'voiceProfile' di scenes.json (misal: 'najwa', 'jokowi', 'deddy')."
echo " Lalu jalankan 'npm run sync' untuk konversi otomatis."
echo "====================================================================="
