import { state } from '../state/store';
import { SampleBankKey, VibePreset } from '../types/music';

export const SAMPLE_CACHE_NAME = 'aether-acoustic-samples-v4';

export interface PitchedSampleEntry {
  midi: number;
  file: string;
}

export interface KitSampleEntry {
  id: string;
  file: string;
}

export const PITCHED_SAMPLE_BANKS: Record<Exclude<SampleBankKey, 'jazz-kit'>, { label: string; baseUrl: string; samples: PitchedSampleEntry[] }> = {
  'grand-piano': {
    label: 'グランドピアノ',
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
    samples: [
      { midi: 33, file: 'A1.mp3' },
      { midi: 36, file: 'C2.mp3' },
      { midi: 39, file: 'Ds2.mp3' },
      { midi: 42, file: 'Fs2.mp3' },
      { midi: 45, file: 'A2.mp3' },
      { midi: 48, file: 'C3.mp3' },
      { midi: 51, file: 'Ds3.mp3' },
      { midi: 54, file: 'Fs3.mp3' },
      { midi: 57, file: 'A3.mp3' },
      { midi: 60, file: 'C4.mp3' },
      { midi: 63, file: 'Ds4.mp3' },
      { midi: 66, file: 'Fs4.mp3' },
      { midi: 69, file: 'A4.mp3' },
      { midi: 72, file: 'C5.mp3' },
      { midi: 75, file: 'Ds5.mp3' },
      { midi: 78, file: 'Fs5.mp3' },
      { midi: 81, file: 'A5.mp3' },
      { midi: 84, file: 'C6.mp3' }
    ]
  },
  'upright-bass': {
    label: 'ウッドベース',
    baseUrl: 'https://nbrosowsky.github.io/tonejs-instruments/samples/contrabass/',
    samples: [
      { midi: 30, file: 'Fs1.mp3' },
      { midi: 31, file: 'G1.mp3' },
      { midi: 34, file: 'As1.mp3' },
      { midi: 36, file: 'C2.mp3' },
      { midi: 38, file: 'D2.mp3' },
      { midi: 40, file: 'E2.mp3' },
      { midi: 42, file: 'Fs2.mp3' },
      { midi: 44, file: 'Gs2.mp3' },
      { midi: 45, file: 'A2.mp3' }
    ]
  },
  'cello-pad': {
    label: 'チェロ',
    baseUrl: 'https://nbrosowsky.github.io/tonejs-instruments/samples/cello/',
    samples: [
      { midi: 36, file: 'C2.mp3' },
      { midi: 43, file: 'G2.mp3' },
      { midi: 48, file: 'C3.mp3' },
      { midi: 55, file: 'G3.mp3' },
      { midi: 60, file: 'C4.mp3' }
    ]
  }
};

export const JAZZ_KIT_BANK: { label: string; baseUrl: string; samples: KitSampleEntry[] } = {
  label: 'ブラシ・ドラム',
  baseUrl: 'https://tonejs.github.io/audio/drum-samples/',
  samples: [
    { id: 'kick', file: 'acoustic-kit/kick.mp3' },
    { id: 'snare', file: 'acoustic-kit/snare.mp3' },
    { id: 'hihat', file: 'acoustic-kit/hihat.mp3' },
    { id: 'brushTap', file: 'CR78/hihat.mp3' },
    { id: 'softKick', file: 'CR78/kick.mp3' }
  ]
};

export const ALL_BANK_KEYS: SampleBankKey[] = ['grand-piano', 'upright-bass', 'cello-pad', 'jazz-kit'];

export interface DecodedPitchedSample {
  midi: number;
  buffer: AudioBuffer;
  file: string;
}

const decodedPitchedBanks: Partial<Record<Exclude<SampleBankKey, 'jazz-kit'>, DecodedPitchedSample[]>> = {};
let decodedJazzKit: Record<string, AudioBuffer> | null = null;
const bankLoadPromises: Partial<Record<SampleBankKey, Promise<void>>> = {};

export function isBankLoaded(bankKey: SampleBankKey): boolean {
  if (bankKey === 'jazz-kit') return Boolean(decodedJazzKit);
  return Boolean(decodedPitchedBanks[bankKey]);
}

export function getDecodedJazzKit(): Record<string, AudioBuffer> | null {
  return decodedJazzKit;
}

export function findClosestSample(
  bankKey: Exclude<SampleBankKey, 'jazz-kit'>,
  targetMidi: number
): { buffer: AudioBuffer; playbackRate: number; rootMidi: number } | null {
  const list = decodedPitchedBanks[bankKey];
  if (!list || list.length === 0) return null;
  let best = list[0];
  let minDiff = Math.abs(targetMidi - best.midi);
  for (let i = 1; i < list.length; i++) {
    const diff = Math.abs(targetMidi - list[i].midi);
    if (diff < minDiff) {
      minDiff = diff;
      best = list[i];
    }
  }
  const playbackRate = Math.pow(2, (targetMidi - best.midi) / 12);
  return { buffer: best.buffer, playbackRate, rootMidi: best.midi };
}

