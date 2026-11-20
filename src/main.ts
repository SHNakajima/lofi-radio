import './style.css';
import { requestGeminiScore } from './ai/geminiComposer';
import {
  getAudioContext,
  initAudioEngine,
  playRealCelloSample,
  playRealContrabassSample,
  playRealGrandPianoSample,
  playRealJazzKitSample,
  syncAudioParamsFromState
} from './audio/audioEngine';
import {
  ALL_BANK_KEYS,
  ensureSampleBanksLoaded,
  getRequiredBanksForVibe,
  isBankLoaded
} from './audio/sampleCache';
import { SECTION_ROTATION, VIBES } from './data/vibes';
import { buildEightBarNarrativeScore } from './music/narrativeComposer';
import {
  getActiveProgression,
  getActiveVibe,
  getCurrentChordObj,
  loadLocalState,
  persistAiScores,
  persistSavedPresets,
  state
} from './state/store';
import { EightBarScore, TimbreType, VibeCategory } from './types/music';
import {
  invalidateVibeCardCanvases,
  registerVibeCardCanvases,
  startCardAnimationsLoop
} from './ui/cardAnimations';
import {
  initVisualizerParticles,
  resizeVisualizerCanvas,
  startVisualizerLoop
} from './ui/visualizer';

let schedulerTimerId: number | null = null;
let nextSixteenthTime = 0;
const lookaheadMs = 25.0;
const scheduleAheadSec = 0.12;
let timerIntervalId: number | null = null;
let toastHideTimer: number | null = null;

function setLoaderOverlay(info: {
  visible: boolean;
  title?: string;
  detail?: string;
  completed?: number;
  total?: number;
  fromCacheCount?: number;
}): void {
  const overlay = document.getElementById('sampleLoaderOverlay');
  if (!overlay) return;
  if (!info.visible) {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    updateHeaderCacheStatus();
    renderVibeGrid();
    return;
  }
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');

  const completed = info.completed ?? 0;
  const total = info.total ?? 1;
  const fromCache = info.fromCacheCount ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const titleEl = document.getElementById('loaderTitleText');
  const detailEl = document.getElementById('loaderDetailText');
  const countEl = document.getElementById('loaderCountText');
  const pctEl = document.getElementById('loaderPercentText');
  const barEl = document.getElementById('loaderProgressBar');
  const badgeEl = document.getElementById('loaderSourceBadge');

  if (titleEl && info.title) titleEl.textContent = info.title;
  if (detailEl && info.detail) detailEl.textContent = info.detail;
  if (countEl) countEl.textContent = `${completed} / ${total}`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (barEl) barEl.style.width = `${pct}%`;
  if (badgeEl) {
    badgeEl.textContent =
      fromCache === completed && completed > 0
        ? 'キャッシュから読み込み済み'
        : '音源を取得して保存中';
  }
}

function updateHeaderCacheStatus(): void {
  const loadedKeys = ALL_BANK_KEYS.filter((k) => isBankLoaded(k));
  const dot = document.getElementById('cacheStatusDot');
  const label = document.getElementById('cacheStatusLabel');
  if (!dot || !label) return;

  if (loadedKeys.length === ALL_BANK_KEYS.length) {
    dot.className = 'w-1.5 h-1.5 bg-emerald-400';
    label.textContent = 'オフライン保存済み';
  } else if (loadedKeys.length > 0) {
    dot.className = 'w-1.5 h-1.5 bg-[#3b66ff]';
    label.textContent = `音源読込 ${loadedKeys.length}/${ALL_BANK_KEYS.length}`;
  } else {
    dot.className = 'w-1.5 h-1.5 bg-slate-500';
    label.textContent = 'オフライン保存';
  }
}

function ensureActiveScore(): void {
  if (!state.activeScore) {
    const sec = SECTION_ROTATION[state.sectionCycleIdx % SECTION_ROTATION.length];
    state.activeScore = buildEightBarNarrativeScore(getActiveVibe(), sec, state.variantSeed);
  }
}

function scheduleBarBeatSlice(barInEight: number, sixteenthInBar: number, sliceStartTime: number): void {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  ensureActiveScore();
  if (!state.activeScore) return;

  const secPerBeat = 60.0 / state.bpm;
  const sixteenthDur = secPerBeat / 4.0;
  const beatStart = sixteenthInBar * 0.25;
  const beatEnd = beatStart + 0.25;
  const swingRatio = (state.swing - 50) / 50;

  const eventsInSlice = state.activeScore.events.filter(
    (ev) => ev.bar === barInEight && ev.beat >= beatStart && ev.beat < beatEnd
  );

  eventsInSlice.forEach((ev) => {
    const offsetBeats = ev.beat - beatStart;
    const isOffbeat = Math.round(ev.beat * 2) % 2 === 1;
    const swingSec = isOffbeat ? sixteenthDur * swingRatio * 0.52 : 0;
    const rubatoSec = (ev.rubatoMs || 0) / 1000 + (Math.random() - 0.5) * 0.012;
    const noteTime = Math.max(
      audioCtx.currentTime,
      sliceStartTime + offsetBeats * secPerBeat + swingSec + rubatoSec
    );
    const durSec = (ev.durBeats || 1.5) * secPerBeat;

    if (ev.hand === 'rh' && ev.midi !== undefined) {
      playRealGrandPianoSample(ev.midi, noteTime, durSec, ev.vel || 0.78, true);
      window.setTimeout(() => {
        if (!state.isPlaying) return;
        state.visMelodyPulse = 1.0;
        state.lastMelodyMidi = ev.midi!;
      }, Math.max(0, (noteTime - audioCtx.currentTime) * 1000));
    } else if (ev.hand === 'lh' && ev.midi !== undefined) {
      playRealGrandPianoSample(ev.midi, noteTime, durSec, ev.vel || 0.44, false);
    } else if (ev.hand === 'bass' && ev.midi !== undefined) {
      playRealContrabassSample(ev.midi, noteTime, durSec, ev.vel || 0.65);
    } else if (ev.hand === 'cello' && ev.midi !== undefined) {
      playRealCelloSample(ev.midi, noteTime, durSec, ev.vel || 0.45);
    } else if (ev.hand === 'drum' && ev.drumType) {
      playRealJazzKitSample(ev.drumType, noteTime, ev.vel || 0.5);
    }
  });

  const delayMs = Math.max(0, (sliceStartTime - audioCtx.currentTime) * 1000);
  window.setTimeout(() => {
    if (!state.isPlaying) return;
    if (sixteenthInBar === 0) state.visChordPulse = 0.8;
    updateStepHud();
  }, delayMs);
}

