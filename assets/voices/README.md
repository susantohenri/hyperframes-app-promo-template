# 🎙️ Voice Bank Publik Figur (Seed-VC References)

Direktori ini berisi file audio referensi untuk kloning karakter suara publik figur menggunakan Seed-VC.

## 📁 Format Penamaan File (Langsung & Praktis)
Cukup taruh file audio rekaman tokoh **langsung** di folder ini dengan nama sesuai profilnya:

```text
assets/voices/
├── README.md
├── jokowi.wav       <-- Langsung file WAV suara Pak Jokowi (5–15 detik)
├── najwa.wav        <-- Langsung file WAV suara Najwa Shihab (5–15 detik)
└── deddy.wav        <-- Langsung file WAV suara Deddy Corbuzier (5–15 detik)
```
*(Format yang didukung: `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`)*

---

## 🎧 Tips Audio Referensi Terbaik:
1. **Durasi**: Cukup 5 sampai 15 detik bicara santai atau pidato.
2. **Kualitas Suara**: Bersih dari background music (BGM), sound effect (SFX), atau kebisingan ruangan/gaung (*dry speech*).
3. **Format**: `.wav` (sangat direkomendasikan) atau `.mp3` (24kHz / 44.1kHz / 48kHz).
4. **Artikulasi**: Pilih potongan suara dengan pelafalan yang jelas dan wajar.

---

## 🚀 Cara Memakai di scenes.json:
Di dalam `scenes.json`, tentukan nama profil di bagian `project.audio.voiceProfile`:
```json
"audio": {
  "bgmSrc": "assets/bgm.mp3",
  "bgmVolume": 0.15,
  "voiceProfile": "jokowi"
}
```
Ketika kamu menjalankan `npm run sync`:
- Nilai `"jokowi"` -> otomatis mencari file `assets/voices/jokowi.wav`
- Nilai `"najwa"`  -> otomatis mencari file `assets/voices/najwa.wav`
- Nilai `"default"` (atau dikosongkan) -> menggunakan suara Google AI Studio TTS asli tanpa konversi.