async function fetchAndCacheSampleArrayBuffer(url: string): Promise<{ buffer: ArrayBuffer; fromCache: boolean }> {
  if ('caches' in window) {
    const cache = await window.caches.open(SAMPLE_CACHE_NAME);
    const cachedResp = await cache.match(url);
    if (cachedResp && cachedResp.ok) {
      const buf = await cachedResp.arrayBuffer();
      return { buffer: buf, fromCache: true };
    }
    const netResp = await fetch(url, { mode: 'cors' });
    if (!netResp.ok) throw new Error(`HTTP ${netResp.status} for ${url}`);
    await cache.put(url, netResp.clone());
    const buf = await netResp.arrayBuffer();
    return { buffer: buf, fromCache: false };
  }

  const netResp = await fetch(url, { mode: 'cors' });
  if (!netResp.ok) throw new Error(`HTTP ${netResp.status} for ${url}`);
  return { buffer: await netResp.arrayBuffer(), fromCache: false };
}

export function getRequiredBanksForVibe(vibe: VibePreset): SampleBankKey[] {
  const banks: SampleBankKey[] = ['grand-piano'];
  if ((vibe.mix && vibe.mix.bass > 0) || state.mix.bass > 0) {
    banks.push('upright-bass');
  }
  if ((vibe.mix && vibe.mix.drums > 0) || state.mix.drums > 0) {
    banks.push('jazz-kit');
  }
  if (vibe.timbre === 'chamber' || state.timbre === 'chamber') {
    banks.push('cello-pad');
  }
  return Array.from(new Set(banks));
}

export interface LoaderProgressCallback {
  (info: {
    visible: boolean;
    title?: string;
    detail?: string;
    completed?: number;
    total?: number;
    fromCacheCount?: number;
  }): void;
}

export async function ensureSampleBanksLoaded(
  audioCtx: AudioContext,
  bankKeys: SampleBankKey[],
  onProgress?: LoaderProgressCallback
): Promise<void> {
  const missingBanks = bankKeys.filter((k) => !isBankLoaded(k));
  if (missingBanks.length === 0) return;

  let totalSamples = 0;
  missingBanks.forEach((k) => {
    totalSamples += k === 'jazz-kit' ? JAZZ_KIT_BANK.samples.length : PITCHED_SAMPLE_BANKS[k].samples.length;
  });

  let completedSamples = 0;
  let cacheHits = 0;

  const getBankLabel = (k: SampleBankKey) => (k === 'jazz-kit' ? JAZZ_KIT_BANK.label : PITCHED_SAMPLE_BANKS[k].label);

  if (onProgress) {
    onProgress({
      visible: true,
      title: `読み込み中: ${missingBanks.map(getBankLabel).join(' / ')}`,
      detail: '音源を準備しています…',
      completed: 0,
      total: totalSamples,
      fromCacheCount: 0
    });
  }

  try {
    for (const bankKey of missingBanks) {
      if (bankLoadPromises[bankKey]) {
        await bankLoadPromises[bankKey];
        continue;
      }

      bankLoadPromises[bankKey] = (async () => {
        if (bankKey === 'jazz-kit') {
          const kitMap: Record<string, AudioBuffer> = {};
          for (const item of JAZZ_KIT_BANK.samples) {
            const url = JAZZ_KIT_BANK.baseUrl + item.file;
            onProgress?.({
              visible: true,
              title: `${JAZZ_KIT_BANK.label} を読み込み中`,
              detail: item.file,
              completed: completedSamples,
              total: totalSamples,
              fromCacheCount: cacheHits
            });
            const { buffer, fromCache } = await fetchAndCacheSampleArrayBuffer(url);
            if (fromCache) cacheHits++;
            kitMap[item.id] = await audioCtx.decodeAudioData(buffer.slice(0));
            completedSamples++;
            onProgress?.({
              visible: true,
              title: `${JAZZ_KIT_BANK.label} を読み込み中`,
              detail: `${item.file}（${fromCache ? 'キャッシュ済み' : '取得済み'}）`,
              completed: completedSamples,
              total: totalSamples,
              fromCacheCount: cacheHits
            });
          }
          decodedJazzKit = kitMap;
        } else {
          const spec = PITCHED_SAMPLE_BANKS[bankKey];
          const list: DecodedPitchedSample[] = [];
          for (const item of spec.samples) {
            const url = spec.baseUrl + item.file;
            onProgress?.({
              visible: true,
              title: `${spec.label} を読み込み中`,
              detail: item.file,
              completed: completedSamples,
              total: totalSamples,
              fromCacheCount: cacheHits
            });
            const { buffer, fromCache } = await fetchAndCacheSampleArrayBuffer(url);
            if (fromCache) cacheHits++;
            const audioBuf = await audioCtx.decodeAudioData(buffer.slice(0));
            list.push({ midi: item.midi, buffer: audioBuf, file: item.file });
            completedSamples++;
            onProgress?.({
              visible: true,
              title: `${spec.label} を読み込み中`,
              detail: `${item.file}（${fromCache ? 'キャッシュ済み' : '取得済み'}）`,
              completed: completedSamples,
              total: totalSamples,
              fromCacheCount: cacheHits
            });
          }
          list.sort((a, b) => a.midi - b.midi);
          decodedPitchedBanks[bankKey] = list;
        }
      })();

      await bankLoadPromises[bankKey];
    }
  } finally {
    if (onProgress) {
      setTimeout(() => onProgress({ visible: false }), 160);
    }
  }
}