function advanceSixteenth(): void {
  const secPerBeat = 60.0 / state.bpm;
  let rubatoStretch = 1.0;
  if ((state.currentBarInEight === 3 || state.currentBarInEight === 7) && state.currentSixteenthInBar >= 12) {
    rubatoStretch = 1.08;
  }
  nextSixteenthTime += (secPerBeat / 4.0) * rubatoStretch;

  state.currentSixteenthInBar = (state.currentSixteenthInBar + 1) % 16;
  if (state.currentSixteenthInBar === 0) {
    state.totalBarsPlayed++;
    state.currentBarInEight = (state.currentBarInEight + 1) % 8;

    if (state.currentBarInEight === 0) {
      if (state.queuedAiScore) {
        state.activeScore = state.queuedAiScore;
        state.queuedAiScore = null;
        showToast(`AI作曲を適用: ${state.activeScore.title || '新しいスコア'}`);
      } else {
        state.sectionCycleIdx = (state.sectionCycleIdx + 1) % SECTION_ROTATION.length;
        state.variantSeed++;
        if (!state.lockProgression && state.sectionCycleIdx === 0) {
          const vibe = getActiveVibe();
          state.progressionVariant = (state.progressionVariant + 1) % vibe.progressions.length;
        }
        const nextSec = SECTION_ROTATION[state.sectionCycleIdx];
        state.activeScore = buildEightBarNarrativeScore(getActiveVibe(), nextSec, state.variantSeed);

        if (state.autoAiCompose && state.geminiApiKey && !state.aiComposingNow) {
          void composeScoreWithGemini(true);
        }
      }
    }
  }
}

function runScheduler(): void {
  const audioCtx = getAudioContext();
  if (!audioCtx || !state.isPlaying) return;
  while (nextSixteenthTime < audioCtx.currentTime + scheduleAheadSec) {
    scheduleBarBeatSlice(state.currentBarInEight, state.currentSixteenthInBar, nextSixteenthTime);
    advanceSixteenth();
  }
  schedulerTimerId = window.setTimeout(runScheduler, lookaheadMs);
}

async function togglePlayback(): Promise<void> {
  const audioCtx = initAudioEngine();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  if (!state.isPlaying) {
    const reqBanks = getRequiredBanksForVibe(getActiveVibe());
    await ensureSampleBanksLoaded(audioCtx, reqBanks, setLoaderOverlay);
    updateHeaderCacheStatus();

    state.isPlaying = true;
    state.currentSixteenthInBar = 0;
    ensureActiveScore();
    nextSixteenthTime = audioCtx.currentTime + 0.06;
    runScheduler();
  } else {
    state.isPlaying = false;
    if (schedulerTimerId !== null) {
      clearTimeout(schedulerTimerId);
      schedulerTimerId = null;
    }
  }
  updateTransportUi();
}

function mutatePhraseNow(): void {
  state.sectionCycleIdx = (state.sectionCycleIdx + 1) % SECTION_ROTATION.length;
  state.variantSeed++;
  const nextSec = SECTION_ROTATION[state.sectionCycleIdx];
  state.activeScore = buildEightBarNarrativeScore(getActiveVibe(), nextSec, state.variantSeed);
  state.currentBarInEight = 0;
  state.currentSixteenthInBar = 0;

  renderChordProgressionPills();
  updateStepHud();

  const canvas = document.getElementById('vibeCanvas') as HTMLCanvasElement | null;
  if (canvas) {
    state.ripples.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: 10,
      maxR: Math.max(canvas.width, canvas.height) * 0.55,
      alpha: 0.9
    });
  }
  showToast('新しい8小節のフレーズを生成しました');
}

