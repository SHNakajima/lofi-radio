import { GoogleGenAI } from '@google/genai';
import { convertAiJsonToPlayableScore, RawAiScoreResponse } from '../music/narrativeComposer';
import { getActiveVibe, state } from '../state/store';
import { EightBarScore } from '../types/music';

export const AI_SCORE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Poetic title for this 8-bar Ghibli/Cafe Jazz arrangement' },
    subtitle: { type: 'string', description: 'Short Japanese subtitle describing the mood and voicing' },
    bpm: { type: 'integer', description: 'Recommended slow ballad/cafe jazz tempo between 52 and 72' },
    chords: {
      type: 'array',
      description: '4 rich jazz chords (e.g. Fmaj9, G13sus, Em9, A7b13)',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          bass: { type: 'integer', description: 'MIDI bass note between 31 and 45' },
          notes: {
            type: 'array',
            description: '4 or 5 left-hand voicing MIDI notes between 48 and 67',
            items: { type: 'integer' }
          },
          scale: {
            type: 'array',
            description: '8 to 10 melody scale MIDI notes between 58 and 81',
            items: { type: 'integer' }
          }
        },
        required: ['name', 'bass', 'notes', 'scale']
      }
    },
    melodyEvents: {
      type: 'array',
      description:
        'Right-hand singing rubato melody across 8 bars (bar 0..7). MUST include long notes (durBeats 2.0 to 4.0), pickups (beat 3.5), and leave at least 2 bars (e.g. bar 3 and bar 7) completely empty as breathing rests.',
      items: {
        type: 'object',
        properties: {
          bar: { type: 'integer', description: 'Bar index 0 to 7' },
          beat: { type: 'number', description: 'Beat position 0.0 to 3.75' },
          midi: { type: 'integer', description: 'MIDI pitch between 60 and 81' },
          durBeats: { type: 'number', description: 'Duration in beats (0.5 to 4.5)' },
          vel: { type: 'number', description: 'Velocity 0.45 to 0.92' },
          rubatoMs: { type: 'integer', description: 'Human micro-timing offset in ms (-15 to +35)' },
          label: { type: 'string', description: 'Short expression tag e.g. ● AI SINGING LEAP' }
        },
        required: ['bar', 'beat', 'midi', 'durBeats', 'vel', 'rubatoMs']
      }
    }
  },
  required: ['title', 'subtitle', 'bpm', 'chords', 'melodyEvents']
};

/**
 * Generates an 8-bar Jazz Piano score using the official @google/genai SDK.
 * Strictly uses ONLY the user-selected model (no silent fallback to lower models).
 * Surfaces any API / authentication / CORS error directly to the caller.
 */
export async function requestGeminiScore(customPromptText: string): Promise<EightBarScore> {
  const apiKey = state.geminiApiKey.trim();
  if (!apiKey) {
    throw new Error('Gemini APIキーが未設定です。');
  }

  const vibe = getActiveVibe();
  const prompt = customPromptText.trim() || `${vibe.name} (${vibe.sub}): ${vibe.desc}`;

  const systemInstruction = [
    'あなたは久石譲（ジブリ・ジャズ編曲）とビル・エヴァンスの音楽理論に精通したジャズ・ピアニスト兼編曲家です。',
    '与えられた情景プロンプトに基づき、8小節（bar 0〜7、4/4拍子）の叙情的なピアノジャズ編曲スコアをJSONで作成してください。',
    '【絶対ルール】',
    '1. 機械的な8分音符の羅列は厳禁。アウフタクト（弱起: beat 3.5等）から歌い出し、5度や6度の美しい跳躍と2.5〜4拍伸びるロングトーン（durBeats: 2.5〜4.2）を入れること。',
    '2. 8小節のうち、bar 3 と bar 7 は「余韻と呼吸の間」として melodyEvents を一切配置しない（完全休符にする）こと。',
    '3. コード進行（4コード）は9th, 11th, 13th, sus4, サブドミナントマイナー等を含み、温かくノスタルジックな響きにすること。'
  ].join('\n');

  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model: state.geminiModel,
    system_instruction: systemInstruction,
    input: `情景・リクエスト: ${prompt}\n現在の基準テンポ: ${state.bpm} BPM`,
    store: false,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: AI_SCORE_JSON_SCHEMA
    }
  });

  const rawJsonText = interaction.output_text;
  if (!rawJsonText) {
    throw new Error(`モデル (${state.geminiModel}) から有効なJSON出力が得られませんでした。`);
  }

  const parsed = JSON.parse(rawJsonText) as RawAiScoreResponse;
  return convertAiJsonToPlayableScore(parsed);
}
