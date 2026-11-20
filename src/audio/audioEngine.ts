import { state } from '../state/store';
import { DrumVoiceType } from '../types/music';
import { ensureSampleBanksLoaded, findClosestSample, getDecodedJazzKit, isBankLoaded } from './sampleCache';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let pianoSoundboardFilter: BiquadFilterNode | null = null;
let toneWarmthFilter: BiquadFilterNode | null = null;
let hallConvolver: ConvolverNode | null = null;
let reverbWetGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let tapeDelayNode: DelayNode | null = null;
let wowLfo: OscillatorNode | null = null;
let wowLfoGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

let vinylGainNode: GainNode | null = null;
let rainGainNode: GainNode | null = null;
let airGainNode: GainNode | null = null;
let brownGainNode: GainNode | null = null;

function createWarmHallImpulse(ctx: AudioContext, durationSec = 3.3, decayRate = 2.5): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = ctx.createBuffer(2, length, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const fadeIn = Math.min(1.0, t / 0.022);
      const env = fadeIn * Math.exp(-t * decayRate);
      const white = Math.random() * 2 - 1;
      lp = 0.89 * lp + 0.11 * white;
      data[i] = lp * env * 0.62;
    }
  }
  return impulse;
}

export function initAudioEngine(): AudioContext {
  if (audioCtx) return audioCtx;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new AudioContextClass();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = (state.masterVol / 100) * 0.9;

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.88;

  pianoSoundboardFilter = audioCtx.createBiquadFilter();
  pianoSoundboardFilter.type = 'peaking';
  pianoSoundboardFilter.frequency.value = 240;
  pianoSoundboardFilter.Q.value = 0.75;
  pianoSoundboardFilter.gain.value = 2.5;

  toneWarmthFilter = audioCtx.createBiquadFilter();
  toneWarmthFilter.type = 'lowpass';
  toneWarmthFilter.frequency.value = state.mix.warmth;
  toneWarmthFilter.Q.value = 0.25;

  tapeDelayNode = audioCtx.createDelay(0.1);
  tapeDelayNode.delayTime.value = 0.012;

  wowLfo = audioCtx.createOscillator();
  wowLfo.type = 'sine';
  wowLfo.frequency.value = 0.33;
  wowLfoGain = audioCtx.createGain();
  wowLfoGain.gain.value = (state.mix.wow / 100) * 0.0011;
  wowLfo.connect(wowLfoGain);
  wowLfoGain.connect(tapeDelayNode.delayTime);
  wowLfo.start();

  hallConvolver = audioCtx.createConvolver();
  hallConvolver.buffer = createWarmHallImpulse(audioCtx, 3.3, 2.5);

  dryGain = audioCtx.createGain();
  dryGain.gain.value = 0.82;

  reverbWetGain = audioCtx.createGain();
  reverbWetGain.gain.value = 0.48;

  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 24;
  compressor.ratio.value = 2.0;
  compressor.attack.value = 0.035;
  compressor.release.value = 0.28;

  pianoSoundboardFilter.connect(toneWarmthFilter);
  toneWarmthFilter.connect(tapeDelayNode);

  tapeDelayNode.connect(dryGain);
  tapeDelayNode.connect(hallConvolver);
  hallConvolver.connect(reverbWetGain);

  dryGain.connect(compressor);
  reverbWetGain.connect(compressor);

  compressor.connect(masterGain);
  masterGain.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  setupAmbientGenerators(audioCtx, masterGain);
  syncAudioParamsFromState();
  return audioCtx;
}

export function getAudioContext(): AudioContext | null {
  return audioCtx;
}

export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode;
}

