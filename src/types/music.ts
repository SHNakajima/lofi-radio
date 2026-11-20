export type TimbreType = 'felt' | 'concert' | 'chamber';
export type VibeCategory = 'all' | 'focus' | 'daily' | 'relax';
export type SectionType = 'A' | 'A_VAR' | 'B' | 'INTERLUDE' | 'AI';
export type SampleBankKey = 'grand-piano' | 'upright-bass' | 'cello-pad' | 'jazz-kit';
export type DrumVoiceType = 'softKick' | 'brushSweep' | 'brushTap';

export interface MixParameters {
  chords: number;
  drums: number;
  bass: number;
  melody: number;
  warmth: number;
  wow: number;
  vinyl: number;
  rain: number;
  air: number;
  brown: number;
}

export interface ChordVoicing {
  name: string;
  bass: number;
  notes: number[];
  scale: number[];
}

export interface VibePreset {
  id: string;
  name: string;
  sub: string;
  ensembleTag: string;
  category: 'focus' | 'daily' | 'relax';
  desc: string;
  colors: [string, string, string];
  plateColor: string;
  bpm: number;
  swing: number;
  scaleLabel: string;
  timbre: TimbreType;
  mix: MixParameters;
  progressions: ChordVoicing[][];
}

export interface NarrativeNoteEvent {
  bar: number;
  beat: number;
  hand: 'rh' | 'lh' | 'bass' | 'cello' | 'drum';
  midi?: number;
  drumType?: DrumVoiceType;
  durBeats?: number;
  vel?: number;
  rubatoMs?: number;
  label?: string | null;
}

export interface EightBarScore {
  source: 'algorithmic' | 'gemini-ai';
  title?: string;
  subtitle?: string;
  bpm?: number;
  chords?: ChordVoicing[];
  sectionType: SectionType;
  bars: number;
  events: NarrativeNoteEvent[];
  createdAt?: string;
}

export interface SavedPreset {
  name: string;
  vibeId: string;
  bpm: number;
  swing: number;
  timbre: TimbreType;
  mix: MixParameters;
}

export interface RippleParticle {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

export interface AppState {
  isPlaying: boolean;
  activeVibeIndex: number;
  filterCategory: VibeCategory;
  progressionVariant: number;
  lockProgression: boolean;
  currentBarInEight: number;
  currentSixteenthInBar: number;
  totalBarsPlayed: number;
  sectionCycleIdx: number;
  variantSeed: number;
  activeScore: EightBarScore | null;
  queuedAiScore: EightBarScore | null;
  masterVol: number;
  bpm: number;
  swing: number;
  timbre: TimbreType;
  mix: MixParameters;
  visChordPulse: number;
  visMelodyPulse: number;
  lastMelodyMidi: number;
  ripples: RippleParticle[];
  timerRunning: boolean;
  timerPhase: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  timerSecondsLeft: number;
  completedSessions: number;
  savedPresets: SavedPreset[];
  geminiApiKey: string;
  geminiModel: string;
  autoAiCompose: boolean;
  aiComposingNow: boolean;
  savedAiScores: EightBarScore[];
}
