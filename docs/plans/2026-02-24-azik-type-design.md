# AZIK Type - Design Document

## Overview

AZIKキーマップの習得と速度向上を目的としたWebタイピング練習アプリ。

## Requirements

- **目的:** AZIK初心者の習得 + 上級者のスピードアップ
- **プラットフォーム:** Webアプリ（Vite + React + TypeScript）
- **練習モード:**
  - カナ→AZIKキー入力（単語単位のドリル）
  - 2分間 文章タイピング
- **入力判定:**
  - AZIK専用モード: 各かな位置に対して最短キー列のみ正解とする。同一かなに複数のAZIKエントリがある場合、最もキー数が少ないものだけを許可。同キー数の場合は全て許可。ただし最短判定はエッジ単位（個別のかな区間）で行い、DAG全体の最短経路強制はしない。例: 「こと」は `kt`(2キー) も `ko`+`to`(4キー) も両方許可。
- **スコア保存:** なし（毎回リセット）
- **UI:** シンプルなGitHub風

## Architecture

```
azik-type/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # 画面state管理（Router不要）
│   ├── data/
│   │   ├── azikData.ts           # カテゴリ付きAZIKマッピング（型付き）
│   │   └── sentences.ts          # 練習用文章
│   ├── engine/                   # フレームワーク非依存のpure TS
│   │   ├── types.ts              # 型定義
│   │   ├── decomposer.ts         # かな文字列 → 入力パスDAG
│   │   ├── inputMatcher.ts       # キー入力をDAGに照合する状態マシン
│   │   └── session.ts            # セッション管理（問題生成、スコア計算）
│   ├── hooks/
│   │   └── useTypingSession.ts   # エンジンをラップするReact Hook
│   ├── components/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx    # モード選択画面
│   │   │   ├── DrillScreen.tsx   # 単語ドリル（カナ/カテゴリ共用）
│   │   │   └── SentenceScreen.tsx # 文章タイピング
│   │   └── ui/
│   │       ├── TypingDisplay.tsx # 目標 + 入力状態表示
│   │       ├── KeyHint.tsx       # AZIKヒント
│   │       ├── CategorySelect.tsx # カテゴリ選択
│   │       └── SessionResult.tsx  # 結果表示
│   └── styles/
│       └── github.css             # GitHub風 css
├── public/
├── azik_romantable.txt           # 元データ（ソースオブトゥルース）
├── scripts/
│   └── generateAzikData.ts       # txt → TypeScriptデータ変換スクリプト
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Engine Design

### 1. Data Layer (`data/azikData.ts`)

AZIKマッピングをカテゴリ分類して保持。

| カテゴリ | 例 | 説明 |
|---------|----|----|
| `basic` | ka→か, ki→き | 基本かな入力 |
| `dakuten` | ga→が, za→ざ | 濁音・半濁音 |
| `youon` | kya→きゃ, sya→しゃ | 拗音 |
| `hatsuon_shortcut` | kz→かん, sk→しん | 撥音(ん)ショートカット |
| `double_vowel` | kq→かい, kw→けい, kp→こう | 二重母音ショートカット |
| `compound_word` | kt→こと, sr→する, ds→です | 特殊単語ショートカット |
| `symbol` | ;→っ, q→ん, :→ー | 記号・特殊 |
| `punctuation` | ,→、, .→。, /→・ | 句読点・記号 |

型定義:

```typescript
type Category = 'basic' | 'dakuten' | 'youon' | 'hatsuon_shortcut'
  | 'double_vowel' | 'compound_word' | 'symbol' | 'punctuation'

type AzikEntry = {
  romaji: string      // 入力キー列
  kana: string        // 出力かな
  category: Category
  priority: number    // 同一かなへの複数入力時の優先度（小さいほど高い）
}
```

**重複解決ルール:**
- 同一`kana`に複数エントリがある場合、`priority`値が最小のものが最短キー扱い
- AZIK専用モードではDecomposer段階で最短キー列のエントリのみをDAGエッジに含める
- `priority`は`generateAzikData.ts`が`romaji.length`をベースに自動付与

### 2. Decomposer (`engine/decomposer.ts`)

かな文字列を受け取り、入力パスのDAGを構築する。

**入力対象文字集合と正規化:**
- 入力文字列はNFKCで正規化してから処理
- 対象: ひらがな、句読点（、。）、中黒（・）、長音（ー）、小書きかな（ぁぃぅぇぉっゃゅょ）
- 非対象文字（漢字、英数字、スペース等）はスキップノードとして扱い、打鍵不要で自動通過

**処理:**
1. ターゲット文字列をNFKC正規化
2. 各位置から、マッチするAZIKエントリを全て探索（単一かな・複数かな問わず全候補をDAGに載せる）
3. 単一かな（1文字）と複数かな（2文字以上、例: kt→こと）の両方を考慮
4. AZIK専用モード: 各エッジに最短キー列のみ付与
5. 非対象文字はε遷移（コスト0のスキップエッジ）としてDAGに挿入

**例: 「ことがある」**

```
位置0「こ」→ 有効入力: ["ko"]
位置0「こと」→ 有効入力: ["kt"]
位置1「と」→ 有効入力: ["to"]
位置2「が」→ 有効入力: ["ga"]
位置3「あ」→ 有効入力: ["a"]
位置4「る」→ 有効入力: ["ru"]