function setupAmbientGenerators(ctx: AudioContext, destination: AudioNode): void {
  const sampleRate = ctx.sampleRate;
  const bufferLength = sampleRate * 5;

  const vinylBuffer = ctx.createBuffer(2, bufferLength, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = vinylBuffer.getChannelData(ch);
    let hiss = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      hiss = 0.95 * hiss + 0.05 * white;
      let sample = hiss * 0.032;
      const r = Math.random();
      if (r > 0.9996) sample += (Math.random() * 2 - 1) * 0.32;
      else if (r > 0.998) sample += (Math.random() * 2 - 1) * 0.09;
      data[i] = sample;
    }
  }
  const vinylSource = ctx.createBufferSource();
  vinylSource.buffer = vinylBuffer;
  vinylSource.loop = true;
  const vinylFilter = ctx.createBiquadFilter();
  vinylFilter.type = 'bandpass';
  vinylFilter.frequency.value = 1850;
  vinylFilter.Q.value = 0.6;
  vinylGainNode = ctx.createGain();
  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGainNode);
  vinylGainNode.connect(destination);
  vinylSource.start();

  const rainBuffer = ctx.createBuffer(2, bufferLength, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = rainBuffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.996 * b0 + white * 0.024;
      b1 = 0.982 * b1 + white * 0.028;
      b2 = 0.935 * b2 + white * 0.036;
      data[i] = (b0 + b1 + b2) * 0.2;
    }
  }
  const rainSource = ctx.createBufferSource();
  rainSource.buffer = rainBuffer;
  rainSource.loop = true;
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = 'lowpass';
  rainFilter.frequency.value = 1250;
  rainGainNode = ctx.createGain();
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGainNode);
  rainGainNode.connect(destination);
  rainSource.start();

  const airBuffer = ctx.createBuffer(2, bufferLength, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = airBuffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.028 * white) / 1.028;
      data[i] = last;
    }
  }
  const airSource = ctx.createBufferSource();
  airSource.buffer = airBuffer;
  airSource.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'bandpass';
  airFilter.frequency.value = 360;
  airFilter.Q.value = 0.5;
  airGainNode = ctx.createGain();
  airSource.connect(airFilter);
  airFilter.connect(airGainNode);
  airGainNode.connect(destination);
  airSource.start();

  const brownBuffer = ctx.createBuffer(2, bufferLength, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = brownBuffer.getChannelData(ch);
    let lastOut = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.018 * white) / 1.018;
      lastOut = data[i];
      data[i] *= 1.4;
    }
  }
  const brownSource = ctx.createBufferSource();
  brownSource.buffer = brownBuffer;
  brownSource.loop = true;
  const brownFilter = ctx.createBiquadFilter();
  brownFilter.type = 'lowpass';
  brownFilter.frequency.value = 230;
  brownGainNode = ctx.createGain();
  brownSource.connect(brownFilter);
  brownFilter.connect(brownGainNode);
  brownGainNode.connect(destination);
  brownSource.start();
}

export function syncAudioParamsFromState(): void {
  if (!audioCtx || !masterGain || !toneWarmthFilter || !wowLfoGain) return;
  const now = audioCtx.currentTime;
  masterGain.gain.setTargetAtTime((state.masterVol / 100) * 0.9, now, 0.05);

  const effectiveWarmth =
    state.timerRunning && state.timerPhase === 'break'
      ? Math.min(state.mix.warmth, 1600)
      : state.mix.warmth;
  toneWarmthFilter.frequency.setTargetAtTime(effectiveWarmth, now, 0.1);
  wowLfoGain.gain.setTargetAtTime((state.mix.wow / 100) * 0.0011, now, 0.08);

  if (vinylGainNode) vinylGainNode.gain.setTargetAtTime(Math.pow(state.mix.vinyl / 100, 1.6) * 0.13, now, 0.08);
  if (rainGainNode) rainGainNode.gain.setTargetAtTime(Math.pow(state.mix.rain / 100, 1.5) * 0.22, now, 0.08);
  if (airGainNode) airGainNode.gain.setTargetAtTime(Math.pow(state.mix.air / 100, 1.5) * 0.15, now, 0.08);
  if (brownGainNode) brownGainNode.gain.setTargetAtTime(Math.pow(state.mix.brown / 100, 1.6) * 0.18, now, 0.08);
}

export function playRealGrandPianoSample(
  midi: number,
  time: number,
  sustainSec: number,
  velocity: number,
  isLeadMelody = false
): void {
  if (!audioCtx || !pianoSoundboardFilter || !isBankLoaded('grand-piano')) return;
  const sampleMatch = findClosestSample('grand-piano', midi);
  if (!sampleMatch) return;

  const busMix = isLeadMelody ? state.mix.melody / 100 : Math.pow(state.mix.chords / 100, 1.15);
  const gainLevel = busMix * velocity * (isLeadMelody ? 0.92 : 0.42);
  if (gainLevel <= 0.001) return;

  const src = audioCtx.createBufferSource();
  src.buffer = sampleMatch.buffer;
  src.playbackRate.setValueAtTime(sampleMatch.playbackRate, time);

  const voiceFilter = audioCtx.createBiquadFilter();
  voiceFilter.type = 'lowpass';
  const feltMultiplier = state.timbre === 'felt' ? 0.65 : state.timbre === 'chamber' ? 0.82 : 1.15;
  const baseCutoff = isLeadMelody
    ? (1600 + velocity * 3400) * feltMultiplier
    : (950 + velocity * 1800) * feltMultiplier;
  voiceFilter.frequency.setValueAtTime(Math.min(8000, baseCutoff), time);
  voiceFilter.frequency.exponentialRampToValueAtTime(
    Math.max(480, baseCutoff * 0.42),
    time + Math.max(1.2, sustainSec + 1.0)
  );

  const env = audioCtx.createGain();
  const attackSec = isLeadMelody ? 0.004 : 0.012;
  const releaseTail = isLeadMelody ? 1.8 : 2.1;
  const offTime = time + Math.max(0.8, sustainSec) + releaseTail;

  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gainLevel, time + attackSec);
  env.gain.setValueAtTime(gainLevel, time + Math.max(attackSec + 0.05, sustainSec * 0.75));
  env.gain.exponentialRampToValueAtTime(0.0002, offTime);

  const panner = audioCtx.createStereoPanner();
  panner.pan.value = Math.max(-0.42, Math.min(0.42, ((midi - 60) / 36) * 0.38));

  src.connect(voiceFilter);
  voiceFilter.connect(env);
  env.connect(panner);
  panner.connect(pianoSoundboardFilter);

  src.start(time);
  src.stop(offTime + 0.05);
}

