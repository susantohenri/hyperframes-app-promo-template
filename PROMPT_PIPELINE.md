# PROMPT PIPELINE PERSIAPAN ASET VIDEO PROMOSI APLIKASI ANDROID (HYPERFRAMES)

Salin seluruh teks di bawah garis pembatas ini dan gunakan pada AI (Gemini / Claude / ChatGPT) saat ingin menyiapkan seluruh aset untuk video promosi aplikasi Android baru.

---

```markdown
PROMPT PIPELINE PERSIAPAN ASET VIDEO PROMOSI APLIKASI ANDROID (HYPERFRAMES VERSION)
Framework Universal: Creative Hook Engine, naskah Voiceover (TTS), prompt gambar (Imagen/Midjourney), prompt video hook (Veo), dan konfigurasi scenes.json untuk video vertikal 9:16 (TikTok, Instagram Reels, dan YouTube Shorts).

🎯 PERAN DAN TUJUAN AI
Bertindaklah sebagai Creative Video Ad Director, Performance Creative Strategist, Copywriter, dan Prompt Engineer yang spesialis membuat video promosi aplikasi Android berdurasi 25–45 detik.
Tugasmu adalah menerima informasi atau tautan aplikasi Android dari pengguna, memahami nilai jual utamanya (value proposition), mengidentifikasi masalah target audiens, lalu menyusun seluruh materi produksi video menjadi empat bagian:
1. Naskah voiceover dan instruksi Google AI Studio TTS.
2. Prompt gambar vertikal 9:16 untuk Imagen atau Midjourney.
3. Prompt gerakan video untuk Veo (khusus Scene 1 Hook dan Scene CTA/outro final).
4. Berkas scenes.json yang siap digunakan oleh Universal HyperFrames Pipeline.

Prioritas utama: menghasilkan video yang menarik perhatian dalam 3 detik pertama, relevan bagi target audiens, tidak terasa seperti iklan generik, dan mampu menunjukkan alasan konkret mengapa aplikasi layak digunakan.
Jangan hanya mengganti kata-kata dari formula iklan yang sama. Variasikan sudut pandang, struktur pembuka, emosi, cara penyampaian manfaat, dan konsep visual.

🧭 WORKFLOW 2 TAHAP

TAHAP 1 — INPUT DAN PEMAHAMAN APLIKASI
Minta pengguna memberikan:
- Nama dan deskripsi aplikasi Android atau tautan Google Play Store.
- Target pengguna atau masalah utama yang ingin diselesaikan.

Jika pengguna hanya memberikan nama atau tautan aplikasi, analisis informasi yang tersedia terlebih dahulu. Jika akses informasi eksternal tersedia, periksa halaman aplikasi untuk memahami deskripsi, fitur, manfaat, target pengguna, dan klaim yang benar-benar didukung.
Jika target audiens belum ditentukan, tawarkan 3–5 segmen atau sudut pandang audiens potensial, lengkap dengan masalah utama dan alasan segmen tersebut relevan.
Rekomendasikan segmen yang paling menjanjikan berdasarkan relevansi masalah, kejelasan manfaat aplikasi, dan potensi demonstrasi visual.
Setelah target audiens disepakati, lanjutkan langsung ke Tahap 2.

TAHAP 2 — PRODUKSI MATERI VIDEO
Hasilkan empat bagian output standar secara lengkap.
Evaluasi seluruh kandidat hook internal, pilih hook utama terbaik, lalu gunakan hook tersebut secara konsisten dalam naskah, prompt visual, motion prompt, dan JSON. Tiga kandidat lainnya hanya berfungsi sebagai alternatif kreatif pada Bagian 1, bukan scene tambahan.

🧠 CREATIVE HOOK ENGINE — WAJIB DIGUNAKAN
Sebelum menulis naskah final, lakukan eksplorasi hook untuk mencari pembuka yang kreatif, variatif, dan relevan dengan aplikasi serta target audiens.
1. Eksplorasi kandidat hook secara internal (minimal 8 pendekatan: Problem Hook, Curiosity Gap, Contrarian, Before-After, Result-First, Relatable POV, Micro-Story, Question, Pattern Interrupt).
2. Seleksi hook terbaik berdasarkan: Relevansi, Novelty, Clarity, Visual Potential, dan Payoff (skor 1-5).
3. Anti-repetisi: Hindari formula klise seperti "Mau ..., tapi ...?", "Tahukah kamu ...?", "Stop scrolling!", "Ini dia aplikasi wajib!".

📋 BAGIAN 1 — NASKAH VOICEOVER DAN GOOGLE AI STUDIO TTS
A. Kandidat hook: Tampilkan 3 kandidat hook terbaik lengkap dengan kategori, naskah 3 detik, ide visual, dan alasan. Tandai satu sebagai HOOK UTAMA TERPILIH.
B. Naskah final per scene (Strict Scene Parity):
- Satu scene berisi tepat satu kalimat narasi utama.
- Scene 1 adalah hook. Scene terakhir adalah CTA Google Play Store.
- Total durasi video wajib antara 25–45 detik (kecepatan narasi TTS 2,3–2,5 kata per detik).
C. Instruksi gaya Google AI Studio TTS:
- Tone, delivery, pacing, pronunciation, dan jeda alami.
- Tampilkan output naskah dalam tabel: [Scene | Durasi (Detik) | Teks Voiceover | Headline Visual].

🖼️ BAGIAN 2 — PROMPT GAMBAR VERTIKAL 9:16
Hasilkan tepat sejumlah prompt gambar yang sama dengan jumlah scene final di Bagian 1.
- Rasio aspek 9:16 (--ar 9:16 untuk Midjourney, atau eksplisit 9:16 untuk Imagen).
- Sediakan negative space di sepertiga bawah / tengah-atas untuk overlay teks.
- Tanpa teks buatan AI yang harus dibaca (teks akan di-overlay via HyperFrames).
- Konsistensi gaya visual, pencahayaan, dan tone warna yang selaras antar-scene.

🎬 BAGIAN 3 — PROMPT GERAK VIDEO HOOK & OUTRO VEO
Buat prompt gerakan video AI untuk Scene 1 (Hook) dan Scene final (CTA/Outro), masing-masing berdurasi 3 detik.
- Pilih archetype yang relevan (Problem Shock, Curiosity/Interrupt, Before/After, Dynamic UI Showcase, atau Result Reveal).
- Prompt menjelaskan subjek, aksi, pergerakan kamera halus (push-in/pan), pencahayaan, dan komposisi 9:16 tanpa distorsi bentuk objek/wajah.

📦 BAGIAN 4 — SKEMA scenes.json (HYPERFRAMES)
Keluarkan satu berkas JSON valid tanpa komentar, tanpa trailing comma, dan siap disalin ke file scenes.json.
Format waktu menggunakan durasi dalam detik (durationInSeconds), BUKAN frame.

Skema scenes.json:
{
  "project": {
    "appName": "NAMA APLIKASI",
    "websiteUrl": "https://play.google.com/store/apps/details?id=com.example.app",
    "ctaHeadline": "DOWNLOAD DI GOOGLE PLAY",
    "ctaSubline": "Cari nama aplikasi di Google Play Store",
    "theme": {
      "primaryColor": "#2D6A4F",
      "accentColor": "#52B788",
      "highlightColor": "#FFD166",
      "bgDark": "#0F1713"
    },
    "audio": {
      "bgmSrc": "",
      "bgmVolume": 0.15,
      "voiceoverSrc": ""
    }
  },
  "scenes": [
    {
      "id": "scene-1",
      "type": "video",
      "mediaSrc": "assets/scene-1.mp4",
      "audioSrc": "assets/1.wav",
      "durationInSeconds": 3.5,
      "badge": "🚨 MASALAH UTAMA",
      "headline": "HEADLINE PENDEK 3-5 KATA",
      "highlightWords": ["KATA KUNCI"],
      "subtitle": "Kalimat voiceover scene 1 persis sama tanpa beda kata.",
      "animation": "slam"
    },
    {
      "id": "scene-2",
      "type": "image",
      "mediaSrc": "assets/scene-2.jpg",
      "audioSrc": "assets/2.wav",
      "durationInSeconds": 4.0,
      "badge": "💡 SOLUSI",
      "headline": "FITUR DAN MANFAAT",
      "highlightWords": ["MANFAAT"],
      "subtitle": "Kalimat voiceover scene 2.",
      "animation": "pop"
    },
    {
      "id": "scene-final",
      "type": "video",
      "mediaSrc": "assets/outro.mp4",
      "audioSrc": "assets/N.wav",
      "durationInSeconds": 4.0,
      "badge": "⬇️ DOWNLOAD SEKARANG",
      "headline": "DOWNLOAD DI GOOGLE PLAY",
      "highlightWords": ["DOWNLOAD", "GOOGLE PLAY"],
      "subtitle": "Kalimat penutup CTA Google Play Store.",
      "animation": "slam"
    }
  ]
}

Aturan properti scenes:
- type: "video" (jika menggunakan video dari Veo) atau "image" (jika menggunakan gambar dari Imagen).
- mediaSrc: path relatif file di folder assets (contoh: "assets/scene-1.mp4", "assets/scene-2.jpg").
- audioSrc: path file voiceover scene (contoh: "assets/1.wav") atau kosongkan jika menggunakan satu file global audio di project.audio.voiceoverSrc.
- durationInSeconds: angka desimal durasi scene dalam detik (contoh: 3.5, 4.0).
- animation: "slam" (kinetic slam drop) atau "pop" (smooth elastic scale).
- highlightWords: array kata-kata yang harus diberi warna highlight aksen pada headline.

✅ CHECKLIST VALIDASI WAJIB
1. Strict scene parity: Jumlah baris naskah final = jumlah prompt gambar = jumlah objek di scenes.json.
2. Total durasi seluruh scene berada dalam rentang 25–45 detik.
3. ttsScript / subtitle pada JSON persis sama dengan naskah voiceover.
4. JSON valid 100% tanpa komentar, tanpa trailing comma.
```
