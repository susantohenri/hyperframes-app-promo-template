import os
import sys
import argparse
import glob
import time

# Ensure UTF-8 output encoding across Windows/macOS/Linux
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def find_seed_vc_dir(project_root):
    env_path = os.environ.get("SEED_VC_PATH")
    if env_path and os.path.exists(env_path):
        return os.path.abspath(env_path)

    candidates = [
        os.path.join(project_root, "tools", "seed-vc"),
        os.path.join(project_root, "..", "..", "seed-vc"),
        os.path.join(project_root, "..", "seed-vc")
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, "seed_vc_wrapper.py")):
            return os.path.abspath(c)
    return None

def find_ref_audio(voices_base, voice_name):
    # 1. Langsung cari file audio: assets/voices/jokowi.wav, jokowi.mp3, dst.
    for ext in ["wav", "mp3", "m4a", "flac", "ogg"]:
        direct_file = os.path.join(voices_base, f"{voice_name}.{ext}")
        if os.path.exists(direct_file):
            return direct_file

    # 2. Fallback jika ditaruh di dalam subfolder: assets/voices/jokowi/ref.wav
    voice_dir = os.path.join(voices_base, voice_name)
    if os.path.exists(voice_dir) and os.path.isdir(voice_dir):
        for ext in ["wav", "mp3", "m4a", "flac", "ogg"]:
            specific = os.path.join(voice_dir, f"ref.{ext}")
            if os.path.exists(specific):
                return specific
        for file in os.listdir(voice_dir):
            if file.lower().endswith((".wav", ".mp3", ".m4a", ".flac", ".ogg")):
                return os.path.join(voice_dir, file)

    return None

def main():
    parser = argparse.ArgumentParser(description="Batch Seed-VC Voice Conversion for HyperFrames scenes")
    parser.add_argument("--voice", type=str, required=True, help="Voice profile name (e.g. jokowi, najwa)")
    parser.add_argument("--assets-dir", type=str, default="assets", help="Directory containing scene audios")
    parser.add_argument("--diffusion-steps", type=int, default=10, help="Diffusion steps (10-25)")
    parser.add_argument("--f0-condition", action="store_true", help="Use F0 pitch conditioning")
    parser.add_argument("--pitch-shift", type=int, default=0, help="Pitch shift semitones")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    assets_dir = os.path.abspath(args.assets_dir) if os.path.isabs(args.assets_dir) else os.path.join(project_root, args.assets_dir)
    voices_base = os.path.join(assets_dir, "voices")

    if args.voice.lower() in ["default", "none", "original", ""]:
        print(f"[voice-vc] Profile '{args.voice}' dipilih. Melewati konversi suara (tetap pakai audio TTS asli).")
        return 0

    ref_audio = find_ref_audio(voices_base, args.voice)
    if not ref_audio:
        expected_wav = os.path.join(voices_base, f"{args.voice}.wav")
        print(f"[voice-vc] ⚠️ Peringatan: Audio referensi untuk profil '{args.voice}' tidak ditemukan!")
        print(f"[voice-vc] ℹ️ Cukup taruh file audio tokoh: {expected_wav}")
        print(f"[voice-vc] ℹ️ Melewati konversi (menggunakan audio TTS asli tanpa blokir produksi).")
        return 0

    seed_vc_dir = find_seed_vc_dir(project_root)
    if not seed_vc_dir:
        print(f"[voice-vc] ⚠️ Peringatan: Seed-VC tidak ditemukan di tools/seed-vc maupun SEED_VC_PATH.")
        print(f"[voice-vc] ℹ️ Fallback aktif: Menggunakan audio TTS asli tanpa konversi. Produksi tidak terblokir!")
        return 0

    print(f"[voice-vc] ===================================================")
    print(f"[voice-vc] 🎙️ Memulai Konversi Suara Seed-VC")
    print(f"[voice-vc] Engine: {seed_vc_dir}")
    print(f"[voice-vc] Profil Tokoh: {args.voice}")
    print(f"[voice-vc] Audio Referensi: {os.path.basename(ref_audio)}")
    print(f"[voice-vc] ===================================================")

    # Find scene audio files to convert
    # Prefer raw_1.wav, raw_2.wav ... if not present, check 1.wav, 2.wav ...
    scene_files = []
    i = 1
    while True:
        raw_path = os.path.join(assets_dir, f"raw_{i}.wav")
        standard_path = os.path.join(assets_dir, f"{i}.wav")
        if os.path.exists(raw_path):
            scene_files.append((i, raw_path, standard_path))
        elif os.path.exists(standard_path):
            scene_files.append((i, standard_path, standard_path))
        else:
            break
        i += 1

    if not scene_files:
        print("[voice-vc] Tidak ditemukan file audio scene (1.wav atau raw_1.wav) di assets/. Melewati.")
        return 0

    print(f"[voice-vc] Ditemukan {len(scene_files)} scene audio untuk dikonversi.")

    # Setup import path and load SeedVCWrapper
    original_cwd = os.getcwd()
    try:
        sys.path.insert(0, seed_vc_dir)
        os.chdir(seed_vc_dir)

        # Pastikan HuggingFace menggunakan folder checkpoints/hf_cache lokal bawaan Seed-VC
        # agar tidak mengunduh ulang model yang sudah ada (seperti Whisper 967MB & BigVGAN)
        hf_cache_dir = os.path.abspath(os.path.join(seed_vc_dir, "checkpoints", "hf_cache"))
        os.environ['HF_HOME'] = hf_cache_dir
        os.environ['HF_HUB_CACHE'] = hf_cache_dir

        import torch
        import torchaudio
        from seed_vc_wrapper import SeedVCWrapper

        t0 = time.time()
        print(f"[voice-vc] Memuat model Seed-VC ke VRAM/RAM...")
        wrapper = SeedVCWrapper()
        print(f"[voice-vc] Model berhasil dimuat dalam {time.time() - t0:.1f}s (Device: {wrapper.device})")

        for scene_num, src_path, dest_path in scene_files:
            print(f"[voice-vc] Mengonversi Scene {scene_num}: {os.path.basename(src_path)} -> {os.path.basename(dest_path)}...")
            st = time.time()
            gen = wrapper.convert_voice(
                source=src_path,
                target=ref_audio,
                diffusion_steps=args.diffusion_steps,
                length_adjust=1.0,
                inference_cfg_rate=0.7,
                f0_condition=args.f0_condition,
                auto_f0_adjust=True,
                pitch_shift=args.pitch_shift,
                stream_output=False
            )
            output_wave = None
            if hasattr(gen, '__next__'):
                try:
                    while True:
                        output_wave = next(gen)
                except StopIteration as e:
                    if e.value is not None:
                        output_wave = e.value
            else:
                output_wave = gen

            if isinstance(output_wave, tuple):
                output_wave = output_wave[1]

            # Save converted audio
            wave_tensor = torch.tensor(output_wave)[None, :].float()
            torchaudio.save(dest_path, wave_tensor.cpu(), wrapper.sr)
            print(f"  ✅ Scene {scene_num} selesai ({time.time() - st:.1f}s)")

        print(f"[voice-vc] ✨ Semua {len(scene_files)} scene berhasil dikonversi ke suara '{args.voice}'!")
    except Exception as e:
        print(f"[voice-vc] ❌ Terjadi error saat konversi Seed-VC: {e}")
        print(f"[voice-vc] ℹ️ Fallback aktif: Tetap menggunakan audio TTS asli.")
        return 0
    finally:
        os.chdir(original_cwd)

    return 0

if __name__ == "__main__":
    sys.exit(main())