async function composeScoreWithGemini(isBackgroundAuto = false): Promise<void> {
  if (!state.geminiApiKey.trim()) {
    showToast('「AI作曲」タブで Gemini API キーを設定してください');
    return;
  }
  if (state.aiComposingNow) return;

  state.aiComposingNow = true;
  const btnLabel = document.getElementById('aiBtnLabel');
  const statusMsg = document.getElementById('aiStatusMessage');
  const headerLabel = document.getElementById('aiHeaderStatusLabel');
  const promptInput = document.getElementById('inputAiPrompt') as HTMLTextAreaElement | null;

  if (btnLabel) btnLabel.textContent = '作曲中…';
  if (statusMsg) {
    statusMsg.className = 'text-xs text-slate-400 min-h-[1.25rem]';
    statusMsg.textContent = `${state.geminiModel} で作曲しています…`;
  }
  if (headerLabel) headerLabel.textContent = 'AI作曲中…';

  try {
    const playable = await requestGeminiScore(promptInput?.value || '');

    state.savedAiScores.unshift(playable);
    if (state.savedAiScores.length > 8) state.savedAiScores.pop();
    persistAiScores();
    renderAiScoresList();

    if (isBackgroundAuto && state.isPlaying) {
      state.queuedAiScore = playable;
      if (statusMsg) {
        statusMsg.className = 'text-xs text-emerald-300 min-h-[1.25rem]';
        statusMsg.textContent = `次の小節から「${playable.title}」へ切り替わります`;
      }
    } else {
      await applyAiScoreImmediately(playable);
      if (statusMsg) {
        statusMsg.className = 'text-xs text-emerald-300 min-h-[1.25rem]';
        statusMsg.textContent = `作曲完了: ${playable.title}（${playable.subtitle}）`;
      }
    }
    if (headerLabel) headerLabel.textContent = 'AI作曲（有効）';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (statusMsg) {
      statusMsg.className = 'text-xs text-rose-400 min-h-[1.25rem] break-all';
      statusMsg.textContent = `エラー (${state.geminiModel}): ${message}`;
    }
    showToast(`作曲に失敗しました (${state.geminiModel})`);
    if (headerLabel) headerLabel.textContent = 'AI作曲エラー';
  } finally {
    state.aiComposingNow = false;
    if (btnLabel) btnLabel.textContent = '新しい8小節を作曲して再生';
  }
}

async function applyAiScoreImmediately(playable: EightBarScore): Promise<void> {
  const vibe = getActiveVibe();
  if (playable.chords && playable.chords.length >= 4) {
    vibe.progressions[0] = playable.chords;
  }
  state.progressionVariant = 0;
  state.bpm = playable.bpm || state.bpm;
  state.activeScore = playable;
  state.currentBarInEight = 0;
  state.currentSixteenthInBar = 0;

  const titleEl = document.getElementById('activeVibeTitle');
  const subEl = document.getElementById('activeVibeSub');
  if (titleEl && playable.title) titleEl.textContent = playable.title;
  if (subEl && playable.subtitle) subEl.textContent = playable.subtitle;

  syncSlidersToState();
  syncAudioParamsFromState();
  renderChordProgressionPills();
  updateStepHud();

  if (!state.isPlaying) {
    await togglePlayback();
  } else {
    showToast(`再生中: ${playable.title}`);
  }
}

function renderAiScoresList(): void {
  const container = document.getElementById('aiScoresList');
  if (!container) return;
  container.innerHTML = '';

  if (state.savedAiScores.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-2">保存されたAI作曲はまだありません。</div>`;
    return;
  }

  state.savedAiScores.forEach((sc, idx) => {
    const row = document.createElement('div');
    row.className = 'engraved-plate p-2 flex items-center justify-between gap-2';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.dataset.aiIdx = String(idx);
    playBtn.className = 'text-left flex-1 min-w-0';

    const titleEl = document.createElement('div');
    titleEl.className = 'text-xs text-white truncate';
    titleEl.textContent = sc.title || '無題のスコア';

    const subEl = document.createElement('div');
    subEl.className = 'text-[11px] text-slate-400 truncate num-tabular';
    subEl.textContent = `${sc.subtitle || ''} · ${sc.bpm ?? state.bpm} BPM`;

    playBtn.appendChild(titleEl);
    playBtn.appendChild(subEl);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.dataset.aiDel = String(idx);
    delBtn.className = 'w-6 h-6 text-slate-400 hover:text-white text-sm';
    delBtn.textContent = '×';

    row.appendChild(playBtn);
    row.appendChild(delBtn);
    container.appendChild(row);
  });

  container.querySelectorAll<HTMLButtonElement>('[data-ai-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sc = state.savedAiScores[Number(btn.dataset.aiIdx)];
      if (sc) void applyAiScoreImmediately(sc);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-ai-del]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.savedAiScores.splice(Number(btn.dataset.aiDel), 1);
      persistAiScores();
      renderAiScoresList();
    });
  });
}

