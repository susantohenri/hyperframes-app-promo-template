window.initAppPromoComposition = function (tl) {
  let config = null;
  if (window.__hyperframes && typeof window.__hyperframes.getVariables === 'function') {
    const vars = window.__hyperframes.getVariables();
    if (vars && vars.scenes && vars.scenes.length > 0) {
      config = vars;
    }
  }
  if (!config && window.SCENES_DATA) {
    config = window.SCENES_DATA;
  }
  if (!config) {
    const raw = document.getElementById('default-scenes-data')?.textContent;
    if (raw) {
      try { config = JSON.parse(raw); } catch (e) { console.error('Parse error', e); }
    }
  }

  if (!config || !config.scenes) {
    console.error('No scenes config available!');
    return;
  }

  function getAccessibleTextColor(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
    let hex = hexColor.trim();
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.45 ? '#0B1020' : '#ffffff';
  }

  // Apply theme colors (supports both config.theme and config.project.theme)
  const t = config.theme || config.project?.theme;
  if (t) {
    if (t.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', t.primaryColor);
      document.documentElement.style.setProperty('--color-badge-text', getAccessibleTextColor(t.primaryColor));
    }
    if (t.secondaryColor) {
      document.documentElement.style.setProperty('--color-secondary', t.secondaryColor);
    }
    if (t.accentColor) {
      document.documentElement.style.setProperty('--color-accent', t.accentColor);
      document.documentElement.style.setProperty('--color-btn-text', getAccessibleTextColor(t.accentColor));
    }
    const hl = t.highlightColor || t.accentColor;
    if (hl) {
      document.documentElement.style.setProperty('--color-highlight', hl);
    }
    const bg = t.backgroundColor || t.bgDark;
    if (bg) {
      document.documentElement.style.setProperty('--color-bg-dark', bg);
    }
  }

  const scenesWrapper = document.getElementById('scenes-wrapper');
  const audioWrapper = document.getElementById('audio-wrapper');
  const ctaBtnText = config.ctaButton || config.project?.ctaButton || 'INSTALL NOW';

  function formatHeadline(headlineText, scene, decoration) {
    const useGradientChunks = (decoration === 'gradient-fill' && !scene.textGradient);
    if (Array.isArray(scene.highlightWords) && scene.highlightWords.length > 0) {
      const validWords = scene.highlightWords
        .filter(w => typeof w === 'string' && w.trim().length > 0)
        .sort((a, b) => b.length - a.length)
        .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (validWords.length > 0) {
        const regex = new RegExp(`(${validWords.join('|')})`, 'gi');
        return headlineText.split(regex).map((part, idx) => {
          if (!part) return '';
          if (idx % 2 === 1) return `<span class="highlight">${part}</span>`;
          return useGradientChunks ? `<span class="gradient-chunk">${part}</span>` : part;
        }).join('');
      }
    }
    return useGradientChunks && headlineText ? `<span class="gradient-chunk">${headlineText}</span>` : headlineText;
  }

  function formatBeatTitle(title, highlight) {
    if (!highlight || typeof highlight !== 'string' || !highlight.trim()) return title;
    const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'i');
    return title.replace(regex, '<span class="vox-mark-wrap"><span class="vox-mark-bg"></span><span class="vox-mark-text">$1</span></span>');
  }

  function easeOutBack(val) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const x = Math.min(1, Math.max(0, val));
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  const captionSchedules = [];
  const hudTimecodeNodes = [];
  let currentStart = 0;

  config.scenes.forEach((scene, index) => {
    const start = currentStart;
    const duration = parseFloat(scene.durationInSeconds) || 4.0;
    const sceneId = `scene-${index + 1}`;
    const isFirst = (index === 0);
    const isLast = (index === config.scenes.length - 1);
    const isCtaScene = (scene.scenePurpose === 'cta') || isLast;

    // Emphasis classes
    let emphasisClass = '';
    const emphasisList = Array.isArray(scene.emphasisEffect)
      ? scene.emphasisEffect
      : (scene.emphasisEffect ? [scene.emphasisEffect] : []);
    if (emphasisList.includes('underline')) emphasisClass += ' emphasis-underline';
    if (emphasisList.includes('circle') || emphasisList.includes('scribble') || emphasisList.includes('sketch-outline')) emphasisClass += ' emphasis-circle';
    if (emphasisList.includes('color-invert')) emphasisClass += ' emphasis-invert';
    if (emphasisList.includes('spotlight')) emphasisClass += ' emphasis-spotlight';

    const layoutName = scene.layout || 'bottom-caption';
    const layoutClass = `layout-${layoutName}`;
    const treatmentName = scene.imageTreatment || 'full-bleed';
    const treatmentClass = `treatment-${treatmentName}`;
    const hasCardTreatment = (treatmentName !== 'full-bleed');
    const isPhoneMockup = (treatmentName === 'phone-mockup' || treatmentName === 'device-mockup');
    const fontMoodClass = `font-mood-${scene.textTreatment?.fontMood || 'bold-geometric'}`;
    const decoration = scene.textTreatment?.decoration || 'clean-flat';
    const decorationClass = `decoration-${decoration}`;
    const formattedHeadline = formatHeadline(scene.headline || '', scene, decoration);

    // Background FX HTML
    let bgFxHtml = '';
    if (scene.backgroundTreatment === 'radial-glow') {
      bgFxHtml += '<div class="bg-fx-radial-glow"></div>';
    } else if (scene.backgroundTreatment === 'noise-texture') {
      bgFxHtml += '<div class="bg-fx-noise"></div>';
    } else if (scene.backgroundTreatment === 'gradient' || scene.backgroundTreatment === 'animated-gradient') {
      bgFxHtml += '<div class="bg-fx-gradient"></div>';
    } else if (scene.backgroundTreatment === 'dark-overlay') {
      bgFxHtml += '<div class="bg-fx-dark-overlay"></div>';
    } else if (scene.backgroundTreatment === 'vignette') {
      bgFxHtml += '<div class="bg-fx-vignette"></div>';
    } else if (scene.backgroundTreatment === 'floating-particles') {
      bgFxHtml += `
        <div class="bg-fx-particles" id="${sceneId}-particles">
          <div class="particle-dot" style="top: 25%; left: 18%;"></div>
          <div class="particle-dot" style="top: 40%; right: 20%; width: 14px; height: 14px;"></div>
          <div class="particle-dot" style="top: 65%; left: 24%; width: 8px; height: 8px;"></div>
          <div class="particle-dot" style="top: 75%; right: 28%; width: 12px; height: 12px;"></div>
        </div>`;
    }

    const textSizeClass = scene.textSize ? `text-size-${scene.textSize}` : '';
    const captionStyle = scene.captionStyle || 'tiktok-highlight';
    const captionStyleClass = `caption-style-${captionStyle}`;
    const subPosClass = scene.subtitlePosition ? `sub-pos-${scene.subtitlePosition}` : '';

    const rawSubtitle = scene.subtitle || '';
    const subWords = rawSubtitle.trim().split(/\s+/).filter(Boolean);
    let formattedSubtitleHtml = '';
    if (subWords.length > 0 && captionStyle !== 'minimal-sub') {
      formattedSubtitleHtml = subWords.map((word, wIdx) =>
        `<span class="k-word${captionStyle === 'word-sweep' ? ' sweep-word' : ''}" id="${sceneId}-w-${wIdx}" data-layout-allow-occlusion="true">${word}</span>`
      ).join('');
    } else {
      formattedSubtitleHtml = rawSubtitle;
    }

    const headlineStyleParts = [];
    if (scene.textColor) headlineStyleParts.push(`color: ${scene.textColor};`);
    if (scene.textGradient) {
      const grad = (typeof scene.textGradient === 'string' && scene.textGradient.includes('gradient'))
        ? scene.textGradient
        : `linear-gradient(135deg, ${Array.isArray(scene.textGradient) ? scene.textGradient.join(', ') : scene.textGradient})`;
      headlineStyleParts.push(`background: ${grad}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;`);
    }
    const headlineCustomStyle = headlineStyleParts.length > 0 ? `style="${headlineStyleParts.join(' ')}"` : '';

    const subCardStyles = [];
    if (scene.textBg) subCardStyles.push(`background: ${scene.textBg};`);
    if (scene.borderColor) subCardStyles.push(`border: 2px solid ${scene.borderColor};`);
    const subCardStyleAttr = subCardStyles.length > 0 ? `style="${subCardStyles.join(' ')}"` : '';
    const subTextStyleAttr = scene.subtitleTextColor ? `style="color: ${scene.subtitleTextColor};"` : '';

    // Stickers HTML
    let stickersHtml = '';
    if (Array.isArray(scene.stickers) && scene.stickers.length > 0) {
      stickersHtml = `<div class="scene-stickers-wrap" id="${sceneId}-stickers">` +
        scene.stickers.map((stk, sIdx) => {
          const pos = stk.position || 'top-right';
          const icon = stk.icon ? `<span class="sticker-icon">${stk.icon}</span>` : '';
          const text = stk.text ? `<span class="sticker-text">${stk.text}</span>` : '';
          const bg = stk.bg ? `background: ${stk.bg};` : '';
          const color = stk.color ? `color: ${stk.color};` : '';
          const border = stk.border ? `border-color: ${stk.border};` : '';
          return `<div class="scene-sticker sticker-${pos}" id="${sceneId}-sticker-${sIdx}" style="${bg} ${color} ${border}" data-layout-ignore="true">${icon}${text}</div>`;
        }).join('') + `</div>`;
    }

    // Kinetic Beats HTML
    let beatsHtml = '';
    const beats = Array.isArray(scene.beats) ? scene.beats : [];
    if (beats.length > 0) {
      beatsHtml = `<div class="scene-beats-wrap" id="${sceneId}-beats">` +
        beats.map((b, bIdx) => {
          const bStyle = b.style || 'vox-card';
          const bPos = b.position || 'upper-card';
          const eyebrow = b.eyebrow ? `<div class="beat-eyebrow">${b.eyebrow}</div>` : '';
          const icon = b.icon ? `<span class="beat-icon">${b.icon}</span>` : '';
          const titleHtml = formatBeatTitle(b.title || '', b.highlight);
          const quoteBar = bStyle === 'editorial-quote' ? '<div class="beat-quote-bar"></div>' : '';
          return `
            <div class="beat-card beat-style-${bStyle} beat-pos-${bPos}" id="${sceneId}-beat-${bIdx}" data-layout-allow-occlusion="true">
              <div class="beat-inner">
                ${quoteBar}
                ${bStyle === 'pill-callout' ? `${icon}<div class="beat-title">${titleHtml}</div>` : `${eyebrow}<div class="beat-title">${icon ? icon + ' ' : ''}${titleHtml}</div>`}
              </div>
            </div>`;
        }).join('') + `</div>`;
    }

    // Overlays HTML (Catalog upgraded)
    let overlayFxHtml = '';
    const overlays = Array.isArray(scene.overlayElements) ? scene.overlayElements : [];
    if (overlays.includes('vox-grid')) {
      overlayFxHtml += `<div class="overlay-vox-grid" id="${sceneId}-vox-grid" data-layout-ignore="true"></div>`;
    }
    if (overlays.includes('speed-lines')) {
      overlayFxHtml += `<div class="overlay-speed-lines" id="${sceneId}-speed-lines" data-layout-ignore="true"></div>`;
    }
    if (overlays.includes('warning-stripes')) {
      overlayFxHtml += `
        <div class="overlay-warning-stripes top" id="${sceneId}-stripes-top" data-layout-ignore="true"></div>
        <div class="overlay-warning-stripes bottom" id="${sceneId}-stripes-bottom" data-layout-ignore="true"></div>`;
    }
    if (overlays.includes('neon-frame')) {
      overlayFxHtml += `
        <svg class="overlay-neon-svg" id="${sceneId}-neon-frame" viewBox="0 0 1080 1920" data-layout-ignore="true">
          <rect id="${sceneId}-neon-rect" x="22" y="22" width="1036" height="1876" rx="30"
            fill="none" stroke="var(--color-highlight)" stroke-width="4"
            stroke-dasharray="5820" stroke-dashoffset="5820"
            style="filter: drop-shadow(0 0 14px var(--color-highlight));" />
        </svg>`;
    }
    if (overlays.includes('film-grain')) {
      overlayFxHtml += `
        <svg class="overlay-film-grain" id="${sceneId}-film-grain" data-layout-ignore="true">
          <rect width="100%" height="100%" filter="url(#hf-grain-filter)" />
        </svg>`;
    }
    if (overlays.includes('camcorder-hud')) {
      overlayFxHtml += `
        <div class="overlay-camcorder-hud" id="${sceneId}-hud" data-layout-ignore="true">
          <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
          <div class="hud-corner bl"></div><div class="hud-corner br"></div>
          <div class="hud-rec" data-layout-ignore="true"><span class="hud-rec-dot" id="${sceneId}-rec-dot"></span>REC</div>
          <div class="hud-tc" id="${sceneId}-hud-tc" data-layout-ignore="true">00:00:00:00</div>
        </div>`;
    }
    if (overlays.includes('sparkles') || overlays.includes('confetti')) {
      overlayFxHtml += `
        <div class="overlay-sparkles" id="${sceneId}-sparkles" data-layout-allow-overlap="true" data-layout-ignore="true">
          <span class="sparkle-icon" style="top: 18%; left: 14%;">✨</span>
          <span class="sparkle-icon" style="top: 28%; right: 16%; font-size: 46px;">🎉</span>
          <span class="sparkle-icon" style="top: 62%; left: 18%; font-size: 34px;">⭐</span>
          <span class="sparkle-icon" style="top: 72%; right: 22%; font-size: 42px;">✨</span>
        </div>`;
    }

    const clip = document.createElement('div');
    clip.id = sceneId;
    clip.className = `clip ${layoutClass}`;
    clip.setAttribute('data-start', start.toFixed(2));
    clip.setAttribute('data-duration', duration.toFixed(2));
    clip.setAttribute('data-track-index', '1');

    clip.innerHTML = `
      <div class="scene-inner" id="${sceneId}-inner" data-layout-allow-overflow="true">
        <div class="bg-wrapper" id="${sceneId}-bg-wrapper" data-layout-allow-overflow="true">
          ${hasCardTreatment ? (scene.type === 'video' ? `<video class="bg-backdrop-blur" src="${scene.mediaSrc}" muted playsinline></video>` : `<img class="bg-backdrop-blur" src="${scene.mediaSrc}" alt="" />`) : ''}
          <div class="media-container ${treatmentClass}" id="${sceneId}-media-container" data-layout-allow-overflow="true">
            ${isPhoneMockup ? '<div class="phone-notch"></div>' : ''}
            ${scene.type === 'video'
              ? `<video id="${sceneId}-media" class="scene-media" src="${scene.mediaSrc}" data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" ${scene.hasAudio ? 'data-has-audio="true"' : 'muted'} playsinline></video>`
              : `<img id="${sceneId}-media" class="scene-media" src="${scene.mediaSrc}" alt="Scene ${index + 1}" />`
            }
          </div>
          <div class="gradient-overlay"></div>
          ${bgFxHtml}
          ${overlayFxHtml}
        </div>
        <div class="chroma-layer cyan" id="${sceneId}-chroma-c" data-layout-ignore="true"></div>
        <div class="chroma-layer magenta" id="${sceneId}-chroma-m" data-layout-ignore="true"></div>

        <div class="content-overlay ${fontMoodClass} ${decorationClass} ${emphasisClass} ${textSizeClass} ${captionStyleClass} ${subPosClass}" id="${sceneId}-overlay" data-layout-allow-overflow="true">
          ${(scene.badge || isCtaScene) ? `
          <div id="${sceneId}-badge" class="scene-badge ${isCtaScene ? 'scene-badge-cta' : ''}">
            ${isCtaScene ? `
              <svg viewBox="0 0 466 512" xmlns="http://www.w3.org/2000/svg">
                <g fill-rule="nonzero">
                  <path fill="#00D3FF" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z"/>
                  <path fill="#00E676" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z"/>
                  <path fill="#FFC107" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z"/>
                  <path fill="#FF334C" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z"/>
                </g>
              </svg>
            ` : ''}
            <span>${scene.badge || (isCtaScene ? 'GOOGLE PLAY' : '')}</span>
          </div>` : ''}
          ${formattedHeadline ? `<h1 id="${sceneId}-headline" class="scene-headline" ${headlineCustomStyle}>${formattedHeadline}</h1>` : ''}
          ${rawSubtitle ? `
          <div id="${sceneId}-sub" class="subtitle-card" ${subCardStyleAttr} data-layout-allow-occlusion="true">
            <p class="subtitle-text" ${subTextStyleAttr}>${formattedSubtitleHtml}</p>
          </div>` : ''}
          ${isCtaScene ? `
            <div id="${sceneId}-cta-action" class="outro-cta-action" data-layout-ignore="true">
              <div class="outro-cta-btn">
                <svg viewBox="0 0 466 512" xmlns="http://www.w3.org/2000/svg">
                  <g fill-rule="nonzero">
                    <path fill="#00D3FF" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z"/>
                    <path fill="#00E676" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z"/>
                    <path fill="#FFC107" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z"/>
                    <path fill="#FF334C" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z"/>
                  </g>
                </svg>
                <span>${ctaBtnText}</span>
              </div>
            </div>
          ` : ''}
        </div>
        ${beatsHtml}
        ${stickersHtml}
      </div>
    `;

    scenesWrapper.appendChild(clip);

    if (overlays.includes('camcorder-hud')) {
      const tcEl = document.getElementById(`${sceneId}-hud-tc`);
      if (tcEl) hudTimecodeNodes.push(tcEl);
    }

    // Fallback DOM audio stamping if sync.js didn't stamp static tags
    if (scene.audioSrc && !document.getElementById(`${sceneId}-audio-vo`)) {
      const audioEl = document.createElement('audio');
      audioEl.id = `${sceneId}-audio-vo`;
      audioEl.src = scene.audioSrc;
      audioEl.setAttribute('data-start', start.toFixed(2));
      const exactAudioDur = parseFloat(scene.audioDuration) || duration;
      audioEl.setAttribute('data-duration', exactAudioDur.toFixed(2));
      audioEl.setAttribute('data-volume', '1.0');
      audioEl.setAttribute('data-track-index', '1');
      audioWrapper.appendChild(audioEl);
    }

    if (Array.isArray(scene.soundDesign)) {
      scene.soundDesign.forEach((sfx, sfxIdx) => {
        const sfxId = `${sceneId}-sfx-${sfxIdx + 1}`;
        if (sfx.assetSrc && !document.getElementById(sfxId)) {
          const sfxEl = document.createElement('audio');
          sfxEl.id = sfxId;
          sfxEl.src = sfx.assetSrc;
          const sfxStart = start + (parseFloat(sfx.at) || 0);
          sfxEl.setAttribute('data-start', sfxStart.toFixed(2));
          if (sfx.duration) sfxEl.setAttribute('data-duration', parseFloat(sfx.duration).toFixed(2));
          if (sfx.volume !== undefined) sfxEl.setAttribute('data-volume', parseFloat(sfx.volume).toString());
          sfxEl.setAttribute('data-track-index', (2 + (sfxIdx % 5)).toString());
          audioWrapper.appendChild(sfxEl);
        }
      });
    }

    const innerSel = `#${sceneId}-inner`;
    const mediaTarget = hasCardTreatment ? `#${sceneId}-media-container` : `#${sceneId}-media`;
    const badgeSel = `#${sceneId}-badge`;
    const headSel = `#${sceneId}-headline`;
    const subSel = `#${sceneId}-sub`;

    // 1. TRANSITION IN
    const transIn = scene.transitionIn || 'cut';
    if (isFirst && transIn === 'cut') {
      tl.set(innerSel, { opacity: 1 }, 0);
    } else {
      switch (transIn) {
        case 'cut':
          tl.set(innerSel, { opacity: 1 }, start);
          break;
        case 'blur-crossfade':
          tl.fromTo(innerSel, { opacity: 0, filter: 'blur(24px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' }, start);
          break;
        case 'push-up':
          tl.fromTo(innerSel, { y: 600, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, start);
          break;
        case 'push-left':
          tl.fromTo(innerSel, { x: 800, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, start);
          break;
        case 'zoom-through':
          tl.fromTo(innerSel, { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }, start);
          break;
        case 'zoom-out':
          tl.fromTo(innerSel, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }, start);
          break;
        case 'elastic-push':
          tl.fromTo(innerSel, { y: 400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.5)' }, start);
          break;
        case 'circle-iris':
          tl.fromTo(innerSel, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 }, { clipPath: 'circle(120% at 50% 50%)', opacity: 1, duration: 0.5, ease: 'power3.inOut' }, start);
          break;
        case 'whip-pan':
          tl.fromTo(innerSel, { x: -1080, scaleX: 1.15, filter: 'blur(18px)', opacity: 0.2 }, { x: 0, scaleX: 1, filter: 'blur(0px)', opacity: 1, duration: 0.36, ease: 'power4.out' }, start);
          break;
        case 'light-leak':
        case 'flash-through-white':
          tl.fromTo(innerSel, { filter: 'brightness(2.6)', opacity: 0 }, { filter: 'brightness(1)', opacity: 1, duration: 0.45, ease: 'power2.out' }, start);
          break;
        case 'chromatic-split':
          tl.fromTo(innerSel, { scale: 1.18, opacity: 0, filter: 'brightness(1.7) saturate(1.5)' }, { scale: 1, opacity: 1, filter: 'brightness(1) saturate(1)', duration: 0.42, ease: 'expo.out' }, start);
          tl.fromTo(`#${sceneId}-chroma-c`, { opacity: 0.9, x: -28, scale: 1.04 }, { opacity: 0, x: 0, scale: 1, duration: 0.38, ease: 'power3.out' }, start);
          tl.fromTo(`#${sceneId}-chroma-m`, { opacity: 0.9, x: 28, scale: 1.04 }, { opacity: 0, x: 0, scale: 1, duration: 0.38, ease: 'power3.out' }, start);
          break;
        case 'glitch':
        case 'glitch-wipe':
          tl.fromTo(innerSel, { clipPath: 'inset(0 100% 0 0)', skewX: -12, opacity: 1 }, { clipPath: 'inset(0 0% 0 0)', skewX: 0, opacity: 1, duration: 0.34, ease: 'power4.out' }, start);
          tl.fromTo(`#${sceneId}-chroma-c`, { opacity: 0.75, x: -20 }, { opacity: 0, x: 0, duration: 0.25 }, start);
          break;
        case 'domain-warp':
        case 'ripple':
          tl.set(innerSel, { filter: 'url(#hf-warp-filter)' }, start);
          tl.fromTo('#hf-warp-disp', { attr: { scale: 90 } }, { attr: { scale: 0 }, duration: 0.55, ease: 'power3.out' }, start);
          tl.fromTo(innerSel, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, start);
          tl.set(innerSel, { filter: 'none' }, start + 0.56);
          break;
        case 'beat-freeze':
          tl.fromTo(innerSel, { scale: 1.14, filter: 'brightness(2.1) contrast(1.2)', opacity: 1 }, { scale: 1, filter: 'brightness(1) contrast(1)', opacity: 1, duration: 0.3, ease: 'expo.out' }, start);
          break;
        case '3d-flip':
          tl.fromTo(innerSel, { transformPerspective: 1000, rotateY: 75, opacity: 0 }, { transformPerspective: 1000, rotateY: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, start);
          break;
        case 'crossfade':
        default:
          tl.fromTo(innerSel, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, start);
          break;
      }
    }

    // 2. MEDIA MOTION
    const motion = scene.mediaMotion || 'slow-zoom-in';
    switch (motion) {
      case 'shake-on-impact':
        tl.fromTo(mediaTarget, { x: -16, y: 12, scale: 1.05 }, { x: 0, y: 0, scale: 1.0, duration: 0.35, ease: 'power4.out' }, start);
        tl.to(mediaTarget, { scale: 1.08, duration: Math.max(0.1, duration - 0.35), ease: 'none' }, start + 0.35);
        break;
      case 'pan-right':
        tl.fromTo(mediaTarget, { x: -45, scale: 1.08 }, { x: 45, scale: 1.08, duration, ease: 'none' }, start);
        break;
      case 'pan-left':
        tl.fromTo(mediaTarget, { x: 45, scale: 1.08 }, { x: -45, scale: 1.08, duration, ease: 'none' }, start);
        break;
      case 'handheld-drift':
        tl.fromTo(mediaTarget, { x: -14, y: -10, scale: 1.06, rotate: -0.6 }, { x: 14, y: 10, scale: 1.06, rotate: 0.6, duration, ease: 'sine.inOut' }, start);
        break;
      case 'slow-zoom-in':
        tl.fromTo(mediaTarget, { scale: 1.0, y: 0 }, { scale: 1.12, y: -25, duration, ease: 'none' }, start);
        break;
      case 'zoom-out':
      case 'slow-zoom-out':
        tl.fromTo(mediaTarget, { scale: 1.14, y: -20 }, { scale: 1.0, y: 0, duration, ease: 'none' }, start);
        break;
      case 'tilt-up':
        tl.fromTo(mediaTarget, { scale: 1.06, transformPerspective: 900, rotateX: 4, y: 18 }, { scale: 1.06, transformPerspective: 900, rotateX: -2, y: -18, duration, ease: 'sine.inOut' }, start);
        break;
      case 'tilt-down':
        tl.fromTo(mediaTarget, { scale: 1.06, transformPerspective: 900, rotateX: -4, y: -18 }, { scale: 1.06, transformPerspective: 900, rotateX: 2, y: 18, duration, ease: 'sine.inOut' }, start);
        break;
      case 'parallax':
        tl.fromTo(mediaTarget, { scale: 1.08, y: 25 }, { scale: 1.08, y: -25, duration, ease: 'none' }, start);
        break;
      case '3d-tilt':
        tl.fromTo(mediaTarget, { scale: 1.06, transformPerspective: 900, rotateX: 4, rotateY: -4 }, { scale: 1.06, transformPerspective: 900, rotateX: -3, rotateY: 3, duration, ease: 'sine.inOut' }, start);
        break;
      case 'subtle-float':
        tl.fromTo(mediaTarget, { scale: 1.05, y: 16 }, { scale: 1.05, y: -16, duration, ease: 'sine.inOut' }, start);
        break;
      case 'none':
      default:
        if (scene.type === 'image') {
          tl.fromTo(mediaTarget, { scale: 1.0, y: 0 }, { scale: 1.08, y: -20, duration, ease: 'none' }, start);
        }
        break;
    }

    // 3. BADGE & HEADLINE ENTRANCE
    if (scene.badge || isCtaScene) {
      tl.fromTo(badgeSel, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, start + 0.15);
    }

    if (formattedHeadline) {
      const anim = scene.animation || 'pop';
      switch (anim) {
        case 'slam':
          tl.fromTo(headSel, { scale: 1.35, opacity: 0, y: 35 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power4.out' }, start + 0.25);
          break;
        case 'pop':
          tl.fromTo(headSel, { scale: 0.75, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, start + 0.25);
          break;
        case 'shake':
          tl.fromTo(headSel, { scale: 0.9, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, start + 0.22);
          tl.fromTo(headSel, { x: -16 }, { x: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.3)' }, start + 0.25);
          break;
        case 'zoom':
          tl.fromTo(headSel, { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' }, start + 0.25);
          break;
        case 'slide':
          tl.fromTo(headSel, { x: -140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, ease: 'power3.out' }, start + 0.25);
          break;
        case 'spring':
          tl.fromTo(headSel, { y: 85, scaleY: 1.3, opacity: 0 }, { y: 0, scaleY: 1, opacity: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)' }, start + 0.25);
          break;
        case 'bounce':
          tl.fromTo(headSel, { y: -110, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'bounce.out' }, start + 0.25);
          break;
        case 'fade':
          tl.fromTo(headSel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, start + 0.25);
          break;
        case 'blur reveal':
        case 'blur-reveal':
          tl.fromTo(headSel, { filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0px)', opacity: 1, duration: 0.45, ease: 'power2.out' }, start + 0.25);
          break;
        case 'wipe':
          tl.fromTo(headSel, { clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.45, ease: 'power3.out' }, start + 0.25);
          break;
        case 'glitch':
          tl.fromTo(headSel, { x: -24, skewX: 14, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: 0.35, ease: 'power4.out' }, start + 0.25);
          break;
        case 'elastic':
          tl.fromTo(headSel, { scaleX: 1.4, scaleY: 0.8, opacity: 0 }, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.55, ease: 'elastic.out(1.2, 0.4)' }, start + 0.25);
          break;
        default:
          tl.fromTo(headSel, { scale: 0.8, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }, start + 0.25);
          break;
      }

      if (emphasisList.includes('burst') || emphasisList.includes('scale-emphasis')) {
        tl.fromTo(`${headSel} .highlight`, { scale: 1 }, { scale: 1.15, duration: 0.28, yoyo: true, repeat: 1, ease: 'power2.out' }, start + 0.65);
      }
    }

    // 4. SUBTITLE CARD & CTA ENTRANCE + DETERMINISTIC CAPTION SCHEDULE
    if (rawSubtitle) {
      tl.fromTo(subSel, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, start + 0.4);
    }
    if (isCtaScene) {
      tl.fromTo(`#${sceneId}-cta-action`, { scale: 0.82, opacity: 0, y: 24 }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, start + 0.5);
    }

    if (subWords.length > 0 && captionStyle !== 'minimal-sub') {
      const voDur = parseFloat(scene.audioDuration) || (duration - 0.35);
      const subStart = start + 0.15;
      const speakDuration = Math.max(0.6, voDur - 0.15);
      const wordDuration = speakDuration / subWords.length;
      const wordEntries = subWords.map((_, wIdx) => ({
        el: document.getElementById(`${sceneId}-w-${wIdx}`),
        wStart: subStart + (wIdx * wordDuration),
        wEnd: subStart + ((wIdx + 1) * wordDuration),
        idx: wIdx
      }));
      captionSchedules.push({
        start,
        end: start + duration,
        mode: captionStyle,
        baseColor: scene.subtitleTextColor || '#FFFFFF',
        words: wordEntries
      });
    }

    // 5. KINETIC BEATS
    if (beats.length > 0) {
      beats.forEach((b, bIdx) => {
        const bSel = `#${sceneId}-beat-${bIdx}`;
        const bAt = start + (parseFloat(b.at) || 0);
        const rawDur = parseFloat(b.duration) || 3.0;
        const maxAvail = Math.max(0.8, (start + duration) - bAt - 0.25);
        const bDur = Math.min(rawDur, maxAvail);
        const bStyle = b.style || 'vox-card';
        gsap.set(bSel, { opacity: 0, visibility: 'hidden' });

        if (bStyle === 'stat-pop' || bStyle === 'pill-callout') {
          tl.fromTo(bSel, { scale: 0.5, opacity: 0, visibility: 'visible' }, { scale: 1, opacity: 1, visibility: 'visible', duration: 0.35, ease: 'back.out(2.2)' }, bAt);
        } else if (bStyle === 'editorial-quote') {
          tl.fromTo(bSel, { x: -45, opacity: 0, visibility: 'visible' }, { x: 0, opacity: 1, visibility: 'visible', duration: 0.38, ease: 'power3.out' }, bAt);
          tl.fromTo(`${bSel} .beat-quote-bar`, { scaleY: 0 }, { scaleY: 1, duration: 0.38, ease: 'power2.out' }, bAt + 0.08);
        } else {
          tl.fromTo(bSel, { y: 32, opacity: 0, visibility: 'visible' }, { y: 0, opacity: 1, visibility: 'visible', duration: 0.34, ease: 'power3.out' }, bAt);
          tl.fromTo(`${bSel} .vox-mark-bg`, { scaleX: 0 }, { scaleX: 1, duration: 0.36, ease: 'power2.out' }, bAt + 0.14);
        }
        const exitAt = bAt + Math.max(0.45, bDur - 0.22);
        tl.to(bSel, { y: -20, opacity: 0, duration: 0.22, ease: 'power2.in' }, exitAt);
        tl.set(bSel, { visibility: 'hidden' }, exitAt + 0.23);
      });
    }

    // 6. RETENTION STICKERS
    if (Array.isArray(scene.stickers) && scene.stickers.length > 0) {
      scene.stickers.forEach((stk, sIdx) => {
        const stkSel = `#${sceneId}-sticker-${sIdx}`;
        const stkAt = start + (stk.at !== undefined ? parseFloat(stk.at) : 0.35);
        const stkAnim = stk.animation || 'stamp';
        gsap.set(stkSel, { opacity: 0, visibility: 'hidden' });
        switch (stkAnim) {
          case 'shake':
            tl.fromTo(stkSel, { scale: 0, opacity: 0, visibility: 'visible' }, { scale: 1, opacity: 1, visibility: 'visible', duration: 0.3, ease: 'back.out(2)' }, stkAt);
            tl.fromTo(stkSel, { rotate: -8 }, { rotate: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut' }, stkAt + 0.3);
            break;
          case 'stamp':
            tl.fromTo(stkSel, { scale: 2.5, opacity: 0, visibility: 'visible', rotate: -22 }, { scale: 1, opacity: 1, visibility: 'visible', rotate: -3, duration: 0.35, ease: 'power4.out' }, stkAt);
            break;
          case 'bounce':
            tl.fromTo(stkSel, { y: -80, opacity: 0, visibility: 'visible' }, { y: 0, opacity: 1, visibility: 'visible', duration: 0.5, ease: 'bounce.out' }, stkAt);
            break;
          case 'pop':
          default:
            tl.fromTo(stkSel, { scale: 0.3, opacity: 0, visibility: 'visible' }, { scale: 1, opacity: 1, visibility: 'visible', duration: 0.35, ease: 'back.out(2.5)' }, stkAt);
            break;
        }
      });
    }

    // 7. OVERLAYS ANIMATION
    if (scene.backgroundTreatment === 'floating-particles') {
      tl.fromTo(`#${sceneId}-particles`, { y: 35 }, { y: -35, duration, ease: 'none' }, start);
    }
    if (overlays.includes('sparkles') || overlays.includes('confetti')) {
      tl.fromTo(`#${sceneId}-sparkles`, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1.06, duration, ease: 'sine.inOut' }, start + 0.15);
    }
    if (overlays.includes('speed-lines')) {
      tl.fromTo(`#${sceneId}-speed-lines`, { opacity: 0, scale: 1.2, rotation: 0 }, { opacity: 0.85, scale: 1, rotation: 18, duration, ease: 'none' }, start);
    }
    if (overlays.includes('warning-stripes')) {
      tl.fromTo(`#${sceneId}-stripes-top`, { y: -24, backgroundPosition: '0px 0px' }, { y: 0, backgroundPosition: '320px 0px', duration, ease: 'none' }, start);
      tl.fromTo(`#${sceneId}-stripes-bottom`, { y: 24, backgroundPosition: '0px 0px' }, { y: 0, backgroundPosition: '-320px 0px', duration, ease: 'none' }, start);
    }
    if (overlays.includes('neon-frame')) {
      tl.fromTo(`#${sceneId}-neon-rect`, { strokeDashoffset: 5820 }, { strokeDashoffset: 0, duration: Math.min(1.4, duration * 0.6), ease: 'power2.out' }, start + 0.08);
    }
    if (overlays.includes('vox-grid')) {
      tl.fromTo(`#${sceneId}-vox-grid`, { backgroundPosition: '0px 0px' }, { backgroundPosition: '108px 108px', duration, ease: 'none' }, start);
    }
    if (overlays.includes('film-grain')) {
      tl.fromTo(`#${sceneId}-film-grain`, { x: 0, y: 0 }, { x: -48, y: -36, duration, ease: 'steps(24)' }, start);
    }
    if (overlays.includes('camcorder-hud')) {
      tl.to(`#${sceneId}-rec-dot`, { opacity: 0.2, duration: 0.5, repeat: Math.max(1, Math.floor(duration * 2)), yoyo: true, ease: 'steps(1)' }, start);
    }

    // 8. TEXT EXIT TRANSITION
    if (scene.textTransitionOut && scene.textTransitionOut !== 'none') {
      const textExitDur = 0.28;
      const textExitTime = (start + duration) - textExitDur - 0.05;
      const textTargets = [headSel, subSel].filter(sel => document.querySelector(sel) !== null);
      if (textTargets.length > 0) {
        switch (scene.textTransitionOut) {
          case 'fade':
            tl.to(textTargets, { opacity: 0, duration: textExitDur, ease: 'power2.in' }, textExitTime);
            break;
          case 'slide-up':
            tl.to(textTargets, { y: -60, opacity: 0, duration: textExitDur, ease: 'power2.in' }, textExitTime);
            break;
          case 'shrink':
            tl.to(textTargets, { scale: 0.7, opacity: 0, duration: textExitDur, ease: 'back.in(1.5)' }, textExitTime);
            break;
          case 'glitch-out':
            tl.to(textTargets, { x: 25, opacity: 0, filter: 'blur(10px)', duration: textExitDur, ease: 'power3.in' }, textExitTime);
            break;
          case 'slam-away':
            tl.to(textTargets, { scale: 1.4, opacity: 0, duration: textExitDur, ease: 'power4.in' }, textExitTime);
            break;
        }
      }
    }

    // 9. TRANSITION OUT
    if (!isLast) {
      const transOut = scene.transitionOut || 'crossfade';
      const end = start + duration;
      switch (transOut) {
        case 'blur-crossfade':
          tl.to(innerSel, { opacity: 0.2, filter: 'blur(16px)', duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'push-up':
          tl.to(innerSel, { y: -300, opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'push-left':
          tl.to(innerSel, { x: -400, opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'zoom-through':
          tl.to(innerSel, { scale: 1.25, opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'zoom-out':
          tl.to(innerSel, { scale: 0.85, opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'elastic-push':
          tl.to(innerSel, { y: -280, opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'circle-iris':
          tl.to(innerSel, { clipPath: 'circle(0% at 50% 50%)', duration: 0.28, ease: 'power3.in' }, end - 0.28);
          break;
        case 'whip-pan':
          tl.to(innerSel, { x: 900, scaleX: 1.15, filter: 'blur(18px)', opacity: 0.15, duration: 0.26, ease: 'power3.in' }, end - 0.26);
          break;
        case 'chromatic-split':
          tl.to(innerSel, { scale: 1.12, filter: 'brightness(1.8)', opacity: 0.15, duration: 0.24, ease: 'power2.in' }, end - 0.24);
          tl.fromTo(`#${sceneId}-chroma-c`, { opacity: 0, x: 0 }, { opacity: 0.9, x: -30, duration: 0.22 }, end - 0.24);
          tl.fromTo(`#${sceneId}-chroma-m`, { opacity: 0, x: 0 }, { opacity: 0.9, x: 30, duration: 0.22 }, end - 0.24);
          break;
        case 'glitch':
        case 'glitch-wipe':
          tl.to(innerSel, { skewX: 10, clipPath: 'inset(0 0 0 100%)', duration: 0.24, ease: 'power3.in' }, end - 0.24);
          break;
        case 'domain-warp':
        case 'ripple':
          tl.set(innerSel, { filter: 'url(#hf-warp-filter)' }, end - 0.3);
          tl.to('#hf-warp-disp', { attr: { scale: 90 }, duration: 0.28, ease: 'power2.in' }, end - 0.3);
          tl.to(innerSel, { opacity: 0.15, duration: 0.28 }, end - 0.3);
          break;
        case 'beat-freeze':
          tl.to(innerSel, { scale: 1.06, filter: 'brightness(1.9)', duration: 0.18, ease: 'power2.in' }, end - 0.18);
          break;
        case '3d-flip':
          tl.to(innerSel, { transformPerspective: 1000, rotateY: -75, opacity: 0.15, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'light-leak':
        case 'flash-through-white':
          tl.to(innerSel, { filter: 'brightness(2.4)', opacity: 0.2, duration: 0.28, ease: 'power2.in' }, end - 0.28);
          break;
        case 'cut':
          break;
        case 'crossfade':
        default:
          tl.to(innerSel, { opacity: 0.2, duration: 0.22, ease: 'power1.in' }, end - 0.22);
          break;
      }
    }

    currentStart += duration;
  });

  // Global Progress Bar Animation
  tl.fromTo('#progress-bar', { width: '0%' }, { width: '100%', duration: currentStart, ease: 'none' }, 0);

  // Deterministic Frame Sync for Captions & Camcorder HUD Timecode
  const highlightCssColor = getComputedStyle(document.documentElement).getPropertyValue('--color-highlight').trim() || '#22D3EE';

  function updateFrameState(time) {
    if (hudTimecodeNodes.length > 0) {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      const frames = Math.floor((time % 1) * 30);
      const pad = (n) => String(n).padStart(2, '0');
      const tc = `00:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
      hudTimecodeNodes.forEach(n => { n.textContent = tc; });
    }

    captionSchedules.forEach(sched => {
      if (time < sched.start || time > sched.end) return;
      const mode = sched.mode;
      sched.words.forEach(w => {
        const el = w.el;
        if (!el) return;
        const isActive = time >= w.wStart && time < w.wEnd;
        const isPast = time >= w.wEnd;
        const elapsed = Math.max(0, time - w.wStart);
        const wDur = Math.max(0.08, w.wEnd - w.wStart);
        const spring = isActive ? easeOutBack(Math.min(1, elapsed / 0.14)) : 0;

        if (mode === 'boxed-karaoke') {
          el.className = isActive ? 'k-word boxed-active' : 'k-word';
          el.style.opacity = isActive ? '1' : '0.78';
          el.style.transform = isActive ? `scale(${(0.95 + 0.13 * spring).toFixed(3)})` : 'scale(1)';
        } else if (mode === 'pill-karaoke') {
          el.className = isActive ? 'k-word pill-active' : 'k-word';
          el.style.opacity = '1';
          el.style.transform = isActive ? `scale(${(0.94 + 0.14 * spring).toFixed(3)})` : 'scale(1)';
        } else if (mode === 'editorial-emphasis') {
          el.className = isActive ? 'k-word editorial-active' : 'k-word';
          el.style.opacity = isActive ? '1' : (isPast ? '0.92' : '0.75');
          el.style.transform = isActive ? `scale(${(0.96 + 0.14 * spring).toFixed(3)})` : 'scale(1)';
        } else if (mode === 'word-sweep') {
          const pct = isPast ? 100 : (isActive ? Math.min(100, (elapsed / wDur) * 100) : 0);
          el.className = 'k-word sweep-word';
          el.style.setProperty('--sweep', `${pct.toFixed(1)}%`);
          el.style.transform = isActive ? `scale(${(1 + 0.08 * spring).toFixed(3)})` : 'scale(1)';
        } else if (mode === 'kinetic-slam') {
          if (time < w.wStart) {
            el.style.opacity = '0.25';
            el.style.color = sched.baseColor;
            el.style.transform = 'scale(0.86)';
          } else if (isActive) {
            const slamScale = 1.28 - 0.2 * Math.min(1, elapsed / 0.12);
            const tilt = w.idx % 2 === 0 ? -2 : 2;
            el.style.opacity = '1';
            el.style.color = highlightCssColor;
            el.style.transform = `scale(${slamScale.toFixed(3)}) rotate(${tilt}deg)`;
          } else {
            el.style.opacity = '0.95';
            el.style.color = sched.baseColor;
            el.style.transform = 'scale(1) rotate(0deg)';
          }
        } else if (mode === 'word-pop') {
          el.style.opacity = time < w.wStart ? '0' : '1';
          el.style.color = isActive ? highlightCssColor : sched.baseColor;
          el.style.transform = isActive ? `scale(${(0.92 + 0.18 * spring).toFixed(3)})` : 'scale(1)';
        } else {
          // tiktok-highlight / bold-center
          el.style.opacity = isActive ? '1' : (isPast ? '0.9' : '0.72');
          el.style.color = isActive ? highlightCssColor : sched.baseColor;
          el.style.fontWeight = isActive ? '900' : '700';
          el.style.transform = isActive ? `scale(${(0.96 + 0.18 * spring).toFixed(3)})` : 'scale(1)';
        }
      });
    });
  }

  tl.eventCallback('onUpdate', function () { updateFrameState(this.time()); });
  updateFrameState(0);
  tl.seek(0);
};
