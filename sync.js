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

// Function to sort Google AI Studio TTS files by createdAt down to second/millisecond precision
function processGoogleAiStudioTTS(searchDir, destDir) {
  if (!fs.existsSync(searchDir)) return false;
  const files = fs.readdirSync(searchDir);
  const ttsFiles = files.filter(f => /^Generated Audio.*\.(wav|mp3|ogg|m4a)$/i.test(f));
  if (ttsFiles.length === 0) return false;

  const recentTTS = ttsFiles.map(f => {
    const fullPath = path.join(searchDir, f);
    const stat = fs.statSync(fullPath);
    const createdTime = stat.birthtimeMs || stat.mtimeMs;
    return { name: f, fullPath, stat, createdTime };
  }).filter(item => Date.now() - item.createdTime < 24 * 60 * 60 * 1000);

  if (recentTTS.length === 0) return false;

  // Sort ascending by creation time: earliest generated = Scene 1, latest = Scene N
  recentTTS.sort((a, b) => a.createdTime - b.createdTime);

  console.log(`[sync] Menemukan ${recentTTS.length} audio Google AI Studio TTS (diurutkan otomatis dari detik unduhan):`);
  recentTTS.forEach((item, index) => {
    const sceneNum = index + 1;
    const destName = `${sceneNum}.wav`;
    const destPath = path.join(destDir, destName);
    const timeStr = new Date(item.createdTime).toLocaleTimeString();
    
    fs.copyFileSync(item.fullPath, destPath);
    console.log(`  🎵 Scene ${sceneNum} -> assets/${destName} (Diunduh: ${timeStr} | File: "${item.name}")`);
  });

  return true;
}

// 1. Check if there are Generated Audio files already dropped in assets/
processGoogleAiStudioTTS(assetsDir, assetsDir);

// 2. Optional: check if --import or --from-downloads flag is passed
const args = process.argv.slice(2);
const shouldImportDownloads = args.includes('--import') || args.includes('--from-downloads');
if (shouldImportDownloads) {
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  const downloadsDir = path.join(userHome, 'Downloads');
  if (fs.existsSync(downloadsDir)) {
    console.log(`[sync] Scanning Downloads folder: ${downloadsDir}`);
    // Auto process Google AI Studio TTS directly from Downloads
    processGoogleAiStudioTTS(downloadsDir, assetsDir);

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

// Smart SFX Resolver supporting all 21 HyperFrames built-in sound effects
const sfxDir = path.join(assetsDir, 'sfx');
const sfxManifestPath = path.join(sfxDir, 'manifest.json');
let sfxManifest = {};
if (fs.existsSync(sfxManifestPath)) {
  try {
    sfxManifest = JSON.parse(fs.readFileSync(sfxManifestPath, 'utf8'));
  } catch (e) {
    console.error('[sync] Error loading sfx manifest:', e);
  }
}

// Map aliases / intuitive names to exact manifest keys
const sfxAliases = {
  'impact': 'impact-bass-1',
  'slam': 'impact-bass-1',
  'bass-hit': 'impact-bass-1',
  'hit': 'impact-bass-1',
  'heavy-impact': 'impact-bass-2',
  'swoosh': 'whoosh',
  'swipe': 'whoosh-short',
  'fast-whoosh': 'whoosh-short',
  'cinematic-whoosh': 'whoosh-cinematic',
  'ui-click': 'click',
  'tap': 'click-soft',
  'button': 'click',
  'ui-notification': 'notification',
  'alert': 'notification',
  'toast': 'notification',
  'badge': 'pop',
  'shimmer': 'sparkle',
  'magic': 'sparkle',
  'keyboard': 'typing',
  'type': 'typing',
  'confirm': 'chime',
  'success': 'chime',
  'fail': 'error',
  'wrong': 'error',
  'buildup': 'riser',
  'build-up': 'riser'
};

function resolveSFX(sfxItem) {
  if (!sfxItem) return null;
  const rawCue = (sfxItem.cue || '').trim().toLowerCase();
  const rawSrc = (sfxItem.assetSrc || '').trim();

  // 1. Try rawSrc basename if present
  let candidateKey = '';
  if (rawSrc) {
    const base = path.basename(rawSrc);
    candidateKey = base.replace(/\.(mp3|wav|ogg|aac|m4a)$/i, '').toLowerCase();
  }
  if (!candidateKey && rawCue) {
    candidateKey = rawCue;
  }

  // 2. Check alias
  const manifestKey = sfxAliases[candidateKey] || candidateKey;

  // 3. Match against manifest
  if (sfxManifest[manifestKey]) {
    const info = sfxManifest[manifestKey];
    return {
      file: `assets/sfx/${info.file}`,
      duration: info.duration,
      cue: manifestKey
    };
  }

  // 4. Fallback: check if exact file exists in assets/sfx or assets/
  if (rawSrc && fs.existsSync(path.join(__dirname, rawSrc))) {
    return {
      file: rawSrc,
      duration: sfxItem.duration || 1.0,
      cue: rawCue || candidateKey
    };
  }

  return null;
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

    // 4. Auto-resolve and normalize SFX (Sound Design)
    if (Array.isArray(scene.soundDesign)) {
      scene.soundDesign.forEach((sfx, sfxIdx) => {
        const resolved = resolveSFX(sfx);
        if (resolved) {
          if (sfx.assetSrc !== resolved.file) {
            console.log(`[sync] Scene ${i + 1} (${scene.id}): Auto-resolved SFX -> ${resolved.file} (was ${sfx.assetSrc || sfx.cue})`);
            sfx.assetSrc = resolved.file;
            modified = true;
          }
          if (!sfx.duration || Math.abs(parseFloat(sfx.duration) - resolved.duration) > 0.05) {
            sfx.duration = resolved.duration;
            modified = true;
          }
          if (sfx.volume === undefined) {
            sfx.volume = 0.45;
            modified = true;
          }
          if (sfx.at === undefined) {
            sfx.at = 0;
            modified = true;
          }
        }
      });
    }

    totalDuration += dur;
  });
}