function renderVibeGrid(): void {
  const grid = document.getElementById('vibeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  VIBES.forEach((vibe, idx) => {
    if (state.filterCategory !== 'all' && vibe.category !== state.filterCategory) return;

    const isActive = idx === state.activeVibeIndex;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `engraved-plate p-3 text-left flex flex-col justify-between relative ${
      isActive ? 'vibe-card-active' : ''
    }`;
    card.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>${vibe.ensembleTag}</span>
          <span class="num-tabular">${vibe.bpm} BPM</span>
        </div>
        <div class="w-full h-14 border border-white/15 mb-3 overflow-hidden" style="background-color: ${vibe.plateColor};">
          <canvas class="vibe-card-canvas w-full h-full block" data-vibe-id="${vibe.id}" aria-hidden="true"></canvas>
        </div>
      </div>
      <div class="w-full min-w-0">
        <div class="nous-display text-xl leading-tight text-white">${vibe.name}</div>
        <div class="text-xs text-slate-400 mt-1 line-clamp-1">${vibe.sub}</div>
      </div>
    `;
    card.addEventListener('click', () => void selectVibe(idx, true));
    grid.appendChild(card);
  });

  registerVibeCardCanvases(grid);
}

async function selectVibe(index: number, autoPlayOrSwitch = false): Promise<void> {
  state.activeVibeIndex = index;
  state.progressionVariant = 0;
  const vibe = getActiveVibe();

  state.bpm = vibe.bpm;
  state.swing = vibe.swing;
  state.timbre = vibe.timbre;
  state.mix = { ...vibe.mix };

  const titleEl = document.getElementById('activeVibeTitle');
  const subEl = document.getElementById('activeVibeSub');
  const descEl = document.getElementById('activeVibeDesc');
  const ensEl = document.getElementById('activeEnsembleBadge');

  if (titleEl) titleEl.textContent = vibe.name;
  if (subEl) subEl.textContent = vibe.sub;
  if (descEl) descEl.textContent = vibe.desc;
  if (ensEl) ensEl.textContent = vibe.ensembleTag;

  const reqBanks = getRequiredBanksForVibe(vibe);

  state.activeScore = buildEightBarNarrativeScore(
    vibe,
    SECTION_ROTATION[state.sectionCycleIdx % SECTION_ROTATION.length],
    state.variantSeed
  );
  state.currentBarInEight = 0;
  state.currentSixteenthInBar = 0;

  syncSlidersToState();
  syncAudioParamsFromState();
  renderVibeGrid();
  renderChordProgressionPills();
  updateStepHud();

  if (autoPlayOrSwitch) {
    const audioCtx = initAudioEngine();
    await ensureSampleBanksLoaded(audioCtx, reqBanks, setLoaderOverlay);
    updateHeaderCacheStatus();
    if (!state.isPlaying) {
      await togglePlayback();
    } else {
      const ch = getCurrentChordObj();
      playRealGrandPianoSample(ch.scale[2], audioCtx.currentTime, 2.8, 0.78, true);
    }
  }
}

function renderStepDots(): void {
  const container = document.getElementById('stepDotsContainer');
  if (!container) return;
  container.innerHTML = '';
  for (let b = 0; b < 8; b++) {
    const dot = document.createElement('span');
    dot.id = `barDot_${b}`;
    dot.className =
      'px-1.5 py-0.5 text-[11px] num-tabular border border-white/15 text-slate-400 transition-colors duration-150';
    dot.textContent = String(b + 1);
    container.appendChild(dot);
  }
}

function renderChordProgressionPills(): void {
  const row = document.getElementById('chordProgressionRow');
  if (!row) return;
  row.innerHTML = '';
  const prog = getActiveProgression();
  prog.forEach((ch, idx) => {
    const isCurrent = idx === state.currentBarInEight % prog.length;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `px-2.5 py-1 text-xs num-tabular transition-colors duration-150 border ${
      isCurrent
        ? 'bg-white text-black border-white font-medium'
        : 'bg-[#0d0f17] text-slate-300 border-white/20 hover:border-white'
    }`;
    pill.textContent = ch.name;
    pill.title = 'クリックでこのコードを試聴';
    pill.addEventListener('click', async () => {
      const audioCtx = initAudioEngine();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      await ensureSampleBanksLoaded(audioCtx, ['grand-piano'], setLoaderOverlay);
      state.currentBarInEight = idx;
      ch.notes.forEach((n, i) => {
        playRealGrandPianoSample(n, audioCtx.currentTime + i * 0.05, 3.0, 0.46, false);
      });
      playRealGrandPianoSample(ch.scale[2], audioCtx.currentTime + 0.28, 3.2, 0.8, true);
      renderChordProgressionPills();
      updateStepHud();
    });
    row.appendChild(pill);
  });
}

function updateStepHud(): void {
  const vibe = getActiveVibe();
  const chordObj = getCurrentChordObj();
  const secName = state.activeScore ? state.activeScore.sectionType : 'A';

  const chordEl = document.getElementById('currentChordDisplay');
  const scaleEl = document.getElementById('currentScaleDisplay');
  const loopEl = document.getElementById('loopCounterText');
  if (chordEl) chordEl.textContent = chordObj.name;
  if (scaleEl) scaleEl.textContent = `${vibe.scaleLabel} · ${state.bpm} BPM`;
  if (loopEl) {
    loopEl.textContent = `${state.currentBarInEight + 1}/8 小節`;
  }

  const secBadge = document.getElementById('sectionArcBadge');
  if (secBadge) {
    const labelMap: Record<string, string> = {
      A: '主題',
      A_VAR: '変奏',
      B: '展開',
      INTERLUDE: '間奏',
      AI: 'AI作曲'
    };
    secBadge.textContent = labelMap[secName] || secName;
  }

  for (let b = 0; b < 8; b++) {
    const dot = document.getElementById(`barDot_${b}`);
    if (!dot) continue;
    const isRestBar = b === 3 || b === 7;
    if (state.isPlaying && b === state.currentBarInEight) {
      dot.className =
        'px-1.5 py-0.5 text-[11px] num-tabular border border-white bg-[#0822e6] text-white font-medium transition-colors duration-150';
    } else {
      dot.className = `px-1.5 py-0.5 text-[11px] num-tabular border border-white/15 transition-colors duration-150 ${
        isRestBar ? 'text-[#8da4ff] bg-[#141824]' : 'text-slate-400'
      }`;
    }
  }
  renderChordProgressionPills();
}

function updateTransportUi(): void {
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const label = document.getElementById('playBtnLabel');
  const dot = document.getElementById('liveIndicatorDot');
  const statusText = document.getElementById('liveStatusText');

  if (state.isPlaying) {
    iconPlay?.classList.add('hidden');
    iconPause?.classList.remove('hidden');
    if (label) label.textContent = '一時停止';
    if (dot) dot.className = 'w-2 h-2 bg-[#3b66ff]';
    if (statusText) statusText.textContent = '再生中';
  } else {
    iconPlay?.classList.remove('hidden');
    iconPause?.classList.add('hidden');
    if (label) label.textContent = '再生';
    if (dot) dot.className = 'w-2 h-2 bg-slate-500';
    if (statusText) statusText.textContent = '待機中';
  }
}

function syncSlidersToState(): void {
  const setSlider = (id: string, valId: string, val: number, suffix = '%') => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    const label = document.getElementById(valId);
    if (el) el.value = String(val);
    if (label) label.textContent = `${val}${suffix}`;
  };

  setSlider('sliderMasterVol', 'valMasterVol', state.masterVol, '%');
  setSlider('sliderChords', 'valChords', state.mix.chords, '%');
  setSlider('sliderDrums', 'valDrums', state.mix.drums, '%');
  setSlider('sliderBass', 'valBass', state.mix.bass, '%');
  setSlider('sliderMelody', 'valMelody', state.mix.melody, '%');
  setSlider('sliderBpm', 'valBpm', state.bpm, ' BPM');
  setSlider('sliderSwing', 'valSwing', state.swing, '%');

  const warmthEl = document.getElementById('sliderWarmth') as HTMLInputElement | null;
  const warmthVal = document.getElementById('valWarmth');
  if (warmthEl) warmthEl.value = String(state.mix.warmth);
  if (warmthVal) warmthVal.textContent = `${(state.mix.warmth / 1000).toFixed(1)} kHz`;

  setSlider('sliderWow', 'valWow', state.mix.wow, '%');
  setSlider('sliderVinyl', 'valVinyl', state.mix.vinyl, '%');
  setSlider('sliderRain', 'valRain', state.mix.rain, '%');
  setSlider('sliderAir', 'valAir', state.mix.air, '%');
  setSlider('sliderBrown', 'valBrown', state.mix.brown, '%');

  document.querySelectorAll<HTMLButtonElement>('.timbre-btn').forEach((btn, idx, list) => {
    const active = btn.dataset.timbre === state.timbre;
    const borderRight = idx < list.length - 1 ? 'border-r border-white/15' : '';
    btn.className = `timbre-btn flex-1 py-2 px-2 text-xs transition-colors duration-150 ${borderRight} ${
      active ? 'bg-white text-black font-medium' : 'text-slate-400 hover:text-white'
    }`;
  });

  const keyInput = document.getElementById('inputGeminiKey') as HTMLInputElement | null;
  const keyBadge = document.getElementById('aiKeyBadge');
  const headerLabel = document.getElementById('aiHeaderStatusLabel');
  if (keyInput && state.geminiApiKey) keyInput.value = state.geminiApiKey;
  if (keyBadge) {
    if (state.geminiApiKey) {
      keyBadge.textContent = '設定済み';
      keyBadge.className =
        'text-[11px] px-2 py-0.5 border border-emerald-400/50 text-emerald-300';
    } else {
      keyBadge.textContent = '未設定';
      keyBadge.className = 'text-[11px] px-2 py-0.5 border border-white/20 text-slate-300';
    }
  }
  if (headerLabel && !state.aiComposingNow) {
    headerLabel.textContent = state.geminiApiKey ? 'AI作曲（設定済）' : 'AI作曲';
  }
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerUi(): void {
  const disp = document.getElementById('timerDisplay');
  const badge = document.getElementById('timerPhaseBadge');
  const startBtn = document.getElementById('btnTimerStart');
  const countEl = document.getElementById('completedSessionsCount');

  if (disp) disp.textContent = formatTimer(state.timerSecondsLeft);
  if (badge) {
    if (state.timerPhase === 'work') {
      badge.textContent = '集中';
      badge.className = 'inline-block text-xs px-2 py-0.5 border border-white/20 bg-[#0d0f17] text-slate-200';
    } else {
      badge.textContent = '休憩（ピアノ独奏）';
      badge.className = 'inline-block text-xs px-2 py-0.5 bg-white text-black font-medium';
    }
  }
  if (startBtn) startBtn.textContent = state.timerRunning ? '一時停止' : 'タイマー開始';
  if (countEl) countEl.textContent = `${state.completedSessions} 回`;
}

function playGentleSessionChime(): void {
  const audioCtx = getAudioContext();
  if (!audioCtx || !isBankLoaded('grand-piano')) return;
  const chordObj = getCurrentChordObj();
  chordObj.scale.slice(0, 4).forEach((midi, idx) => {
    playRealGrandPianoSample(midi, audioCtx.currentTime + idx * 0.28, 3.2, 0.75, true);
  });
}

function toggleFocusTimer(): void {
  state.timerRunning = !state.timerRunning;
  if (state.timerRunning) {
    if (!state.isPlaying) void togglePlayback();
    timerIntervalId = window.setInterval(() => {
      state.timerSecondsLeft--;
      if (state.timerSecondsLeft <= 0) {
        playGentleSessionChime();
        if (state.timerPhase === 'work') {
          state.completedSessions++;
          state.timerPhase = 'break';
          state.timerSecondsLeft = state.breakMinutes * 60;
          showToast('集中セッション完了 — 休憩モード（ピアノ独奏）へ移行します');
        } else {
          state.timerPhase = 'work';
          state.timerSecondsLeft = state.workMinutes * 60;
          showToast('休憩完了 — 集中セッションを再開します');
        }
        syncAudioParamsFromState();
      }
      updateTimerUi();
    }, 1000);
  } else if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  syncAudioParamsFromState();
  updateTimerUi();
}

function resetFocusTimer(): void {
  state.timerRunning = false;
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  state.timerPhase = 'work';
  state.timerSecondsLeft = state.workMinutes * 60;
  syncAudioParamsFromState();
  updateTimerUi();
}

function renderSavedPresets(): void {
  const container = document.getElementById('savedPresetsList');
  if (!container) return;
  container.innerHTML = '';

  state.savedPresets.forEach((preset, idx) => {
    const vibe = VIBES.find((v) => v.id === preset.vibeId) || VIBES[0];
    const item = document.createElement('div');
    item.className = 'engraved-plate p-2.5 flex items-center justify-between gap-2';

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.dataset.loadIdx = String(idx);
    loadBtn.className = 'flex items-center gap-3 text-left flex-1 min-w-0';

    const swatch = document.createElement('span');
    swatch.className = 'w-6 h-6 border border-white/40 shrink-0';
    swatch.style.backgroundColor = vibe.plateColor;

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0 flex-1';

    const nameEl = document.createElement('div');
    nameEl.className = 'text-xs text-white truncate';
    nameEl.textContent = preset.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'text-[11px] text-slate-400 truncate num-tabular';
    metaEl.textContent = `${vibe.name} · ${preset.bpm} BPM · ピアノ ${preset.mix.melody}%`;

    textWrap.appendChild(nameEl);
    textWrap.appendChild(metaEl);
    loadBtn.appendChild(swatch);
    loadBtn.appendChild(textWrap);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.dataset.delIdx = String(idx);
    delBtn.className =
      'w-6 h-6 border border-transparent hover:border-white/40 text-slate-400 hover:text-white text-sm flex items-center justify-center shrink-0';
    delBtn.title = '削除';
    delBtn.textContent = '×';

    item.appendChild(loadBtn);
    item.appendChild(delBtn);
    container.appendChild(item);
  });

  container.querySelectorAll<HTMLButtonElement>('[data-load-idx]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const p = state.savedPresets[Number(btn.dataset.loadIdx)];
      if (!p) return;
      const vIdx = Math.max(0, VIBES.findIndex((v) => v.id === p.vibeId));
      await selectVibe(vIdx, false);
      state.bpm = p.bpm;
      state.swing = p.swing;
      state.timbre = p.timbre;
      state.mix = { ...p.mix };
      syncSlidersToState();
      syncAudioParamsFromState();
      updateStepHud();
      const audioCtx = initAudioEngine();
      const reqBanks = getRequiredBanksForVibe(getActiveVibe());
      await ensureSampleBanksLoaded(audioCtx, reqBanks, setLoaderOverlay);
      if (!state.isPlaying) await togglePlayback();
      showToast(`読み込みました: ${p.name}`);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-del-idx]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const delIdx = Number(btn.dataset.delIdx);
      state.savedPresets.splice(delIdx, 1);
      persistSavedPresets();
      renderSavedPresets();
      showToast('設定を削除しました');
    });
  });
}

function saveCurrentPreset(): void {
  const vibe = getActiveVibe();
  const count = state.savedPresets.length + 1;
  const newPreset = {
    name: `${vibe.name} — 設定 #${count}`,
    vibeId: vibe.id,
    bpm: state.bpm,
    swing: state.swing,
    timbre: state.timbre,
    mix: { ...state.mix }
  };
  state.savedPresets.unshift(newPreset);
  if (state.savedPresets.length > 6) state.savedPresets.pop();
  persistSavedPresets();
  renderSavedPresets();
  showToast(`保存しました: ${newPreset.name}`);
}

