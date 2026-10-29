# Universal HyperFrames App Promo Template 🎬📱

Template universal untuk membuat video promosi aplikasi Android berformat vertikal 9:16 (TikTok, Instagram Reels, YouTube Shorts) berbasis **HyperFrames (HTML, CSS, GSAP)**.

Template ini didesain sebagai **Universal Player**: Anda **tidak perlu mengoding** atau menggunakan AI untuk eksekusi render. Cukup masukkan file aset ke folder `assets/`, update `scenes.json`, dan jalankan perintah render.

---

## 📁 Struktur Direktori

```text
hyperframes-app-promo-template/
├── assets/                  <-- Tempat menyimpan seluruh aset (gambar, audio, video)
│   └── .gitkeep
├── index.html               <-- Master Composition (Universal Dynamic Player)
├── scenes.json              <-- Konfigurasi data video (naskah, durasi, headline, badge)
├── scenes.js                <-- Sinkronisasi otomatis dari scenes.json (jangan diedit manual)
├── package.json             <-- Script eksekusi CLI HyperFrames
├── hyperframes.json         <-- Pengaturan paths HyperFrames
├── meta.json                <-- Metadata proyek HyperFrames
├── PROMPT_PIPELINE.md       <-- Prompt siap pakai untuk AI (Gemini / Claude / ChatGPT)
└── README.md                <-- Panduan penggunaan ini
```

---

## ⚡ Prasyarat (Prerequisites)

