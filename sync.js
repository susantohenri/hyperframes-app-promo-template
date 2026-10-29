import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'assets');
const scenesJsonPath = path.join(__dirname, 'scenes.json');
const scenesJsPath = path.join(__dirname, 'scenes.js');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Optional: check if --import or --from-downloads flag is passed
const args = process.argv.slice(2);
const shouldImportDownloads = args.includes('--import') || args.includes('--from-downloads');
if (shouldImportDownloads) {
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  const downloadsDir = path.join(userHome, 'Downloads');
  if (fs.existsSync(downloadsDir)) {
    console.log(`[sync] Scanning Downloads folder: ${downloadsDir}`);
    const downloadFiles = fs.readdirSync(downloadsDir);
    // Patterns for Google Flow / project assets:
    // intro_*.mp4, outro_*.mp4, [0-9]_*.jpg, [0-9].wav, etc.
    const assetPattern = /^(?:intro.*|outro.*|\d+.*)\.(mp4|webm|jpg|jpeg|png|webp|wav|mp3)$/i;
    let importedCount = 0;
    downloadFiles.forEach(f => {
      if (assetPattern.test(f)) {
        const srcPath = path.join(downloadsDir, f);
        const destPath = path.join(assetsDir, f);
        const srcStat = fs.statSync(srcPath);
        // Only import recent files (created/modified within last 24h)
        if (Date.now() - srcStat.mtimeMs < 24 * 60 * 60 * 1000) {
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`[sync] Imported asset from Downloads: ${f}`);
            importedCount++;
          }
        }
      }
    });
    if (importedCount > 0) {
      console.log(`[sync] Successfully imported ${importedCount} asset(s) to assets/ folder.`);
    }
  }
}

if (!fs.existsSync(scenesJsonPath)) {
  console.log('[sync] No scenes.json found, skipping.');
  process.exit(0);
}

const raw = fs.readFileSync(scenesJsonPath, 'utf8');
let config;
try {
  config = JSON.parse(raw);
} catch (e) {
  console.error('[sync] Error parsing scenes.json:', e);
  process.exit(1);
}

function getDuration(filePath) {
  try {
    const full = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    if (!fs.existsSync(full)) return null;
    const stdout = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      full
    ], { encoding: 'utf8' });
    const dur = parseFloat(stdout.trim());
    return isNaN(dur) ? null : dur;
  } catch (err) {
    return null;
  }
}

// Smart Asset Resolver with Google Flow suffix & wildcard support
function resolveAsset(rawSrc, sceneIndex, sceneCount, sceneType = 'image') {
  if (!fs.existsSync(assetsDir)) return rawSrc;
  const files = fs.readdirSync(assetsDir);
  if (files.length === 0) return rawSrc;

  // Helper to pick newest file
  const pickNewest = (matched) => {
    if (!matched || matched.length === 0) return null;
    if (matched.length === 1) return matched[0];
    return matched.sort((a, b) => {
      const sA = fs.statSync(path.join(assetsDir, a));
      const sB = fs.statSync(path.join(assetsDir, b));
      return sB.mtimeMs - sA.mtimeMs;
    })[0];
  };

  const base = rawSrc ? path.basename(rawSrc) : '';
  const ext = path.extname(base).toLowerCase();
  const nameOnly = path.basename(base, ext).toLowerCase();

  // 1. Direct match if file exists exactly
  if (base && fs.existsSync(path.join(assetsDir, base))) {
    return `assets/${base}`;
  }

  const isFirst = (sceneIndex === 0);
  const isLast = (sceneIndex === sceneCount - 1);

  // 2. Intro video match
  if (nameOnly.includes('intro') || (isFirst && sceneType === 'video')) {
    const introFile = pickNewest(files.filter(f => /^intro(?:[-_.].*)?\.(mp4|webm|mov|mkv)$/i.test(f)));
    if (introFile) return `assets/${introFile}`;
  }

  // 3. Outro video match
  if (nameOnly.includes('outro') || (isLast && sceneType === 'video')) {
    const outroFile = pickNewest(files.filter(f => /^outro(?:[-_.].*)?\.(mp4|webm|mov|mkv)$/i.test(f)));
    if (outroFile) return `assets/${outroFile}`;
  }

  // 4. Numbered match (e.g. 1, 2, 3...)
  let targetNum = null;
  const numMatch = nameOnly.match(/(\d+)/);
  if (numMatch) {
    targetNum = numMatch[1];
  } else {
    targetNum = String(sceneIndex + 1);
  }

  if (targetNum) {
    // Media file starting with targetNum (e.g. 2_c6a13590.jpg, 2.jpg)
    const numMediaRegex = new RegExp(`^${targetNum}(?:[-_.].*)?\\.(jpg|jpeg|png|webp|mp4|webm)$`, 'i');
    const matchedMedia = pickNewest(files.filter(f => numMediaRegex.test(f)));
    if (matchedMedia) return `assets/${matchedMedia}`;

    // Fallback: scene-N or scene_N
    const sceneNamedRegex = new RegExp(`^scene[-_]?${targetNum}(?:[-_.].*)?\\.(jpg|jpeg|png|webp|mp4|webm)$`, 'i');
    const matchedSceneNamed = pickNewest(files.filter(f => sceneNamedRegex.test(f)));
    if (matchedSceneNamed) return `assets/${matchedSceneNamed}`;
  }

  return rawSrc;
}