function showToast(msg: string): void {
  const toast = document.getElementById('toastBox');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');
  if (toastHideTimer !== null) clearTimeout(toastHideTimer);
  toastHideTimer = window.setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2400);
}

function switchConsoleTab(targetBtnId: string): void {
  const tabs = [
    { btn: 'tabBtnMixer', panel: 'panelMixer' },
    { btn: 'tabBtnTape', panel: 'panelTape' },
    { btn: 'tabBtnAi', panel: 'panelAi' },
    { btn: 'tabBtnTimer', panel: 'panelTimer' }
  ];
  tabs.forEach((other, idx) => {
    const isTarget = other.btn === targetBtnId;
    document.getElementById(other.panel)?.classList.toggle('hidden', !isTarget);
    const btnEl = document.getElementById(other.btn);
    if (btnEl) {
      const borderRight = idx < tabs.length - 1 ? 'border-r border-white/15' : '';
      btnEl.className = `studio-tab-btn py-2.5 px-1.5 transition-colors duration-150 ${borderRight} ${
        isTarget
          ? 'bg-[#0822e6] text-white font-medium'
          : other.btn === 'tabBtnAi'
          ? 'text-[#93c5fd] hover:text-white'
          : 'text-slate-400 hover:text-white'
      }`;
    }
  });
}

