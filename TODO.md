# TODO — Aether

## 1. BYOK AI作曲（Gemini API / Vertex AI Express キー）の認証・403 / CORS問題調査
- **現象**:
  - `file://`（`origin: 'null'`）から `generativelanguage.googleapis.com/v1beta/interactions` をカスタムヘッダ付きで呼ぶとプリフライトがCORSエラーになる。
  - `AQ.` で始まるキー（Vertex AI Express Mode 形式）で `https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key=AQ...` を直接POSTすると `403 (Forbidden)` が返る。
- **対応方針**:
  - 下位モデル（`gemini-2.5-flash` 等）や別エンドポイントへの**暗黙的なフォールバックは一切行わず**、選択されたモデルで失敗した場合はエラー内容をそのまま素直に表示する。
  - Vite + TypeScript 環境上の公式 `@google/genai` SDK（`client.interactions.create`）または Vite 開発サーバーのプロキシ経由での疎通・APIキー種別（AI Studio `AIza...` vs Vertex AI `AQ....`）の正式な認証方式を検証・解決する。

## 2. ムードカード内のアニメーション実装（チル＋かわいらしさ）【実装済み】
- **採用方針**:
  - 案A：軽量 Canvas 2D マイクロアニメーション（全8ムード固有の情景モチーフ＋音楽連動リアクション）。
  - メインステージ（[visualizer.ts](src/ui/visualizer.ts)）とカードサムネイル（[cardAnimations.ts](src/ui/cardAnimations.ts)）のシーン描画ロジックは [moodScenes.ts](src/ui/moodScenes.ts) に単一ソースとして共通化済み。
  - オープンソースのアニメーションデザインスキル（Emil Kowalski `animate` / LottieFiles `motion-design`）を `.agents/skills/` に導入し、1/3ルール（選択中およびホバー/フォーカス中のカードのみ動作、非アクティブカードは静止描画で省電力）・サイン波ループ・`prefers-reduced-motion` 対応を適用済み。