DAG:
[0]──ko──→[1]──to──→[2]──ga──→[3]──a──→[4]──ru──→[5]
[0]──kt──────────→[2]
```

### 3. InputMatcher (`engine/inputMatcher.ts`)

DAG上をキー入力ごとに歩くNFA風状態マシン。

**状態:**

```typescript
type MatcherCursor = {
  nodeId: number       // 現在のDAGノード位置
  edgeIndex: number    // 現在追跡しているエッジのインデックス
  offset: number       // そのエッジのromaji内での入力済みオフセット
}

type MatcherState = {
  cursors: MatcherCursor[]   // 現在有効な全カーソル（NFA的に並行追跡）
  totalKeystrokes: number    // 総打鍵数
  missCount: number          // ミス打鍵数
}
```

**ε-closure展開:**
- 初期化時およびエッジ完了による遷移後に、到達ノードからε遷移（スキップエッジ）を再帰的に展開し、全到達可能ノードのカーソルを生成する
- これにより非対象文字（漢字・スペース等）を打鍵なしで自動通過する

**キー入力ごとの処理:**
1. `totalKeystrokes`をインクリメント（判定結果に関係なく、1キー受信ごとに先にカウント）
2. 全`cursors`に対してキーを適用
3. 各cursorの`edge.romaji[offset]`とキーを比較
   - 一致 → `offset + 1`。`offset === romaji.length`ならエッジ完了、次ノードへ遷移してε-closure展開
   - 不一致 → そのcursorを除去
4. 全cursorが除去された場合 → `'error'`（**cursorsは入力前の状態に復元する**）
5. いずれかのcursorがDAG終端に到達 → `'complete'`
6. それ以外 → `'progress'`

**エラー時の処理ポリシー:**
- ミスキーは`missCount`に加算し、赤色フラッシュで視覚フィードバック
- `cursors`を入力前の状態に復元する（ミスキーは無かったことにして、正しいキーの再入力を待つ）
- Backspaceは無効（前方入力のみ）

**返り値:** `'progress' | 'complete' | 'error'`

### 4. Session (`engine/session.ts`)

モードに応じた問題生成とセッション管理。

- **ドリルモード:** カテゴリでフィルタしたAzikEntryからランダム出題、10問1セット
  - 同一セット内での重複回避
  - カテゴリ内のエントリ数が10未満の場合はエントリ数分で1セット
- **文章モード:** sentences.tsから文章を取得、decomposerでDAG生成、制限時間120秒

**メトリクス定義:**

| 指標 | 定義 |
|------|------|
| KPM (Keys Per Minute) | `totalKeystrokes / 経過時間(分)` |
| 正確率 | `(totalKeystrokes - missCount) / totalKeystrokes * 100` |
| 有効KPM | `KPM * 正確率 / 100` |

- `totalKeystrokes`: エラー打鍵を含む全打鍵数（判定前にインクリメント）
- `missCount`: `'error'`を返した打鍵数
- 0打鍵時: 正確率・有効KPMは`--`表示、KPMは`0`表示
- タイマー: 最初の打鍵で開始。ドリルは全問完了で停止、文章は120秒経過で停止
- 文章モード終了条件: 120秒経過で強制終了。120秒前に文を打ち終えた場合は次の文に進む（sentences.tsから順次取得）。全文消化した場合はその時点で終了

## UI Design

### Screen Flow

```
HomeScreen → DrillScreen (カナ/カテゴリ選択)
           → SentenceScreen (文章タイピング)
           ← SessionResult (結果画面) → HomeScreen
```

React Routerは不使用。`App.tsx`のstateで画面管理。
MVPではURL共有・ブラウザバック非対応。将来的に必要になれば最小限のルーティングを導入する。

### GitHub Theme

- 背景: `#0d1117`（GitHub Dark）
- テキスト: `#e6edf3`
- アクセント: `#58a6ff`（リンク・ハイライト）
- エラー: `#f85149`（ミスキー表示）
- 成功: `#3fb950`（正解表示）
- フォント: `ui-monospace, SFMono-Regular, monospace`（入力部分）、`-apple-system, sans-serif`（UI部分）
- フォーカス: `2px solid #58a6ff` のアウトラインで可視化

### HomeScreen

- アプリタイトル + 簡単な説明
- ドリルモード / 文章モードの選択ボタン

### DrillScreen

- 画面上部: カテゴリ選択
- 画面中央: 出題かな（大きく表示）
- 画面下部: 入力エリア + ヒント表示（オプション）
- 進捗: 現在の問/全問、正確率

### SentenceScreen

- 画面中央: 文章表示（入力済み部分をハイライト）
- 画面下部: リアルタイムKPM、正確率
- 現在位置のAZIKヒント表示（オプション）
- 残り時間表示