// Smart Audio Resolver (e.g. 1.wav, 2.wav, 1_suffix.wav)
function resolveAudio(rawAudioSrc, sceneIndex) {
  if (!fs.existsSync(assetsDir)) return rawAudioSrc;
  const files = fs.readdirSync(assetsDir);
  if (files.length === 0) return rawAudioSrc;

  const pickNewest = (matched) => {
    if (!matched || matched.length === 0) return null;
    if (matched.length === 1) return matched[0];
    return matched.sort((a, b) => {
      const sA = fs.statSync(path.join(assetsDir, a));
      const sB = fs.statSync(path.join(assetsDir, b));
      return sB.mtimeMs - sA.mtimeMs;
    })[0];
  };

  const base = rawAudioSrc ? path.basename(rawAudioSrc) : '';
  if (base && fs.existsSync(path.join(assetsDir, base))) {
    return `assets/${base}`;
  }

  let targetNum = null;
  const numMatch = base.match(/(\d+)/);
  if (numMatch) {
    targetNum = numMatch[1];
  } else {
    targetNum = String(sceneIndex + 1);
  }

  const audioRegex = new RegExp(`^${targetNum}(?:[-_.].*)?\\.(wav|mp3|m4a|aac|ogg)$`, 'i');
  const matchedAudio = pickNewest(files.filter(f => audioRegex.test(f)));
  if (matchedAudio) return `assets/${matchedAudio}`;

  return rawAudioSrc;
}

let modified = false;
let totalDuration = 0;

if (config.scenes && Array.isArray(config.scenes)) {
  const sceneCount = config.scenes.length;
  config.scenes.forEach((scene, i) => {
    let dur = parseFloat(scene.durationInSeconds) || 4.0;

    // 1. Auto-resolve Media (images / videos with suffix support)
    const originalMedia = scene.mediaSrc;
    const resolvedMedia = resolveAsset(originalMedia, i, sceneCount, scene.type);
    if (resolvedMedia && resolvedMedia !== originalMedia) {
      console.log(`[sync] Scene ${i + 1} (${scene.id}): Auto-resolved media -> ${resolvedMedia} (was ${originalMedia})`);
      scene.mediaSrc = resolvedMedia;
      modified = true;
    }

    // 2. Auto-resolve Audio (TTS wav files)
    const originalAudio = scene.audioSrc;
    const resolvedAudio = resolveAudio(originalAudio, i);
    if (resolvedAudio && resolvedAudio !== originalAudio) {
      console.log(`[sync] Scene ${i + 1} (${scene.id}): Auto-resolved audio -> ${resolvedAudio} (was ${originalAudio})`);
      scene.audioSrc = resolvedAudio;
      modified = true;
    }

    // 3. Auto-detect audio duration if audio file exists
    if (scene.audioSrc) {
      const audioDur = getDuration(scene.audioSrc);
      if (audioDur) {
        const roundedAudioDur = Math.round(audioDur * 100) / 100;
        if (scene.audioDuration !== roundedAudioDur) {
          scene.audioDuration = roundedAudioDur;
          modified = true;
        }
        // Add +0.35s natural breath padding for visual scene
        const targetDur = Math.round((audioDur + 0.35) * 10) / 10;
        if (Math.abs(targetDur - dur) > 0.05) {
          console.log(`[sync] Scene ${i + 1} (${scene.id}): Audio ${audioDur.toFixed(2)}s -> Auto duration: ${targetDur.toFixed(1)}s (was ${dur}s)`);
          dur = targetDur;
          scene.durationInSeconds = targetDur;
          modified = true;
        }
      }
    }

    totalDuration += dur;
  });
}

console.log(`[sync] Total Video Duration: ${totalDuration.toFixed(1)}s across ${config.scenes?.length || 0} scenes.`);

// Write runtime scenes.js
fs.writeFileSync(scenesJsPath, 'window.SCENES_DATA = ' + JSON.stringify(config, null, 2) + ';\n');

// Update scenes.json if paths or durations were tuned
if (modified) {
  fs.writeFileSync(scenesJsonPath, JSON.stringify(config, null, 2) + '\n');
  console.log('[sync] Updated scenes.json with auto-resolved assets & audio durations.');
}