function bindControls(canvas: HTMLCanvasElement): void {
  document.getElementById('btnPlayToggle')?.addEventListener('click', () => void togglePlayback());
  document.getElementById('btnMutateSeed')?.addEventListener('click', mutatePhraseNow);

  document.getElementById('btnRandomVibe')?.addEventListener('click', () => {
    const nextIdx = (state.activeVibeIndex + 1 + Math.floor(Math.random() * (VIBES.length - 1))) % VIBES.length;
    void selectVibe(nextIdx, true);
  });

  document.getElementById('btnPreloadAllBanks')?.addEventListener('click', async () => {
    const audioCtx = initAudioEngine();
    await ensureSampleBanksLoaded(audioCtx, ALL_BANK_KEYS, setLoaderOverlay);
    updateHeaderCacheStatus();
    showToast('全4種類の音源をブラウザに保存しました');
  });

  document.getElementById('btnOpenAiTabQuick')?.addEventListener('click', () => {
    switchConsoleTab('tabBtnAi');
  });

  document.getElementById('btnLockChord')?.addEventListener('click', () => {
    state.lockProgression = !state.lockProgression;
    const label = document.getElementById('lockChordLabel');
    const btn = document.getElementById('btnLockChord');
    if (state.lockProgression) {
      if (label) label.textContent = '進行: 固定中';
      btn?.classList.add('bg-white', 'text-black');
      showToast('コード進行を固定しました');
    } else {
      if (label) label.textContent = '進行: 自動';
      btn?.classList.remove('bg-white', 'text-black');
      showToast('コード進行を自動展開に戻しました');
    }
  });

  document.querySelectorAll<HTMLButtonElement>('.vibe-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filterCategory = (btn.dataset.filter as VibeCategory) || 'all';
      document.querySelectorAll<HTMLButtonElement>('.vibe-filter-btn').forEach((b) => {
        const active = b.dataset.filter === state.filterCategory;
        b.className = `vibe-filter-btn px-3 py-1.5 transition-colors duration-150 ${
          active ? 'bg-white text-black font-medium' : 'text-slate-400 hover:text-white'
        }`;
      });
      renderVibeGrid();
    });
  });

  ['tabBtnMixer', 'tabBtnTape', 'tabBtnAi', 'tabBtnTimer'].forEach((btnId) => {
    document.getElementById(btnId)?.addEventListener('click', () => switchConsoleTab(btnId));
  });

  const bindSlider = (id: string, onChange: (v: number) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    el.addEventListener('input', (e) => {
      onChange(Number((e.target as HTMLInputElement).value));
      syncSlidersToState();
      syncAudioParamsFromState();
    });
  };

  bindSlider('sliderMasterVol', (v) => {
    state.masterVol = v;
  });
  bindSlider('sliderChords', (v) => {
    state.mix.chords = v;
  });
  bindSlider('sliderDrums', (v) => {
    state.mix.drums = v;
    const audioCtx = getAudioContext();
    if (v > 0 && state.isPlaying && audioCtx && !isBankLoaded('jazz-kit')) {
      void ensureSampleBanksLoaded(audioCtx, ['jazz-kit']);
    }
  });
  bindSlider('sliderBass', (v) => {
    state.mix.bass = v;
    const audioCtx = getAudioContext();
    if (v > 0 && state.isPlaying && audioCtx && !isBankLoaded('upright-bass')) {
      void ensureSampleBanksLoaded(audioCtx, ['upright-bass']);
    }
  });
  bindSlider('sliderMelody', (v) => {
    state.mix.melody = v;
  });
  bindSlider('sliderBpm', (v) => {
    state.bpm = v;
    updateStepHud();
  });
  bindSlider('sliderSwing', (v) => {
    state.swing = v;
  });
  bindSlider('sliderWarmth', (v) => {
    state.mix.warmth = v;
  });
  bindSlider('sliderWow', (v) => {
    state.mix.wow = v;
  });
  bindSlider('sliderVinyl', (v) => {
    state.mix.vinyl = v;
  });
  bindSlider('sliderRain', (v) => {
    state.mix.rain = v;
  });
  bindSlider('sliderAir', (v) => {
    state.mix.air = v;
  });
  bindSlider('sliderBrown', (v) => {
    state.mix.brown = v;
  });

  document.querySelectorAll<HTMLButtonElement>('.timbre-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.timbre = (btn.dataset.timbre as TimbreType) || 'felt';
      syncSlidersToState();
      const audioCtx = initAudioEngine();
      if (state.timbre === 'chamber' && !isBankLoaded('cello-pad')) {
        await ensureSampleBanksLoaded(audioCtx, ['cello-pad'], setLoaderOverlay);
      }
      state.activeScore = buildEightBarNarrativeScore(
        getActiveVibe(),
        SECTION_ROTATION[state.sectionCycleIdx % SECTION_ROTATION.length],
        state.variantSeed
      );
      if (state.isPlaying && isBankLoaded('grand-piano')) {
        const ch = getCurrentChordObj();
        playRealGrandPianoSample(ch.scale[3], audioCtx.currentTime, 2.8, 0.78, true);
      }
    });
  });

  // BYOK Gemini Controls
  document.getElementById('btnSaveApiKey')?.addEventListener('click', () => {
    const input = document.getElementById('inputGeminiKey') as HTMLInputElement | null;
    const val = input?.value.trim() || '';
    state.geminiApiKey = val;
    try {
      if (val) localStorage.setItem('aether_gemini_api_key_v4', val);
      else localStorage.removeItem('aether_gemini_api_key_v4');
    } catch {}
    syncSlidersToState();
    showToast(val ? 'APIキーをこのブラウザに保存しました' : 'APIキーが空です');
  });

  document.getElementById('btnClearApiKey')?.addEventListener('click', () => {
    state.geminiApiKey = '';
    const input = document.getElementById('inputGeminiKey') as HTMLInputElement | null;
    if (input) input.value = '';
    try {
      localStorage.removeItem('aether_gemini_api_key_v4');
    } catch {}
    syncSlidersToState();
    showToast('APIキーを消去しました');
  });

  document.getElementById('selectGeminiModel')?.addEventListener('change', (e) => {
    state.geminiModel = (e.target as HTMLSelectElement).value;
  });

  document.getElementById('chkAutoAiCompose')?.addEventListener('change', (e) => {
    state.autoAiCompose = (e.target as HTMLInputElement).checked;
    showToast(state.autoAiCompose ? '自動AI作曲を有効にしました' : '自動AI作曲をオフにしました');
  });

  document.querySelectorAll<HTMLButtonElement>('.ai-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const promptEl = document.getElementById('inputAiPrompt') as HTMLTextAreaElement | null;
      if (promptEl && chip.dataset.prompt) {
        promptEl.value = chip.dataset.prompt;
      }
    });
  });

  document.getElementById('btnGenerateAiScore')?.addEventListener('click', () => {
    const inputKey = (document.getElementById('inputGeminiKey') as HTMLInputElement | null)?.value.trim() || '';
    if (inputKey && inputKey !== state.geminiApiKey) {
      state.geminiApiKey = inputKey;
      try {
        localStorage.setItem('aether_gemini_api_key_v4', inputKey);
      } catch {}
      syncSlidersToState();
    }
    void composeScoreWithGemini(false);
  });

  document.getElementById('btnResetMixer')?.addEventListener('click', () => {
    const vibe = getActiveVibe();
    state.bpm = vibe.bpm;
    state.swing = vibe.swing;
    state.timbre = vibe.timbre;
    state.mix = { ...vibe.mix };
    syncSlidersToState();
    syncAudioParamsFromState();
    updateStepHud();
    showToast(`${vibe.name} の初期値に戻しました`);
  });

  document.getElementById('btnTimerStart')?.addEventListener('click', toggleFocusTimer);
  document.getElementById('btnTimerReset')?.addEventListener('click', resetFocusTimer);

  document.querySelectorAll<HTMLButtonElement>('.timer-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.workMinutes = Number(btn.dataset.work);
      state.breakMinutes = Number(btn.dataset.break);
      document.querySelectorAll<HTMLButtonElement>('.timer-preset-btn').forEach((b, idx, list) => {
        const active = b === btn;
        const borderRight = idx < list.length - 1 ? 'border-r border-white/15' : '';
        b.className = `timer-preset-btn flex-1 py-2 px-2 text-xs transition-colors duration-150 ${borderRight} num-tabular ${
          active ? 'bg-white text-black font-medium' : 'text-slate-400 hover:text-white'
        }`;
      });
      resetFocusTimer();
    });
  });

  document.getElementById('btnSavePreset')?.addEventListener('click', saveCurrentPreset);

  const modalHelp = document.getElementById('modalHelp');
  const openHelp = () => {
    modalHelp?.classList.remove('hidden');
    modalHelp?.classList.add('flex');
  };
  const closeHelp = () => {
    modalHelp?.classList.add('hidden');
    modalHelp?.classList.remove('flex');
  };
  document.getElementById('btnQuickHelp')?.addEventListener('click', openHelp);
  document.getElementById('btnCloseHelp')?.addEventListener('click', closeHelp);
  document.getElementById('btnCloseHelpBottom')?.addEventListener('click', closeHelp);
  modalHelp?.addEventListener('click', (e) => {
    if (e.target === modalHelp) closeHelp();
  });

  canvas.addEventListener('pointerdown', async (e) => {
    const audioCtx = initAudioEngine();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.ripples.push({
      x,
      y,
      r: 4,
      maxR: Math.max(rect.width, rect.height) * 0.45,
      alpha: 0.9
    });

    await ensureSampleBanksLoaded(
      audioCtx,
      ['grand-piano'],
      !isBankLoaded('grand-piano') ? setLoaderOverlay : undefined
    );
    updateHeaderCacheStatus();

    const chordObj = getCurrentChordObj();
    const ratioX = Math.max(0, Math.min(1, x / rect.width));
    const scaleIdx = Math.floor(ratioX * chordObj.scale.length);
    const midi = chordObj.scale[scaleIdx];
    state.visMelodyPulse = 1.0;
    playRealGrandPianoSample(midi, audioCtx.currentTime, 3.0, 0.82, true);
  });

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      void togglePlayback();
    } else if (e.key >= '1' && e.key <= '8') {
      const idx = Number(e.key) - 1;
      if (VIBES[idx]) void selectVibe(idx, true);
    } else if (e.key === 'm' || e.key === 'M') {
      mutatePhraseNow();
    } else if (e.key === 'r' || e.key === 'R') {
      state.mix.rain = state.mix.rain > 0 ? 0 : 28;
      syncSlidersToState();
      syncAudioParamsFromState();
      showToast(state.mix.rain > 0 ? '雨音をオンにしました' : '雨音をオフにしました');
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  renderStepDots();

  const canvas = document.getElementById('vibeCanvas') as HTMLCanvasElement | null;
  if (canvas) {
    bindControls(canvas);
    initVisualizerParticles();
    resizeVisualizerCanvas(canvas);
    window.addEventListener('resize', () => {
      resizeVisualizerCanvas(canvas);
      invalidateVibeCardCanvases();
    });
    startVisualizerLoop(canvas);
  }

  startCardAnimationsLoop();
  void selectVibe(0, false);
  renderSavedPresets();
  renderAiScoresList();
  updateTimerUi();
  updateHeaderCacheStatus();
});
