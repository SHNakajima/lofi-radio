import { getActiveProgression, state } from '../state/store';
import { ChordVoicing, EightBarScore, NarrativeNoteEvent, SectionType, VibePreset } from '../types/music';

export function buildEightBarNarrativeScore(
  vibe: VibePreset,
  sectionType: SectionType = 'A',
  variantSeed = 0
): EightBarScore {
  const prog = vibe.progressions[state.progressionVariant % vibe.progressions.length];
  const events: NarrativeNoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const chord = prog[bar % prog.length];
    const scale = chord.scale;
    const midIdx = Math.min(scale.length - 1, Math.floor(scale.length * 0.45));
    const highIdx = Math.min(scale.length - 1, Math.floor(scale.length * 0.75));

    let barRole = 'statement';
    if (sectionType === 'INTERLUDE') {
      barRole = bar === 1 || bar === 5 ? 'sparse_sing' : 'breathing_rest';
    } else {
      if (bar === 0) barRole = 'statement';
      else if (bar === 1) barRole = 'sustain_and_turn';
      else if (bar === 2) barRole = 'answer_phrase';
      else if (bar === 3) barRole = 'breathing_rest';
      else if (bar === 4) barRole = 'climax_leap';
      else if (bar === 5) barRole = 'stepwise_sigh';
      else if (bar === 6) barRole = 'cadence_long';
      else barRole = 'breathing_rest';
    }

    const shift = (sectionType === 'B' ? 2 : 0) + ((variantSeed % 3) - 1);
    const pickScaleMidi = (degOffset: number): number => {
      const idx = Math.max(0, Math.min(scale.length - 1, degOffset + shift));
      return scale[idx];
    };

    // 1. RIGHT-HAND MELODY PHRASING
    if (barRole === 'statement') {
      events.push({
        bar,
        beat: 0.0,
        hand: 'rh',
        midi: pickScaleMidi(midIdx),
        durBeats: 1.6,
        vel: 0.76,
        rubatoMs: 12,
        label: '● THEME MOTIF'
      });
      events.push({
        bar,
        beat: 1.5,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 1),
        durBeats: 0.65,
        vel: 0.64,
        rubatoMs: 24,
        label: '● THEME MOTIF'
      });
      events.push({
        bar,
        beat: 2.0,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 3),
        durBeats: 2.4,
        vel: 0.84,
        rubatoMs: -6,
        label: '● SINGING LEAP'
      });
      events.push({
        bar,
        beat: 3.5,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 2),
        durBeats: 0.6,
        vel: 0.60,
        rubatoMs: 28,
        label: '● PICKUP (弱起)'
      });
    } else if (barRole === 'sustain_and_turn') {
      const targetMidi = pickScaleMidi(midIdx + 4);
      events.push({
        bar,
        beat: 0.0,
        hand: 'rh',
        midi: targetMidi,
        durBeats: 3.1,
        vel: 0.86,
        rubatoMs: 15,
        label: '● LONG SUSTAIN'
      });
      if (sectionType === 'B') {
        events.push({
          bar,
          beat: 0.04,
          hand: 'rh',
          midi: pickScaleMidi(midIdx + 1),
          durBeats: 2.9,
          vel: 0.52,
          rubatoMs: 25,
          label: '● HARMONY SIXTH'
        });
      }
      events.push({
        bar,
        beat: 3.25,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 3),
        durBeats: 0.8,
        vel: 0.62,
        rubatoMs: 30,
        label: '● RUBATO TURN'
      });
    } else if (barRole === 'answer_phrase') {
      events.push({
        bar,
        beat: 0.42,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 1),
        durBeats: 0.25,
        vel: 0.48,
        rubatoMs: -10,
        label: '● GRACE NOTE'
      });
      events.push({
        bar,
        beat: 0.5,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 2),
        durBeats: 1.8,
        vel: 0.78,
        rubatoMs: 18,
        label: '● ANSWER PHRASE'
      });
      events.push({
        bar,
        beat: 2.25,
        hand: 'rh',
        midi: pickScaleMidi(midIdx),
        durBeats: 2.6,
        vel: 0.70,
        rubatoMs: 28,
        label: '● LONG RESOLUTION'
      });
    } else if (barRole === 'climax_leap') {
      events.push({
        bar,
        beat: 0.0,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 1),
        durBeats: 0.9,
        vel: 0.68,
        rubatoMs: 14,
        label: '● RISING LINE'
      });
      events.push({
        bar,
        beat: 1.0,
        hand: 'rh',
        midi: pickScaleMidi(highIdx),
        durBeats: 2.8,
        vel: 0.90,
        rubatoMs: -8,
        label: '● EMOTIONAL CLIMAX'
      });
      events.push({
        bar,
        beat: 1.05,
        hand: 'rh',
        midi: pickScaleMidi(Math.max(0, highIdx - 3)),
        durBeats: 2.6,
        vel: 0.54,
        rubatoMs: 18,
        label: '● EMOTIONAL CLIMAX'
      });
      events.push({
        bar,
        beat: 3.5,
        hand: 'rh',
        midi: pickScaleMidi(highIdx - 1),
        durBeats: 0.6,
        vel: 0.66,
        rubatoMs: 26,
        label: '● PICKUP (弱起)'
      });
    } else if (barRole === 'stepwise_sigh') {
      events.push({
        bar,
        beat: 0.0,
        hand: 'rh',
        midi: pickScaleMidi(highIdx - 2),
        durBeats: 1.5,
        vel: 0.80,
        rubatoMs: 16,
        label: '● STEPWISE DESCENT'
      });
      events.push({
        bar,
        beat: 1.5,
        hand: 'rh',
        midi: pickScaleMidi(highIdx - 3),
        durBeats: 1.0,
        vel: 0.72,
        rubatoMs: 22,
        label: '● STEPWISE DESCENT'
      });
      events.push({
        bar,
        beat: 2.5,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 1),
        durBeats: 1.8,
        vel: 0.68,
        rubatoMs: 30,
        label: '● GENTLE SIGH'
      });
    } else if (barRole === 'cadence_long') {
      events.push({
        bar,
        beat: 0.0,
        hand: 'rh',
        midi: pickScaleMidi(midIdx),
        durBeats: 4.5,
        vel: 0.76,
        rubatoMs: 22,
        label: '● CADENCE SUSTAIN'
      });
    } else if (barRole === 'sparse_sing') {
      events.push({
        bar,
        beat: 1.0,
        hand: 'rh',
        midi: pickScaleMidi(midIdx + 2),
        durBeats: 3.5,
        vel: 0.72,
        rubatoMs: 28,
        label: '● INTERLUDE BLOOM'
      });
    }

    // 2. CONVERSATIONAL LEFT-HAND VOICING & COUNTER-MELODY
    const notes = chord.notes;
    if (barRole === 'breathing_rest' || barRole === 'cadence_long' || barRole === 'sustain_and_turn') {
      const pattern = [
        { beat: 0.0, nIdx: 0, dur: 4.0, vel: 0.50 },
        { beat: 0.75, nIdx: 1, dur: 3.2, vel: 0.44 },
        { beat: 1.5, nIdx: 2, dur: 2.8, vel: 0.48 },
        { beat: 2.25, nIdx: 3, dur: 2.4, vel: 0.52 },
        { beat: 3.0, nIdx: 4 % notes.length, dur: 2.0, vel: 0.46 }
      ];
      pattern.forEach((p) => {
        events.push({
          bar,
          beat: p.beat,
          hand: 'lh',
          midi: notes[p.nIdx % notes.length],
          durBeats: p.dur,
          vel: p.vel,
          rubatoMs: 18,
          label: barRole === 'breathing_rest' ? '○ BREATHING SPACE (LH DIALOGUE)' : null
        });
      });
    } else {
      notes.slice(0, 3).forEach((m, fingerIdx) => {
        events.push({
          bar,
          beat: fingerIdx * 0.06,
          hand: 'lh',
          midi: m,
          durBeats: 3.8,
          vel: 0.42 - fingerIdx * 0.03,
          rubatoMs: fingerIdx * 12
        });
      });
      if (notes.length > 3) {
        events.push({
          bar,
          beat: 2.5,
          hand: 'lh',
          midi: notes[3],
          durBeats: 1.8,
          vel: 0.38,
          rubatoMs: 24
        });
      }
    }

    // 3. CONTRABASS PIZZICATO
    events.push({
      bar,
      beat: 0.0,
      hand: 'bass',
      midi: chord.bass,
      durBeats: 2.4,
      vel: 0.72,
      rubatoMs: 8
    });
    const nextChord = prog[(bar + 1) % prog.length];
    const fifthMidi = chord.bass + 7 <= 45 ? chord.bass + 7 : chord.bass - 5;
    events.push({
      bar,
      beat: 2.0,
      hand: 'bass',
      midi: fifthMidi,
      durBeats: 1.6,
      vel: 0.54,
      rubatoMs: 16
    });
    if (bar % 2 === 1) {
      const approachMidi = nextChord.bass > chord.bass ? nextChord.bass - 1 : nextChord.bass + 2;
      events.push({
        bar,
        beat: 3.5,
        hand: 'bass',
        midi: Math.max(30, Math.min(45, approachMidi)),
        durBeats: 0.6,
        vel: 0.48,
        rubatoMs: 22
      });
    }

    // 4. CHAMBER CELLO SUSTAIN
    if (sectionType === 'B' || state.timbre === 'chamber') {
      const celloMidi = notes[1] || chord.bass + 12;
      events.push({
        bar,
        beat: 0.2,
        hand: 'cello',
        midi: celloMidi,
        durBeats: 3.6,
        vel: 0.45,
        rubatoMs: 30
      });
    }

    // 5. ULTRA-SOFT JAZZ BRUSHES
    events.push({ bar, beat: 0.0, hand: 'drum', drumType: 'softKick', vel: 0.55 });
    events.push({ bar, beat: 1.0, hand: 'drum', drumType: 'brushSweep', vel: 0.65 });
    events.push({ bar, beat: 2.0, hand: 'drum', drumType: 'brushTap', vel: 0.45 });
    events.push({ bar, beat: 2.5, hand: 'drum', drumType: 'brushTap', vel: 0.38 });
    events.push({ bar, beat: 3.0, hand: 'drum', drumType: 'brushSweep', vel: 0.60 });
    if (bar % 2 === 1) {
      events.push({ bar, beat: 3.5, hand: 'drum', drumType: 'brushTap', vel: 0.42 });
    }
  }

  return {
    source: 'algorithmic',
    sectionType,
    bars: 8,
    events
  };
}

