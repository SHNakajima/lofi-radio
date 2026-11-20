import { DEFAULT_SAVED_PRESETS, VIBES } from '../data/vibes';
import { AppState, ChordVoicing, VibePreset } from '../types/music';

export const state: AppState = {
  isPlaying: false,
  activeVibeIndex: 0,
  filterCategory: 'all',
  progressionVariant: 0,
  lockProgression: false,
  currentBarInEight: 0,
  currentSixteenthInBar: 0,
  totalBarsPlayed: 1,
  sectionCycleIdx: 0,
  variantSeed: 0,
  activeScore: null,
  queuedAiScore: null,
  masterVol: 80,
  bpm: 62,
  swing: 58,
  timbre: 'felt',
  mix: {
    chords: 44,
    drums: 16,
    bass: 48,
    melody: 88,
    warmth: 2400,
    wow: 12,
    vinyl: 14,
    rain: 16,
    air: 15,
    brown: 8
  },
  visChordPulse: 0,
  visMelodyPulse: 0,
  lastMelodyMidi: 65,
  ripples: [],
  timerRunning: false,
  timerPhase: 'work',
  workMinutes: 25,
  breakMinutes: 5,
  timerSecondsLeft: 25 * 60,
  completedSessions: 0,
  savedPresets: [],
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  autoAiCompose: false,
  aiComposingNow: false,
  savedAiScores: []
};

export function getActiveVibe(): VibePreset {
  return VIBES[state.activeVibeIndex] || VIBES[0];
}

export function getActiveProgression(): ChordVoicing[] {
  const vibe = getActiveVibe();
  return vibe.progressions[state.progressionVariant % vibe.progressions.length];
}

export function getCurrentChordObj(): ChordVoicing {
  const prog = getActiveProgression();
  return prog[state.currentBarInEight % prog.length];
}

export function loadLocalState(): void {
  try {
    const rawPresets = localStorage.getItem('aether_lofi_presets_v4');
    if (rawPresets) {
      const parsed = JSON.parse(rawPresets);
      if (Array.isArray(parsed) && parsed.length > 0) state.savedPresets = parsed;
    }
  } catch {}
  if (state.savedPresets.length === 0) {
    state.savedPresets = JSON.parse(JSON.stringify(DEFAULT_SAVED_PRESETS));
  }

  try {
    const key = localStorage.getItem('aether_gemini_api_key_v4');
    if (key) state.geminiApiKey = key;
    const savedScores = localStorage.getItem('aether_ai_scores_v4');
    if (savedScores) {
      const parsed = JSON.parse(savedScores);
      if (Array.isArray(parsed)) state.savedAiScores = parsed;
    }
  } catch {}
}

export function persistSavedPresets(): void {
  try {
    localStorage.setItem('aether_lofi_presets_v4', JSON.stringify(state.savedPresets));
  } catch {}
}

export function persistAiScores(): void {
  try {
    localStorage.setItem('aether_ai_scores_v4', JSON.stringify(state.savedAiScores));
  } catch {}
}
