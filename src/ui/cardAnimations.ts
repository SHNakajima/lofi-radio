import { VIBES } from '../data/vibes';
import { state } from '../state/store';
import { prefersReducedMotion, renderMoodScene } from './moodScenes';

interface CardCanvasEntry {
  vibeId: string;
  plateColor: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  activity: number;
  settled: boolean;
  width: number;
  height: number;
}

const entries: CardCanvasEntry[] = [];
let hoveredVibeId: string | null = null;
let rafId: number | null = null;
let lastFrameMs = 0;
let animTime = 0;
let smoothPulse = 0;

function canHoverFine(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

function syncCanvasResolution(entry: CardCanvasEntry): boolean {
  const rect = entry.canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (entry.canvas.width !== targetW || entry.canvas.height !== targetH) {
    entry.canvas.width = targetW;
    entry.canvas.height = targetH;
  }
  entry.width = rect.width;
  entry.height = rect.height;
  entry.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function renderEntry(entry: CardCanvasEntry, activeVibeId: string): void {
  if (!syncCanvasResolution(entry)) return;
  const { ctx, width: w, height: h, plateColor, vibeId } = entry;

  ctx.fillStyle = plateColor;
  ctx.fillRect(0, 0, w, h);

  const reduced = prefersReducedMotion();
  renderMoodScene(ctx, vibeId, {
    w,
    h,
    t: reduced ? 0 : animTime,
    motion: reduced ? 0 : entry.activity,
    melody: vibeId === activeVibeId ? smoothPulse : 0,
    chord: 0,
    mode: 'card'
  });
}

/**
 * Registers all mood card canvases currently mounted inside `#vibeGrid`,
 * binds hover/focus listeners (respecting fine-pointer hover), and draws initial frames.
 */
export function registerVibeCardCanvases(container: HTMLElement): void {
  entries.length = 0;
  const canvases = container.querySelectorAll<HTMLCanvasElement>('canvas.vibe-card-canvas');
  const activeVibeId = VIBES[state.activeVibeIndex]?.id ?? VIBES[0].id;
  const allowHover = canHoverFine();

  canvases.forEach((canvas) => {
    const vibeId = canvas.dataset.vibeId || '';
    const vibe = VIBES.find((v) => v.id === vibeId) ?? VIBES[0];
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isInitialActive = vibe.id === activeVibeId || vibe.id === hoveredVibeId;
    const entry: CardCanvasEntry = {
      vibeId: vibe.id,
      plateColor: vibe.plateColor,
      canvas,
      ctx,
      activity: isInitialActive ? 1 : 0,
      settled: false,
      width: 0,
      height: 0
    };
    entries.push(entry);

    const cardBtn = canvas.closest('button');
    if (cardBtn) {
      if (allowHover) {
        cardBtn.addEventListener('pointerenter', (e) => {
          if (e.pointerType !== 'mouse') return;
          hoveredVibeId = vibe.id;
          entry.settled = false;
        });
        cardBtn.addEventListener('pointerleave', (e) => {
          if (e.pointerType !== 'mouse') return;
          if (hoveredVibeId === vibe.id) hoveredVibeId = null;
          entry.settled = false;
        });
      }
      cardBtn.addEventListener('focus', () => {
        hoveredVibeId = vibe.id;
        entry.settled = false;
      });
      cardBtn.addEventListener('blur', () => {
        if (hoveredVibeId === vibe.id) hoveredVibeId = null;
        entry.settled = false;
      });
    }

    renderEntry(entry, activeVibeId);
    entry.settled = !isInitialActive;
  });
}

/**
 * Marks all registered card canvases as needing a fresh render (e.g., on window resize).
 */
export function invalidateVibeCardCanvases(): void {
  for (const entry of entries) {
    entry.settled = false;
  }
}

/**
 * Starts the single requestAnimationFrame loop driving active and hovered card animations.
 * Idle cards remain drawn at their calm resting pose with zero per-frame redraw overhead.
 */
export function startCardAnimationsLoop(): void {
  if (rafId !== null) return;
  lastFrameMs = performance.now();

  const tick = (nowMs: number) => {
    const dt = Math.min(0.05, Math.max(0, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;

    const bpmFactor = (state.isPlaying ? state.bpm : 58) / 60;
    animTime += dt * bpmFactor;

    const targetPulse = state.isPlaying ? state.visMelodyPulse : 0;
    smoothPulse += (targetPulse - smoothPulse) * Math.min(1, dt * 10);

    const activeVibeId = VIBES[state.activeVibeIndex]?.id ?? VIBES[0].id;
    const reduced = prefersReducedMotion();

    for (const entry of entries) {
      const isEngaged = entry.vibeId === activeVibeId || entry.vibeId === hoveredVibeId;
      const targetActivity = isEngaged ? 1 : 0;

      if (reduced) {
        entry.activity = targetActivity;
      } else {
        entry.activity += (targetActivity - entry.activity) * Math.min(1, dt * 5);
        if (!isEngaged && entry.activity < 0.01) {
          entry.activity = 0;
        }
      }

      if (isEngaged || entry.activity > 0 || !entry.settled) {
        renderEntry(entry, activeVibeId);
        entry.settled = !isEngaged && entry.activity === 0;
      }
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);
}