export function playRealContrabassSample(midi: number, time: number, sustainSec: number, velocity = 0.65): void {
  if (!audioCtx || !pianoSoundboardFilter || state.mix.bass <= 0) return;
  if (!isBankLoaded('upright-bass')) {
    void ensureSampleBanksLoaded(audioCtx, ['upright-bass']);
    return;
  }
  const sampleMatch = findClosestSample('upright-bass', midi);
  if (!sampleMatch) return;

  const gainLevel = Math.pow(state.mix.bass / 100, 1.1) * velocity * 0.85;
  if (gainLevel <= 0.001) return;

  const src = audioCtx.createBufferSource();
  src.buffer = sampleMatch.buffer;
  src.playbackRate.setValueAtTime(sampleMatch.playbackRate, time);

  const bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.setValueAtTime(520, time);
  bassFilter.frequency.exponentialRampToValueAtTime(220, time + sustainSec + 0.5);

  const env = audioCtx.createGain();
  const offTime = time + sustainSec + 0.75;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gainLevel, time + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0003, offTime);

  src.connect(bassFilter);
  bassFilter.connect(env);
  env.connect(pianoSoundboardFilter);

  src.start(time);
  src.stop(offTime + 0.05);
}

export function playRealCelloSample(midi: number, time: number, sustainSec: number, velocity = 0.45): void {
  if (!audioCtx || !pianoSoundboardFilter || state.mix.chords <= 0) return;
  if (!isBankLoaded('cello-pad')) {
    void ensureSampleBanksLoaded(audioCtx, ['cello-pad']);
    return;
  }
  const sampleMatch = findClosestSample('cello-pad', midi);
  if (!sampleMatch) return;

  const gainLevel = (state.mix.chords / 100) * velocity * 0.36;
  if (gainLevel <= 0.001) return;

  const src = audioCtx.createBufferSource();
  src.buffer = sampleMatch.buffer;
  src.playbackRate.setValueAtTime(sampleMatch.playbackRate, time);

  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(950, time);

  const env = audioCtx.createGain();
  const offTime = time + sustainSec + 1.2;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gainLevel, time + 0.45);
  env.gain.exponentialRampToValueAtTime(0.0002, offTime);

  src.connect(lp);
  lp.connect(env);
  env.connect(pianoSoundboardFilter);

  src.start(time);
  src.stop(offTime + 0.05);
}

export function playRealJazzKitSample(drumType: DrumVoiceType, time: number, velocity = 0.5): void {
  if (!audioCtx || !pianoSoundboardFilter || state.mix.drums <= 0) return;
  if (state.timerRunning && state.timerPhase === 'break') return;
  if (!isBankLoaded('jazz-kit')) {
    void ensureSampleBanksLoaded(audioCtx, ['jazz-kit']);
    return;
  }

  const kit = getDecodedJazzKit();
  if (!kit) return;
  const mixScale = Math.pow(state.mix.drums / 100, 1.25);

  if (drumType === 'softKick') {
    const buf = kit.softKick || kit.kick;
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.setValueAtTime(0.88, time);

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, time);

    const env = audioCtx.createGain();
    const level = mixScale * velocity * 0.35;
    env.gain.setValueAtTime(level, time);
    env.gain.exponentialRampToValueAtTime(0.0002, time + 0.28);

    src.connect(lp);
    lp.connect(env);
    env.connect(pianoSoundboardFilter);
    src.start(time);
    src.stop(time + 0.3);
  } else if (drumType === 'brushSweep') {
    const buf = kit.snare || kit.hihat;
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.setValueAtTime(0.92, time);

    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1450, time);
    bp.Q.value = 0.8;

    const env = audioCtx.createGain();
    const level = mixScale * velocity * 0.22;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(level, time + 0.028);
    env.gain.exponentialRampToValueAtTime(0.0002, time + 0.22);

    src.connect(bp);
    bp.connect(env);
    env.connect(pianoSoundboardFilter);
    src.start(time);
    src.stop(time + 0.25);
  } else {
    const buf = kit.brushTap || kit.hihat;
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.setValueAtTime(1.05, time);

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, time);

    const env = audioCtx.createGain();
    const level = mixScale * velocity * 0.16;
    env.gain.setValueAtTime(level, time);
    env.gain.exponentialRampToValueAtTime(0.0002, time + 0.12);

    src.connect(lp);
    lp.connect(env);
    env.connect(pianoSoundboardFilter);
    src.start(time);
    src.stop(time + 0.14);
  }
}