1. **Node.js**: Versi 18 atau lebih baru.
2. **FFmpeg**: Terpasang di sistem dan terdaftar di `PATH`.
   * Cek di terminal: `ffmpeg -version`
   * *Jika belum ada (Windows):* Install via `winget install Gyan.FFmpeg` atau download dari [ffmpeg.org](https://ffmpeg.org).

---

## 🚀 Alur Kerja Produksi Video (Workflow 5 Langkah)

### Langkah 1: Dapatkan Bahan dari AI
1. Buka file [`PROMPT_PIPELINE.md`](./PROMPT_PIPELINE.md).
2. Salin seluruh isi prompt dan kirimkan ke AI (Google Gemini, Claude, atau ChatGPT).
3. Masukkan nama aplikasi atau tautan Google Play Store Anda.
4. AI akan menghasilkan 4 bagian:
   * Naskah Voiceover & arahan TTS.
   * Prompt gambar vertikal 9:16 (Imagen / Midjourney).
   * Prompt video gerak (Veo) untuk Hook & Outro.
   * Blok kode `scenes.json`.

---

### Langkah 2: Generate Aset & Simpan di Folder `assets/`
Buat aset-aset tersebut menggunakan tool AI masing-masing, lalu simpan ke folder `assets/` dengan format penamaan yang rapi:

* **Voiceover Audio:**
  * Buka [Google AI Studio TTS](https://aistudio.google.com/) -> Generate audio per scene -> Simpan sebagai:
    * `assets/1.wav`
    * `assets/2.wav`
    * `assets/3.wav`, dst.
* **Gambar (Google Flow / Imagen / Midjourney):**
  * Generate gambar 9:16 untuk setiap scene -> Simpan sebagai:
    * `assets/1.jpg` (atau `1_[suffix].jpg`, misal `1_c6a13590.jpg`)
    * `assets/2.jpg` (atau `2_[suffix].jpg`, misal `2_c6a13590.jpg`)
    * `assets/3.jpg`, dst.
* **Video Hook & Outro (Google Flow / Google Veo / Runway):**
  * Simpan sebagai:
    * `assets/intro.mp4` (atau `intro_[suffix].mp4`, misal `intro_04077952.mp4`)
    * `assets/outro.mp4` (atau `outro_[suffix].mp4`)

> 💡 **Fitur Auto-Suffix & Auto-Import Google Flow:**
> - File hasil download dari Google Flow yang memiliki suffix acak (seperti `intro_04077952.mp4` dan `2_c6a13590.jpg`) **TIDAK PERLU DI-RENAME!** Script `sync.js` akan otomatis mencocokkan file tersebut ke timeline.
> - Anda juga bisa langsung mengimpor file aset yang baru diunduh dari folder `Downloads` dengan satu perintah:
>   ```bash
>   npm run sync:import
>   ```

---

### Langkah 3: Update `scenes.json`
Buka file `scenes.json` di template ini, lalu **ganti seluruh isinya** dengan blok JSON hasil generasi AI di Langkah 1.

Pastikan path `mediaSrc` dan `audioSrc` cocok dengan nama file yang Anda simpan di folder `assets/`.

---

### Langkah 4: Preview & Uji di Browser (Opsional tapi Disarankan)
Untuk melihat tampilan video secara langsung sebelum di-render:

```bash
npm run dev
```

* Browser akan otomatis terbuka ke `http://localhost:3002`.
* Anda dapat memutar video, menggeser scrub bar (timeline), dan memeriksa apakah teks atau gambar sudah pas.
* Tekan `Ctrl + C` di terminal untuk menghentikan server preview.

---

### Langkah 5: Render Video ke MP4 🎥
Jalankan salah satu perintah berikut di terminal:

```bash
# Render standar (cepat & seimbang)
npm run render
```

Hasil render akan langsung tersimpan di root folder dengan nama:
👉 **`output.mp4`**

Jika ingin hasil kualitas tertinggi (High Bitrate / Delivery Profile):
```bash
npm run render:hq
```
Hasilnya akan tersimpan dengan nama **`output_hq.mp4`**.

---

## 🛠️ Ringkasan Command (Cheat Sheet)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan studio preview interaktif di browser. |
| `npm run render` | Merender komposisi menjadi file `output.mp4`. |
| `npm run render:hq` | Merender kualitas tertinggi (CRF rendah) ke `output_hq.mp4`. |
| `npm run check` | Memeriksa linting, kontras teks, layout overflow, dan sinkronisasi audio. |
| `npm run snapshot` | Mengambil cuplikan frame PNG pada detik ke-1, 3, dan 5 ke folder `preview_snapshots/`. |

---

## 📦 Cara Menggunakan untuk Aplikasi Baru (Setup Git Repo)

Folder ini berfungsi sebagai **Master Template**. Jangan mengubah master template ini untuk proyek permanen.

Setiap kali ingin membuat video untuk aplikasi Android baru:

### Opsi A: Duplikasi Folder Lokal
1. Copy folder `hyperframes-app-promo-template` menjadi `promo-[nama-aplikasi]`.
2. Masukkan aset baru ke `assets/` dan timpa `scenes.json`.
3. Buka terminal di folder baru tersebut, lalu jalankan `npm run render`.

### Opsi B: Simpan sebagai GitHub Template Repository
1. Buka terminal di folder ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: universal hyperframes app promo template"
   ```
2. Buat repository baru di GitHub (misal: `hyperframes-app-promo-template`).
3. Centang opsi **"Template repository"** di Settings GitHub.
4. Setiap ada proyek baru, Anda cukup klik tombol **"Use this template"** di GitHub!

---

## 💡 Tips & Troubleshooting

1. **Error "FFmpeg not found":**
   Pastikan FFmpeg sudah terinstal dan bisa dipanggil dari PowerShell/CMD (`ffmpeg -version`). Jika baru diinstall, restart terminal atau VS Code Anda.
2. **Teks terpotong / tertutup gambar:**
   Template sudah dilengkapi *gradient overlay* gelap di bagian bawah agar teks selalu terbaca kontras di atas gambar apa pun.
3. **Format Rasio:**
   Format default adalah vertikal **1080 x 1920 (9:16)**, sudah dioptimalkan untuk ukuran layar smartphone standar saat scrolling feed TikTok / Reels.