export interface RawAiScoreResponse {
  title?: string;
  subtitle?: string;
  bpm?: number;
  chords?: ChordVoicing[];
  melodyEvents?: Array<{
    bar: number;
    beat: number;
    midi: number;
    durBeats: number;
    vel: number;
    rubatoMs: number;
    label?: string;
  }>;
}

export function convertAiJsonToPlayableScore(aiData: RawAiScoreResponse): EightBarScore {
  const chords =
    Array.isArray(aiData.chords) && aiData.chords.length >= 4
      ? aiData.chords.slice(0, 4)
      : getActiveProgression();

  const events: NarrativeNoteEvent[] = [];
  const barsWithRh = new Set<number>();

  if (Array.isArray(aiData.melodyEvents)) {
    aiData.melodyEvents.forEach((m) => {
      const bar = Math.max(0, Math.min(7, Number(m.bar) || 0));
      barsWithRh.add(bar);
      events.push({
        bar,
        beat: Math.max(0, Math.min(3.85, Number(m.beat) || 0)),
        hand: 'rh',
        midi: Math.max(55, Math.min(84, Number(m.midi) || 67)),
        durBeats: Math.max(0.25, Math.min(5.0, Number(m.durBeats) || 1.8)),
        vel: Math.max(0.35, Math.min(0.95, Number(m.vel) || 0.78)),
        rubatoMs: Number(m.rubatoMs) || 16,
        label: m.label || '● AI RUBATO PHRASE'
      });
    });
  }

  for (let bar = 0; bar < 8; bar++) {
    const ch = chords[bar % chords.length];
    const rhActive = barsWithRh.has(bar);

    if (!rhActive) {
      const dialogBeats = [0.0, 0.75, 1.5, 2.25, 3.0];
      dialogBeats.forEach((b, i) => {
        events.push({
          bar,
          beat: b,
          hand: 'lh',
          midi: ch.notes[i % ch.notes.length],
          durBeats: 3.2 - i * 0.3,
          vel: 0.48,
          rubatoMs: 20,
          label: '○ AI BREATHING SPACE (LH DIALOGUE)'
        });
      });
    } else {
      ch.notes.slice(0, 3).forEach((n, i) => {
        events.push({
          bar,
          beat: i * 0.06,
          hand: 'lh',
          midi: n,
          durBeats: 3.8,
          vel: 0.42 - i * 0.03,
          rubatoMs: i * 12
        });
      });
      if (ch.notes.length > 3) {
        events.push({
          bar,
          beat: 2.5,
          hand: 'lh',
          midi: ch.notes[3],
          durBeats: 1.8,
          vel: 0.38,
          rubatoMs: 24
        });
      }
    }

    events.push({ bar, beat: 0.0, hand: 'bass', midi: ch.bass, durBeats: 2.4, vel: 0.70, rubatoMs: 10 });
    events.push({ bar, beat: 2.0, hand: 'bass', midi: Math.min(45, ch.bass + 7), durBeats: 1.6, vel: 0.52, rubatoMs: 18 });

    if (bar >= 4 && state.timbre === 'chamber') {
      events.push({ bar, beat: 0.2, hand: 'cello', midi: ch.notes[1] || ch.bass + 12, durBeats: 3.5, vel: 0.44, rubatoMs: 28 });
    }

    events.push({ bar, beat: 0.0, hand: 'drum', drumType: 'softKick', vel: 0.52 });
    events.push({ bar, beat: 1.0, hand: 'drum', drumType: 'brushSweep', vel: 0.62 });
    events.push({ bar, beat: 2.0, hand: 'drum', drumType: 'brushTap', vel: 0.42 });
    events.push({ bar, beat: 3.0, hand: 'drum', drumType: 'brushSweep', vel: 0.58 });
  }

  return {
    source: 'gemini-ai',
    title: aiData.title || 'Gemini Nocturne Arrangement',
    subtitle: aiData.subtitle || 'AI編曲・8小節ルバート変奏',
    bpm: Math.max(50, Math.min(78, Number(aiData.bpm) || state.bpm)),
    chords,
    sectionType: 'AI',
    bars: 8,
    events,
    createdAt: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  };
}
