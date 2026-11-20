import { getAnalyserNode } from '../audio/audioEngine';
import { getActiveVibe, state } from '../state/store';
import { drawFourPointStar, prefersReducedMotion, renderMoodScene } from './moodScenes';

interface StippleStar {
  x: number;
  y: number;
  size: number;
  speedY: number;
  phase: number;
}

interface NoteSparkle {
  xRatio: number;
  y: number;
  age: number;
  maxAge: number;
  size: number;
}

const stippleStars: StippleStar[] = [];
const noteSparkles: NoteSparkle[] = [];
const freqData = new Uint8Array(128);

let animTime = 0;
let lastFrameMs = 0;
let prevMelodyPulse = 0;
let smoothMelody = 0;
let smoothChord = 0;

export function initVisualizerParticles(): void {
  stippleStars.length = 0;
  for (let i = 0; i < 48; i++) {
    stippleStars.push({
      x: Math.random(),
      y: Math.random() * 0.72,
      size: Math.random() > 0.78 ? 2 : 1,
      speedY: 0.004 + Math.random() * 0.008,
      phase: Math.random() * Math.PI * 2
    });
  }
}

export function resizeVisualizerCanvas(canvas: HTMLCanvasElement): void {
  const parent = canvas.parentElement;
  if (!parent) return;
  const rect = parent.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

export function startVisualizerLoop(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  lastFrameMs = performance.now();

  const renderFrame = (nowMs: number) => {
    const dt = Math.min(0.05, Math.max(0, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;

    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const vibe = getActiveVibe();
    const reduced = prefersReducedMotion();

    const analyser = getAnalyserNode();
    if (analyser && state.isPlaying) {
      analyser.getByteFrequencyData(freqData);
    } else {
      freqData.fill(0);
    }

    state.visChordPulse *= 0.96;
    state.visMelodyPulse *= 0.95;

    const targetMelody = state.isPlaying ? state.visMelodyPulse : 0;
    smoothMelody += (targetMelody - smoothMelody) * Math.min(1, dt * 12);
    smoothChord += ((state.isPlaying ? state.visChordPulse : 0) - smoothChord) * Math.min(1, dt * 10);

    if (state.isPlaying && state.visMelodyPulse > 0.72 && prevMelodyPulse <= 0.72) {
      const clampedMidi = Math.max(58, Math.min(81, state.lastMelodyMidi));
      const xRatio = 0.24 + ((clampedMidi - 58) / 23) * 0.50;
      noteSparkles.push({
        xRatio,
        y: h - 78,
        age: 0,
        maxAge: 1.5,
        size: 3.4
      });
    }
    prevMelodyPulse = state.visMelodyPulse;

    const bpmFactor = (state.isPlaying ? state.bpm : 56) / 60;
    if (!reduced) {
      animTime += dt * bpmFactor;
    }

    const t = reduced ? 0 : animTime;
    const motion = reduced ? 0 : 1;

    // Flat vibe plateColor background + calm lower horizon band
    ctx.fillStyle = vibe.plateColor;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(5, 7, 15, 0.34)';
    ctx.fillRect(0, h - 62, w, 62);

    // Subtle background stipple stars
    stippleStars.forEach((p) => {
      if (!reduced) {
        p.y -= p.speedY * dt * (state.isPlaying ? 1.0 : 0.35);
        if (p.y < 0) p.y = 0.72;
      }
      const alpha = 0.16 + 0.28 * Math.sin(t * 1.4 + p.phase);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(Math.floor(p.x * w), Math.floor(p.y * h), p.size, p.size);
    });

    // Render shared canonical mood scene in wide stage mode
    renderMoodScene(ctx, vibe.id, {
      w,
      h,
      t,
      motion,
      melody: smoothMelody,
      chord: smoothChord,
      mode: 'stage'
    });

    // Floating melody note sparkles
    for (let i = noteSparkles.length - 1; i >= 0; i--) {
      const sp = noteSparkles[i];
      sp.age += dt;
      if (sp.age >= sp.maxAge) {
        noteSparkles.splice(i, 1);
        continue;
      }
      const progress = sp.age / sp.maxAge;
      const alpha = Math.sin(progress * Math.PI) * 0.85;
      const py = reduced ? sp.y - 16 : sp.y - progress * 48;
      drawFourPointStar(
        ctx,
        sp.xRatio * w,
        py,
        sp.size * (1 - progress * 0.35),
        `rgba(253, 230, 138, ${alpha.toFixed(3)})`
      );
    }

    // Ambient rain overlay when Window Rain > 5
    if (state.mix.rain > 5 && !reduced) {
      const rainAlpha = Math.min(0.28, (state.mix.rain / 100) * 0.28);
      ctx.strokeStyle = `rgba(219, 234, 254, ${rainAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      const rainCount = Math.floor((state.mix.rain / 100) * 24);
      for (let i = 0; i < rainCount; i++) {
        const rx = ((i * 97 + t * 85) % (w + 40)) - 20;
        const ry = ((i * 53 + t * 240) % (h + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 14);
        ctx.stroke();
      }
      const rippleCount = Math.min(5, Math.max(1, Math.floor((state.mix.rain / 100) * 5)));
      for (let i = 0; i < rippleCount; i++) {
        const rp = (t * 0.45 + i * 0.27) % 1;
        const rAlpha = (1 - rp) * rainAlpha * 1.4;
        const rX = w * (0.16 + ((i * 0.19) % 0.64));
        ctx.strokeStyle = `rgba(141, 164, 255, ${rAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(rX, h - 58, 3 + rp * 11, 1.5 + rp * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Minimal spectrum resonance bars along bottom-right (clear of bottom-left 8-bar HUD)
    const barStartX = Math.max(268, w * 0.45);
    const barCount = 24;
    const barRegionW = Math.max(0, w - 18 - barStartX);
    if (barRegionW > 40) {
      const step = barRegionW / barCount;
      for (let i = 0; i < barCount; i++) {
        const energy = state.isPlaying ? freqData[i * 2] / 255 : 0;
        const barH = 2 + energy * 16 + smoothChord * 3;
        const alpha = state.isPlaying ? 0.25 + energy * 0.55 : 0.14;
        ctx.fillStyle = `rgba(141, 164, 255, ${alpha.toFixed(3)})`;
        ctx.fillRect(barStartX + i * step, h - 14 - barH, Math.max(2, step - 3), barH);
      }
    }

    // Pointer click ripples
    for (let i = state.ripples.length - 1; i >= 0; i--) {
      const rp = state.ripples[i];
      rp.r += 2.2;
      rp.alpha *= 0.96;
      ctx.strokeStyle = `rgba(241, 245, 249, ${rp.alpha.toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      if (rp.r > 12) {
        ctx.strokeStyle = `rgba(141, 164, 255, ${(rp.alpha * 0.55).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.68, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (rp.alpha < 0.02 || rp.r > rp.maxR) {
        state.ripples.splice(i, 1);
      }
    }

    window.requestAnimationFrame(renderFrame);
  };

  window.requestAnimationFrame(renderFrame);
}
