import { SavedPreset, SectionType, VibePreset } from '../types/music';

export const SECTION_ROTATION: SectionType[] = ['A', 'A_VAR', 'B', 'INTERLUDE'];

export const VIBES: VibePreset[] = [
  {
    id: 'midnight-tokyo',
    name: "Kiki's Bakery Jazz",
    sub: '木漏れ日のカフェ・ジャズ',
    ensembleTag: 'カフェ・トリオ',
    category: 'daily',
    desc: 'やわらかなフェルトピアノとウッドベースによる8小節の穏やかなジャズトリオ。長い余白を挟みながら静かに展開します。',
    colors: ['#0822e6', '#3b66ff', '#dbeafe'],
    plateColor: '#0c1b66',
    bpm: 62,
    swing: 58,
    scaleLabel: 'F Major 9',
    timbre: 'felt',
    mix: { chords: 44, drums: 16, bass: 48, melody: 88, warmth: 2400, wow: 12, vinyl: 14, rain: 16, air: 15, brown: 8 },
    progressions: [
      [
        { name: 'Fmaj9', bass: 41, notes: [53, 57, 60, 64, 67], scale: [60, 62, 64, 65, 67, 69, 72, 74, 76, 79] },
        { name: 'G13sus', bass: 43, notes: [53, 57, 60, 62, 65], scale: [60, 62, 64, 67, 69, 71, 72, 74, 76, 79] },
        { name: 'Em7', bass: 40, notes: [52, 55, 59, 62, 67], scale: [59, 62, 64, 67, 69, 71, 74, 76, 79] },
        { name: 'Am9', bass: 45, notes: [52, 55, 59, 60, 64], scale: [60, 62, 64, 67, 69, 72, 74, 76, 79] }
      ],
      [
        { name: 'Dm9', bass: 38, notes: [50, 53, 57, 60, 64], scale: [60, 62, 64, 65, 69, 72, 74, 76, 77] },
        { name: 'G13', bass: 43, notes: [53, 55, 59, 64, 67], scale: [59, 62, 64, 67, 69, 71, 74, 76, 79] },
        { name: 'Cmaj9', bass: 36, notes: [52, 55, 59, 62, 67], scale: [60, 62, 64, 67, 69, 71, 72, 76, 79] },
        { name: 'A7b13', bass: 45, notes: [52, 55, 57, 61, 65], scale: [61, 64, 65, 67, 69, 72, 74, 76, 77] }
      ]
    ]
  },
  {
    id: 'amber-cafe',
    name: 'Amber Archive',
    sub: '古書と珈琲のトリオ',
    ensembleTag: 'カフェ・トリオ',
    category: 'daily',
    desc: '澄んだグランドピアノの和音と温かなベースが寄り添う、午後の読書やデスクワーク向けの王道トリオ。',
    colors: ['#1e3a8a', '#60a5fa', '#f8fafc'],
    plateColor: '#162347',
    bpm: 64,
    swing: 61,
    scaleLabel: 'Eb Major 9',
    timbre: 'concert',
    mix: { chords: 42, drums: 18, bass: 54, melody: 86, warmth: 2600, wow: 10, vinyl: 16, rain: 0, air: 20, brown: 8 },
    progressions: [
      [
        { name: 'Ebmaj9', bass: 39, notes: [50, 55, 58, 62, 65], scale: [58, 60, 62, 63, 65, 67, 70, 72, 74, 75, 79] },
        { name: 'Cm9', bass: 36, notes: [51, 55, 58, 62, 67], scale: [58, 60, 62, 63, 65, 67, 70, 72, 74, 75, 79] },
        { name: 'Fm9', bass: 41, notes: [51, 56, 60, 63, 67], scale: [58, 60, 63, 65, 67, 68, 70, 72, 75, 77] },
        { name: 'Bb13sus', bass: 34, notes: [51, 56, 58, 60, 65], scale: [58, 60, 62, 63, 65, 67, 70, 72, 74, 75, 77] }
      ]
    ]
  },
  {
    id: 'mossy-dawn',
    name: 'Bygone Summer',
    sub: '夏の海辺のピアノとチェロ',
    ensembleTag: 'ピアノ＆チェロ',
    category: 'relax',
    desc: 'ドラムやベースを使わない静かな室内楽。ピアノの余韻に、チェロの柔らかなロングトーンが重なります。',
    colors: ['#0f4c81', '#38bdf8', '#e2e8f0'],
    plateColor: '#102e4a',
    bpm: 56,
    swing: 54,
    scaleLabel: 'D Lydian',
    timbre: 'chamber',
    mix: { chords: 45, drums: 0, bass: 0, melody: 92, warmth: 2750, wow: 8, vinyl: 10, rain: 10, air: 22, brown: 6 },
    progressions: [
      [
        { name: 'Gmaj9', bass: 43, notes: [50, 54, 59, 62, 66], scale: [59, 61, 62, 64, 66, 69, 71, 73, 74, 76, 78] },
        { name: 'F#m7', bass: 42, notes: [49, 52, 57, 61, 64], scale: [59, 61, 62, 64, 66, 69, 71, 73, 76, 78] },
        { name: 'Em9', bass: 40, notes: [50, 54, 55, 59, 62], scale: [59, 62, 64, 66, 67, 69, 71, 74, 76, 79] },
        { name: 'Dmaj9', bass: 38, notes: [50, 54, 57, 61, 66], scale: [59, 61, 62, 64, 66, 69, 71, 73, 74, 78] }
      ]
    ]
  },
  {
    id: 'sunset-terrace',
    name: 'Adriatic Twilight',
    sub: '夕暮れの港町バラード',
    ensembleTag: 'カフェ・トリオ',
    category: 'relax',
    desc: '夕暮れの海辺を思わせる叙情的な進行。ゆったりとした休符と落ち着いた低音が、一日の終わりを和らげます。',
    colors: ['#1d2875', '#6366f1', '#e0e7ff'],
    plateColor: '#1c214a',
    bpm: 58,
    swing: 60,
    scaleLabel: 'Ab Major 9',
    timbre: 'felt',
    mix: { chords: 42, drums: 14, bass: 46, melody: 88, warmth: 2150, wow: 15, vinyl: 18, rain: 10, air: 20, brown: 8 },
    progressions: [
      [
        { name: 'Abmaj9', bass: 44, notes: [51, 55, 56, 60, 63], scale: [60, 63, 65, 67, 68, 70, 72, 75, 77, 80] },
        { name: 'Fm11', bass: 41, notes: [51, 53, 56, 60, 63], scale: [60, 63, 65, 67, 68, 70, 72, 75, 77, 79] },
        { name: 'Dbmaj9', bass: 37, notes: [49, 53, 56, 60, 65], scale: [60, 63, 65, 68, 70, 72, 75, 77, 80] },
        { name: 'Eb9sus', bass: 39, notes: [51, 53, 56, 58, 63], scale: [60, 63, 65, 67, 70, 72, 75, 77, 79] }
      ]
    ]
  },
  {
    id: 'cyber-rain',
    name: 'Cobalt Rain',
    sub: '雨の窓辺とフェルトピアノ',
    ensembleTag: 'カフェ・トリオ',
    category: 'focus',
    desc: '窓を打つ雨音と、角の丸いマイナー調のピアノ。周囲の気配を遠ざけ、静かな集中状態を支えます。',
    colors: ['#0018c6', '#2563eb', '#bfdbfe'],
    plateColor: '#0b1c5c',
    bpm: 61,
    swing: 58,
    scaleLabel: 'C Dorian',
    timbre: 'felt',
    mix: { chords: 40, drums: 16, bass: 50, melody: 86, warmth: 1950, wow: 14, vinyl: 16, rain: 42, air: 16, brown: 14 },
    progressions: [
      [
        { name: 'Cm9', bass: 36, notes: [51, 55, 58, 62, 67], scale: [60, 62, 63, 65, 67, 70, 72, 74, 75, 79] },
        { name: 'Abmaj9', bass: 44, notes: [51, 55, 56, 60, 63], scale: [60, 62, 63, 67, 68, 70, 72, 75, 79] },
        { name: 'Fm9', bass: 41, notes: [51, 53, 56, 60, 63], scale: [60, 63, 65, 67, 68, 70, 72, 75, 77] },
        { name: 'G7alt', bass: 43, notes: [50, 53, 56, 59, 63], scale: [59, 62, 63, 65, 68, 70, 72, 74, 75] }
      ]
    ]
  },
  {
    id: 'sakura-dust',
    name: 'Porcelain Nocturne',
    sub: '静かな夜のピアノ独奏',
    ensembleTag: 'ピアノ独奏',
    category: 'relax',
    desc: 'ピアノ一台だけのシンプルな夜想曲。ペダルの深い響きと間の美しさが、深夜の部屋に落ち着きをもたらします。',
    colors: ['#1e293b', '#64748b', '#f1f5f9'],
    plateColor: '#1c2433',
    bpm: 54,
    swing: 55,
    scaleLabel: 'G Major',
    timbre: 'felt',
    mix: { chords: 44, drums: 0, bass: 0, melody: 92, warmth: 2300, wow: 11, vinyl: 14, rain: 12, air: 22, brown: 6 },
    progressions: [
      [
        { name: 'Gmaj9', bass: 43, notes: [50, 54, 55, 59, 62], scale: [59, 62, 64, 66, 67, 69, 71, 74, 76, 78, 79] },
        { name: 'Em9', bass: 40, notes: [50, 52, 55, 59, 64], scale: [59, 62, 64, 66, 67, 69, 71, 74, 76, 79] },
        { name: 'Cmaj9', bass: 36, notes: [48, 52, 55, 59, 62], scale: [59, 60, 62, 64, 67, 69, 71, 72, 74, 76, 79] },
        { name: 'D13sus', bass: 38, notes: [50, 52, 55, 57, 62], scale: [59, 62, 64, 66, 67, 69, 71, 74, 76, 78] }
      ]
    ]
  },
  {
    id: 'monolith-focus',
    name: 'Obsidian Study',
    sub: '深い集中向けの書斎ジャズ',
    ensembleTag: 'カフェ・トリオ',
    category: 'focus',
    desc: '落ち着いた低域の環境音に、控えめなマイナーピアノとベースが寄り添う長時間作業向けの設定です。',
    colors: ['#0f172a', '#475569', '#e2e8f0'],
    plateColor: '#151b26',
    bpm: 63,
    swing: 57,
    scaleLabel: 'A Minor 9',
    timbre: 'felt',
    mix: { chords: 40, drums: 18, bass: 50, melody: 84, warmth: 2100, wow: 10, vinyl: 12, rain: 14, air: 12, brown: 24 },
    progressions: [
      [
        { name: 'Am9', bass: 45, notes: [52, 55, 59, 60, 64], scale: [60, 62, 64, 67, 69, 71, 72, 74, 76, 79] },
        { name: 'Fmaj9', bass: 41, notes: [52, 53, 57, 60, 64], scale: [60, 62, 64, 65, 67, 69, 72, 74, 76, 79] },
        { name: 'Dm9', bass: 38, notes: [50, 53, 57, 60, 64], scale: [60, 62, 64, 65, 67, 69, 72, 74, 76, 77] },
        { name: 'E7b13', bass: 40, notes: [50, 52, 56, 59, 64], scale: [59, 62, 64, 68, 69, 71, 74, 76, 79] }
      ]
    ]
  },
  {
    id: 'starlight-drift',
    name: 'Hermes Astral',
    sub: '夜汽車と星空の室内楽',
    ensembleTag: '室内楽',
    category: 'relax',
    desc: 'ゆったりとした55 BPMの呼吸。ピアノ、チェロ、ウッドベースが静かに溶け合うアンビエント室内楽です。',
    colors: ['#061ec4', '#4f46e5', '#e0e7ff'],
    plateColor: '#111b54',
    bpm: 55,
    swing: 57,
    scaleLabel: 'Bb Major 9',
    timbre: 'chamber',
    mix: { chords: 42, drums: 10, bass: 44, melody: 90, warmth: 2200, wow: 16, vinyl: 16, rain: 14, air: 24, brown: 10 },
    progressions: [
      [
        { name: 'Bbmaj9', bass: 34, notes: [50, 53, 57, 58, 62], scale: [58, 60, 62, 65, 67, 69, 70, 72, 74, 77, 81] },
        { name: 'Gm11', bass: 31, notes: [50, 53, 55, 58, 62], scale: [58, 60, 62, 65, 67, 69, 70, 74, 77, 79] },
        { name: 'Ebmaj9', bass: 39, notes: [50, 51, 55, 58, 62], scale: [58, 60, 62, 63, 65, 67, 70, 74, 75, 79] },
        { name: 'F13sus', bass: 41, notes: [50, 51, 53, 57, 60], scale: [58, 60, 62, 65, 67, 69, 70, 72, 74, 77] }
      ]
    ]
  }
];

export const DEFAULT_SAVED_PRESETS: SavedPreset[] = [
  {
    name: "Kiki's Bakery — カフェ・トリオ",
    vibeId: 'midnight-tokyo',
    bpm: 62,
    swing: 58,
    timbre: 'felt',
    mix: { chords: 44, drums: 16, bass: 48, melody: 88, warmth: 2400, wow: 12, vinyl: 14, rain: 16, air: 15, brown: 8 }
  },
  {
    name: 'Bygone Summer — ピアノ＆チェロ独奏',
    vibeId: 'mossy-dawn',
    bpm: 56,
    swing: 54,
    timbre: 'chamber',
    mix: { chords: 45, drums: 0, bass: 0, melody: 92, warmth: 2750, wow: 8, vinyl: 10, rain: 14, air: 22, brown: 6 }
  }
];