console.log(`[sync] Total Video Duration: ${totalDuration.toFixed(1)}s across ${config.scenes?.length || 0} scenes.`);

// 4. Stamp static audio & SFX elements into index.html for HyperFrames compiler & render
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  let currentStart = 0;
  let audioElementsHtml = '';

  config.scenes.forEach((scene, i) => {
    const start = currentStart;
    const dur = parseFloat(scene.durationInSeconds) || 4.0;
    const sceneId = `scene-${i + 1}`;

    // 1. Voiceover Audio
    if (scene.audioSrc && fs.existsSync(path.join(__dirname, scene.audioSrc))) {
      const exactAudioDur = parseFloat(scene.audioDuration) || dur;
      audioElementsHtml += `\n        <audio id="${sceneId}-audio-vo" src="${scene.audioSrc}" data-start="${start.toFixed(2)}" data-duration="${exactAudioDur.toFixed(2)}" data-volume="1.0" data-track-index="1"></audio>`;
    }

    // 2. Sound Design (SFX)
    if (Array.isArray(scene.soundDesign)) {
      scene.soundDesign.forEach((sfx, sfxIdx) => {
        if (sfx.assetSrc && fs.existsSync(path.join(__dirname, sfx.assetSrc))) {
          const sfxStart = start + (parseFloat(sfx.at) || 0);
          const sfxDur = sfx.duration ? ` data-duration="${parseFloat(sfx.duration).toFixed(2)}"` : '';
          const sfxVol = sfx.volume !== undefined ? ` data-volume="${parseFloat(sfx.volume)}"` : '';
          audioElementsHtml += `\n        <audio id="${sceneId}-sfx-${sfxIdx + 1}" src="${sfx.assetSrc}" data-start="${sfxStart.toFixed(2)}"${sfxDur}${sfxVol} data-track-index="2"></audio>`;
        }
      });
    }

    currentStart += dur;
  });

  // 3. Background Music (BGM)
  if (config.project?.audio?.bgmSrc && fs.existsSync(path.join(__dirname, config.project.audio.bgmSrc))) {
    const bgmVol = config.project.audio.bgmVolume || 0.15;
    audioElementsHtml += `\n        <audio id="bgm-audio" src="${config.project.audio.bgmSrc}" data-start="0.00" data-duration="${currentStart.toFixed(2)}" data-volume="${bgmVol}" data-track-index="0"></audio>`;
  }

  if (audioElementsHtml) {
    audioElementsHtml += '\n      ';
  }

  const audioWrapperRegex = /(<div\b[^>]*\bid="audio-wrapper"[^>]*>)([\s\S]*?)(<\/div>)/i;
  if (audioWrapperRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(audioWrapperRegex, `$1${audioElementsHtml}$3`);
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('[sync] Stamped static audio & SFX elements into index.html');
  }
}

// Write runtime scenes.js
fs.writeFileSync(scenesJsPath, 'window.SCENES_DATA = ' + JSON.stringify(config, null, 2) + ';\n');

// Update scenes.json if paths or durations were tuned
if (modified) {
  fs.writeFileSync(scenesJsonPath, JSON.stringify(config, null, 2) + '\n');
  console.log('[sync] Updated scenes.json with auto-resolved assets & audio durations.');
}
