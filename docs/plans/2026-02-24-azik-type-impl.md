# AZIK Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AZIKキーマップ練習Webアプリを設計書に基づいてTDDで実装する

**Architecture:** engineをpure TSで実装し、React UIから分離。azik_romantable.txtからデータ生成 → Decomposer(DAG構築) → InputMatcher(NFA状態マシン) → Session(問題管理) → React Hook → UI Components

**Tech Stack:** Vite 7, React 19, TypeScript 5.9, Vitest 4

**設計書:** `docs/plans/2026-02-24-azik-type-design.md`

---

### Task 1: 型定義

**Files:**
- Create: `src/engine/types.ts`

**Step 1: 型定義ファイルを作成**

```typescript
// src/engine/types.ts

export type Category =
  | 'basic'
  | 'dakuten'
  | 'youon'
  | 'hatsuon_shortcut'
  | 'double_vowel'
  | 'compound_word'
  | 'symbol'
  | 'punctuation'

export type AzikEntry = {
  romaji: string
  kana: string
  category: Category
  priority: number
}

/** DAGのエッジ: あるノードから別のノードへの遷移 */
export type DagEdge = {
  from: number
  to: number
  romajiOptions: string[]  // このエッジで許可されるromaji入力列
  kana: string             // このエッジが表すかな文字列
  isSkip: boolean          // ε遷移（非対象文字のスキップ）
}

/** DAG全体 */
export type InputDag = {
  nodeCount: number
  edges: DagEdge[]
  /** ノードIDからそのノードを始点とするエッジのインデックス配列 */
  edgesByNode: number[][]
}

export type MatcherCursor = {
  nodeId: number
  edgeIndex: number
  offset: number
}

export type MatchResult = 'progress' | 'complete' | 'error'

export type MatcherState = {
  cursors: MatcherCursor[]
  totalKeystrokes: number
  missCount: number
}

export type SessionMode = 'drill' | 'sentence'

export type DrillConfig = {
  mode: 'drill'
  categories: Category[]
  questionCount: number
}

export type SentenceConfig = {
  mode: 'sentence'
  timeLimitSec: number
}

export type SessionConfig = DrillConfig | SentenceConfig

export type SessionMetrics = {
  totalKeystrokes: number
  missCount: number
  elapsedMs: number
}
```

**Step 2: ビルド確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx tsc --noEmit`
Expected: エラーなし

**Step 3: コミット**

```bash
git add src/engine/types.ts
git commit -m "feat: add engine type definitions"
```

---

### Task 2: AZIKデータ生成

**Files:**
- Create: `src/data/azikData.ts`
- Modify: `scripts/generateAzikData.ts`
- Test: `src/engine/__tests__/azikData.test.ts`

**Step 1: テストを書く**

```typescript
// src/engine/__tests__/azikData.test.ts
import { describe, it, expect } from 'vitest'
import { AZIK_ENTRIES, KANA_TO_ENTRIES, ROMAJI_TO_KANA } from '../../data/azikData'

describe('azikData', () => {
  it('エントリが存在する', () => {
    expect(AZIK_ENTRIES.length).toBeGreaterThan(0)
  })

  it('基本的なマッピングが正しい', () => {
    expect(ROMAJI_TO_KANA.get('ka')).toBe('か')
    expect(ROMAJI_TO_KANA.get('kt')).toBe('こと')
    expect(ROMAJI_TO_KANA.get(';')).toBe('っ')
  })

  it('KANA_TO_ENTRIESで逆引きできる', () => {
    const kaEntries = KANA_TO_ENTRIES.get('か')
    expect(kaEntries).toBeDefined()
    expect(kaEntries!.some(e => e.romaji === 'ka')).toBe(true)
  })

  it('全エントリにcategoryとpriorityがある', () => {
    for (const entry of AZIK_ENTRIES) {
      expect(entry.category).toBeTruthy()
      expect(typeof entry.priority).toBe('number')
    }
  })

  it('priorityはromaji.lengthベース', () => {
    for (const entry of AZIK_ENTRIES) {
      expect(entry.priority).toBe(entry.romaji.length)
    }
  })
})
```

**Step 2: テストが失敗することを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/azikData.test.ts`
Expected: FAIL（azikData.tsが存在しない）

**Step 3: generateAzikData.tsを生成スクリプトに書き換え**

`scripts/generateAzikData.ts` を書き換える。azik_romantable.txtを読み取り、分類ロジック（既存のclassifyEntry相当）を使って`src/data/azikData.ts`をファイル出力する。

- 既存の分類ロジック（SYMBOL_ROMAJI, COMPOUND_WORD_ROMAJI, classifyEntry等）はそのまま活用
- 出力: `AZIK_ENTRIES: AzikEntry[]`, `ROMAJI_TO_KANA: Map<string, string>`, `KANA_TO_ENTRIES: Map<string, AzikEntry[]>`
- `priority`は`romaji.length`

**Step 4: スクリプトを実行してazikData.tsを生成**

Run: `cd /Users/junmtst/Development/work/azik-type && npx tsx scripts/generateAzikData.ts`
Expected: `src/data/azikData.ts`が生成される

**Step 5: テストが通ることを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/azikData.test.ts`
Expected: PASS

**Step 6: コミット**

```bash
git add src/data/azikData.ts src/engine/__tests__/azikData.test.ts scripts/generateAzikData.ts
git commit -m "feat: generate azikData from romantable with categories and priority"
```

---

### Task 3: Decomposer

**Files:**
- Create: `src/engine/decomposer.ts`
- Test: `src/engine/__tests__/decomposer.test.ts`

**Step 1: テストを書く**

```typescript
// src/engine/__tests__/decomposer.test.ts
import { describe, it, expect } from 'vitest'
import { decompose } from '../decomposer'

describe('decompose', () => {
  it('単一かな文字列のDAGを構築する', () => {
    const dag = decompose('か')
    expect(dag.nodeCount).toBe(2) // [0] -> [1]
    expect(dag.edges).toHaveLength(1)
    expect(dag.edges[0].romajiOptions).toContain('ka')
    expect(dag.edges[0].kana).toBe('か')
  })

  it('複数かなの直列DAGを構築する', () => {
    const dag = decompose('かき')
    expect(dag.nodeCount).toBe(3) // [0] -> [1] -> [2]
    expect(dag.edges.length).toBeGreaterThanOrEqual(2)
  })

  it('複合語ショートカットで分岐DAGを構築する', () => {
    // 「こと」は kt(2キー) でも ko+to(4キー) でも入力可能
    const dag = decompose('こと')
    expect(dag.nodeCount).toBe(3) // [0], [1], [2]
    // ko→[1], to→[2] のパスと kt→[2] のパスがある
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(2) // ko と kt
    const ktEdge = edgesFrom0.find(e => e.kana === 'こと')
    expect(ktEdge).toBeDefined()
    expect(ktEdge!.romajiOptions).toContain('kt')
    expect(ktEdge!.to).toBe(2)
  })

  it('設計書の例: ことがある', () => {
    const dag = decompose('ことがある')
    expect(dag.nodeCount).toBe(6) // 5文字 + 終端
    // 位置0から「こ」(ko)と「こと」(kt)の2エッジ
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(2)
  })

  it('非対象文字はスキップエッジになる', () => {
    // 漢字はスキップ
    const dag = decompose('あ字か')
    const skipEdges = dag.edges.filter(e => e.isSkip)
    expect(skipEdges.length).toBe(1)
    expect(skipEdges[0].kana).toBe('字')
  })

  it('句読点は入力対象', () => {
    const dag = decompose('あ。')
    const periodEdge = dag.edges.find(e => e.kana === '。')
    expect(periodEdge).toBeDefined()
    expect(periodEdge!.isSkip).toBe(false)
    expect(periodEdge!.romajiOptions).toContain('.')
  })

  it('空文字列は空DAGを返す', () => {
    const dag = decompose('')
    expect(dag.nodeCount).toBe(1)
    expect(dag.edges).toHaveLength(0)
  })

  it('NFKC正規化される', () => {
    // 全角カタカナ「カ」→ NFC/NFKC ではカタカナのまま → 非対象文字としてスキップ
    // ひらがな「か」はそのまま処理
    const dag = decompose('か')
    expect(dag.edges[0].kana).toBe('か')
  })
})
```

**Step 2: テストが失敗することを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/decomposer.test.ts`
Expected: FAIL

**Step 3: decomposer.tsを実装**

```typescript
// src/engine/decomposer.ts
import type { InputDag, DagEdge } from './types'
import { KANA_TO_ENTRIES } from '../data/azikData'

/** 入力対象文字かどうか判定 */
function isTargetChar(ch: string): boolean {
  // ひらがな U+3040-U+309F
  const code = ch.charCodeAt(0)
  if (code >= 0x3040 && code <= 0x309F) return true
  // 句読点・記号
  if ('、。・ー'.includes(ch)) return true
  return false
}

export function decompose(input: string): InputDag {
  const normalized = input.normalize('NFKC')
  const chars = [...normalized]
  const nodeCount = chars.length + 1
  const edges: DagEdge[] = []
  const edgesByNode: number[][] = Array.from({ length: nodeCount }, () => [])

  for (let i = 0; i < chars.length; i++) {
    if (!isTargetChar(chars[i])) {
      // ε遷移（スキップ）
      const idx = edges.length
      edges.push({ from: i, to: i + 1, romajiOptions: [], kana: chars[i], isSkip: true })
      edgesByNode[i].push(idx)
      continue
    }

    // 1文字マッチ
    const entries1 = KANA_TO_ENTRIES.get(chars[i])
    if (entries1 && entries1.length > 0) {
      const romajiOptions = entries1.map(e => e.romaji)
      const idx = edges.length
      edges.push({ from: i, to: i + 1, romajiOptions, kana: chars[i], isSkip: false })
      edgesByNode[i].push(idx)
    }

    // 2文字以上のマッチ（複合語ショートカット等）
    for (let len = 2; len <= Math.min(chars.length - i, 4); len++) {
      const substr = chars.slice(i, i + len).join('')
      const entries = KANA_TO_ENTRIES.get(substr)
      if (entries && entries.length > 0) {
        const romajiOptions = entries.map(e => e.romaji)
        const idx = edges.length
        edges.push({ from: i, to: i + len, romajiOptions, kana: substr, isSkip: false })
        edgesByNode[i].push(idx)
      }
    }
  }

  return { nodeCount, edges, edgesByNode }
}
```

**Step 4: テストが通ることを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/decomposer.test.ts`
Expected: PASS

**Step 5: コミット**

```bash
git add src/engine/decomposer.ts src/engine/__tests__/decomposer.test.ts
git commit -m "feat: implement decomposer with DAG construction"
```

---

### Task 4: InputMatcher

**Files:**
- Create: `src/engine/inputMatcher.ts`
- Test: `src/engine/__tests__/inputMatcher.test.ts`

**Step 1: テストを書く**

```typescript
// src/engine/__tests__/inputMatcher.test.ts
import { describe, it, expect } from 'vitest'
import { createMatcher, feedKey } from '../inputMatcher'
import { decompose } from '../decomposer'

describe('InputMatcher', () => {
  it('単一かな「か」をkaで入力完了', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'a')).toBe('complete')
  })

  it('ミスキーでerrorを返しcursorsが復元される', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    const cursorsBefore = JSON.stringify(state.cursors)
    expect(feedKey(state, dag, 'k')).toBe('error') // 'ka'の2文字目に'k'はミス
    expect(JSON.stringify(state.cursors)).toBe(cursorsBefore) // 復元される
    expect(state.missCount).toBe(1)
    expect(state.totalKeystrokes).toBe(3) // k, k(miss), まだaは押してない
  })

  it('ミス後に正しいキーで続行できる', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    feedKey(state, dag, 'k')
    feedKey(state, dag, 'x') // miss
    expect(feedKey(state, dag, 'a')).toBe('complete') // 正しいキーで完了
  })

  it('複合語ショートカット: ことをktで入力', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 't')).toBe('complete')
  })

  it('複合語を通常入力: ことをko+toで入力', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'o')).toBe('progress') // ko完了、次のエッジへ
    expect(feedKey(state, dag, 't')).toBe('progress')
    expect(feedKey(state, dag, 'o')).toBe('complete')
  })

  it('totalKeystrokesは毎回インクリメント（エラー含む）', () => {
    const dag = decompose('あ')
    const state = createMatcher(dag)
    feedKey(state, dag, 'x') // miss
    feedKey(state, dag, 'a') // correct
    expect(state.totalKeystrokes).toBe(2)
    expect(state.missCount).toBe(1)
  })

  it('ε遷移（スキップ）を自動通過する', () => {
    // 「あ字い」→ 「字」はスキップ
    const dag = decompose('あ字い')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'a')).toBe('progress') // 「あ」完了 → 「字」自動スキップ
    expect(feedKey(state, dag, 'i')).toBe('complete') // 「い」完了
  })

  it('空DAGはcreateMatcherでcomplete状態', () => {
    const dag = decompose('')
    const state = createMatcher(dag)
    // nodeCount=1, 終端=0, cursorsの初期nodeIdが0 → 即complete
    expect(state.cursors.length).toBe(0) // エッジがないのでcursorなし
  })
})
```

**Step 2: テストが失敗することを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/inputMatcher.test.ts`
Expected: FAIL

**Step 3: inputMatcher.tsを実装**

```typescript
// src/engine/inputMatcher.ts
import type { InputDag, MatcherCursor, MatcherState, MatchResult } from './types'

/** ε-closure展開: スキップエッジを再帰的にたどり、全到達ノードのカーソルを生成 */
function expandEpsilon(dag: InputDag, nodeIds: number[]): MatcherCursor[] {
  const visited = new Set<number>()
  const stack = [...nodeIds]
  const cursors: MatcherCursor[] = []

  while (stack.length > 0) {
    const nodeId = stack.pop()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    if (nodeId >= dag.nodeCount - 1) continue // 終端ノード

    const edgeIndices = dag.edgesByNode[nodeId] ?? []
    for (const ei of edgeIndices) {
      const edge = dag.edges[ei]
      if (edge.isSkip) {
        stack.push(edge.to)
      } else {
        cursors.push({ nodeId, edgeIndex: ei, offset: 0 })
      }
    }
  }
  return cursors
}

/** DAG終端に到達しているか（ε-closure含む） */
function reachesEnd(dag: InputDag, nodeIds: number[]): boolean {
  const visited = new Set<number>()
  const stack = [...nodeIds]
  while (stack.length > 0) {
    const nodeId = stack.pop()!
    if (nodeId >= dag.nodeCount - 1) return true
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    for (const ei of (dag.edgesByNode[nodeId] ?? [])) {
      if (dag.edges[ei].isSkip) stack.push(dag.edges[ei].to)
    }
  }
  return false
}

export function createMatcher(dag: InputDag): MatcherState {
  const cursors = expandEpsilon(dag, [0])
  return { cursors, totalKeystrokes: 0, missCount: 0 }
}

export function feedKey(state: MatcherState, dag: InputDag, key: string): MatchResult {
  state.totalKeystrokes++

  const prevCursors = state.cursors.map(c => ({ ...c }))
  const nextCursors: MatcherCursor[] = []
  const advancedNodeIds: number[] = []

  for (const cursor of state.cursors) {
    const edge = dag.edges[cursor.edgeIndex]
    const romaji = edge.romajiOptions.find(r => r[cursor.offset] === key)

    if (romaji === undefined) continue // このcursorは不一致

    const newOffset = cursor.offset + 1
    if (newOffset >= romaji.length) {
      // エッジ完了 → 次ノードへ
      advancedNodeIds.push(edge.to)
    } else {
      // このromajiオプションだけに絞る
      nextCursors.push({ nodeId: cursor.nodeId, edgeIndex: cursor.edgeIndex, offset: newOffset })
    }
  }

  // 完了したノードからε-closure展開
  if (advancedNodeIds.length > 0) {
    // DAG終端チェック
    if (reachesEnd(dag, advancedNodeIds)) {
      state.cursors = []
      return 'complete'
    }
    nextCursors.push(...expandEpsilon(dag, advancedNodeIds))
  }

  if (nextCursors.length === 0) {
    // 全cursor除去 → error、前の状態に復元
    state.cursors = prevCursors
    state.missCount++
    return 'error'
  }

  state.cursors = nextCursors
  return 'progress'
}
```

**注意:** 上記の実装は`romajiOptions`内で部分一致を追跡する簡易版。実際の実装では、各cursorが追跡中のromajiOptionを特定する必要がある。`offset`はエッジ内の全romajiOptionsに共通なので、キー入力時にどのromajiOptionが生きているかをフィルタする。この設計だとcursor内にactiveなromajiOptionsのindexを保持するか、cursorをromajiOption単位に展開する必要がある。

実装時にcursorの構造を以下のように拡張する:

```typescript
// types.ts に追加/修正
export type MatcherCursor = {
  nodeId: number
  edgeIndex: number
  romajiIndex: number  // edge.romajiOptions[romajiIndex]を追跡中
  offset: number
}
```

expandEpsilonでもromajiOption単位にcursorを生成し、feedKeyではcursor.romajiIndexで指定されたromajiのみチェックする。

**Step 4: テストが通ることを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/inputMatcher.test.ts`
Expected: PASS

**Step 5: コミット**

```bash
git add src/engine/inputMatcher.ts src/engine/__tests__/inputMatcher.test.ts src/engine/types.ts
git commit -m "feat: implement NFA-based InputMatcher with epsilon-closure"
```

---

### Task 5: Session

**Files:**
- Create: `src/engine/session.ts`
- Create: `src/data/sentences.ts`
- Test: `src/engine/__tests__/session.test.ts`

**Step 1: sentences.tsを作成**

```typescript
// src/data/sentences.ts
export const SENTENCES: string[] = [
  'きょうはいいてんきです。',
  'ことしのなつはあついです。',
  'わたしはまいにちべんきょうする。',
  'このほんはとてもおもしろい。',
  'あしたはともだちとあそぶ。',
  'でんしゃでがっこうにいく。',
  'おかあさんがごはんをつくる。',
  'にほんごのべんきょうはたのしい。',
  'あめがふっているからかさをもっていこう。',
  'しゅうまつにえいがをみにいく。',
]
```

**Step 2: テストを書く**

```typescript
// src/engine/__tests__/session.test.ts
import { describe, it, expect } from 'vitest'
import { createDrillSession, createSentenceSession, getNextQuestion } from '../session'

describe('DrillSession', () => {
  it('カテゴリを指定して問題を生成する', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['basic'], questionCount: 5 })
    expect(session.questions.length).toBe(5)
    for (const q of session.questions) {
      expect(q.entry.category).toBe('basic')
    }
  })

  it('同一セット内で重複しない', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['basic'], questionCount: 10 })
    const kanas = session.questions.map(q => q.entry.kana)
    expect(new Set(kanas).size).toBe(kanas.length)
  })

  it('エントリ数未満の場合はエントリ数分', () => {
    // punctuationカテゴリはエントリ少ない
    const session = createDrillSession({ mode: 'drill', categories: ['punctuation'], questionCount: 100 })
    expect(session.questions.length).toBeLessThanOrEqual(100)
    expect(session.questions.length).toBeGreaterThan(0)
  })
})

describe('SentenceSession', () => {
  it('文章セッションを作成できる', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 120 })
    expect(session.timeLimitMs).toBe(120000)
    const q = getNextQuestion(session)
    expect(q).toBeDefined()
    expect(q!.dag.nodeCount).toBeGreaterThan(1)
  })
})
```

**Step 3: テストが失敗することを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/session.test.ts`
Expected: FAIL

**Step 4: session.tsを実装**

```typescript
// src/engine/session.ts
import type { DrillConfig, SentenceConfig, AzikEntry, InputDag } from './types'
import { AZIK_ENTRIES } from '../data/azikData'
import { SENTENCES } from '../data/sentences'
import { decompose } from './decomposer'

export type DrillQuestion = {
  entry: AzikEntry
  dag: InputDag
}

export type DrillSession = {
  questions: DrillQuestion[]
  currentIndex: number
}

export type SentenceQuestion = {
  text: string
  dag: InputDag
}

export type SentenceSession = {
  timeLimitMs: number
  sentenceIndex: number
  currentQuestion: SentenceQuestion | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createDrillSession(config: DrillConfig): DrillSession {
  const filtered = AZIK_ENTRIES.filter(e => config.categories.includes(e.category))
  const shuffled = shuffle(filtered)
  const count = Math.min(config.questionCount, shuffled.length)
  const questions = shuffled.slice(0, count).map(entry => ({
    entry,
    dag: decompose(entry.kana),
  }))
  return { questions, currentIndex: 0 }
}

export function createSentenceSession(config: SentenceConfig): SentenceSession {
  return {
    timeLimitMs: config.timeLimitSec * 1000,
    sentenceIndex: 0,
    currentQuestion: null,
  }
}

export function getNextQuestion(session: SentenceSession): SentenceQuestion | null {
  if (session.sentenceIndex >= SENTENCES.length) return null
  const text = SENTENCES[session.sentenceIndex]
  session.sentenceIndex++
  const question: SentenceQuestion = { text, dag: decompose(text) }
  session.currentQuestion = question
  return question
}
```

**Step 5: テストが通ることを確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run src/engine/__tests__/session.test.ts`
Expected: PASS

**Step 6: コミット**

```bash
git add src/engine/session.ts src/engine/__tests__/session.test.ts src/data/sentences.ts
git commit -m "feat: implement session management with drill and sentence modes"
```

---

### Task 6: useTypingSession Hook

**Files:**
- Create: `src/hooks/useTypingSession.ts`

**Step 1: hookを実装**

useTypingSessionはエンジンのcreateMatcherとfeedKeyをラップし、React stateとして提供する。

- `startDrill(config)` / `startSentence(config)` でセッション開始
- `onKeyDown(key)` でキー入力をfeedKeyに渡す
- `metrics` で現在のKPM/正確率を算出
- タイマー管理（最初の打鍵で開始、文章モードは120秒で自動停止）

**Step 2: ビルド確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx tsc --noEmit`
Expected: エラーなし

**Step 3: コミット**

```bash
git add src/hooks/useTypingSession.ts
git commit -m "feat: add useTypingSession React hook"
```

---

### Task 7: GitHub CSSテーマ

**Files:**
- Create: `src/styles/github.css`
- Modify: `src/index.css`

**Step 1: github.cssを作成**

設計書のテーマ定義に基づく:
- 背景: `#0d1117`
- テキスト: `#e6edf3`
- アクセント: `#58a6ff`
- エラー: `#f85149`
- 成功: `#3fb950`
- フォント: monospace系 + sans-serif系
- フォーカス: `2px solid #58a6ff`

CSS変数として定義し、各コンポーネントで使用する。

**Step 2: index.cssを更新**

既存のViteテンプレートCSSを削除し、github.cssをimportする。

**Step 3: コミット**

```bash
git add src/styles/github.css src/index.css
git commit -m "feat: add GitHub Dark theme CSS"
```

---

### Task 8: UIコンポーネント - SessionResult, KeyHint, CategorySelect, TypingDisplay

**Files:**
- Create: `src/components/ui/SessionResult.tsx`
- Create: `src/components/ui/KeyHint.tsx`
- Create: `src/components/ui/CategorySelect.tsx`
- Create: `src/components/ui/TypingDisplay.tsx`

**Step 1: 各UIコンポーネントを作成**

- **SessionResult:** KPM, 正確率, 有効KPMを表示。0打鍵時は`--`表示。「ホームに戻る」ボタン。
- **KeyHint:** 現在のかなに対するAZIKショートカットを表示（KANA_TO_ENTRIESで逆引き）
- **CategorySelect:** チェックボックスでカテゴリ複数選択
- **TypingDisplay:** 目標かな/文章を表示、入力済み部分をハイライト、現在位置を強調

**Step 2: ビルド確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx tsc --noEmit`
Expected: エラーなし

**Step 3: コミット**

```bash
git add src/components/ui/
git commit -m "feat: add UI components (SessionResult, KeyHint, CategorySelect, TypingDisplay)"
```

---

### Task 9: Screen コンポーネント

**Files:**
- Create: `src/components/screens/HomeScreen.tsx`
- Create: `src/components/screens/DrillScreen.tsx`
- Create: `src/components/screens/SentenceScreen.tsx`

**Step 1: HomeScreenを作成**

- アプリタイトル「AZIK Type」
- ドリルモード / 文章モードの選択ボタン
- `onSelectMode: (mode: 'drill' | 'sentence') => void` をpropsで受け取る

**Step 2: DrillScreenを作成**

- CategorySelectでカテゴリ選択 → 開始
- useTypingSessionを使ってドリル管理
- TypingDisplayで出題表示
- KeyHintでヒント表示
- 全問完了 → SessionResultに遷移するコールバック

**Step 3: SentenceScreenを作成**

- useTypingSessionで文章モード管理
- TypingDisplayで文章表示（入力済みハイライト）
- リアルタイムKPM、正確率、残り時間表示
- 120秒 or 全文完了 → SessionResultへ

**Step 4: ビルド確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npx tsc --noEmit`
Expected: エラーなし

**Step 5: コミット**

```bash
git add src/components/screens/
git commit -m "feat: add screen components (Home, Drill, Sentence)"
```

---

### Task 10: App統合

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/App.css`

**Step 1: App.tsxを書き換え**

- 画面state: `'home' | 'drill' | 'sentence' | 'result'`
- HomeScreen / DrillScreen / SentenceScreen / SessionResultを切り替え
- 結果データをstateで保持しSessionResultに渡す

**Step 2: 不要ファイル削除**

- `src/App.css`（テンプレートCSS）
- `src/assets/react.svg`

**Step 3: dev serverで動作確認**

Run: `cd /Users/junmtst/Development/work/azik-type && npm run dev`
Expected: ブラウザでHomeScreenが表示される

**Step 4: コミット**

```bash
git add src/App.tsx
git rm src/App.css src/assets/react.svg
git commit -m "feat: integrate all screens in App with state-based routing"
```

---

### Task 11: 全体テスト・ビルド確認

**Step 1: 全テスト実行**

Run: `cd /Users/junmtst/Development/work/azik-type && npx vitest run`
Expected: 全PASS

**Step 2: プロダクションビルド**

Run: `cd /Users/junmtst/Development/work/azik-type && npm run build`
Expected: エラーなし

**Step 3: lint**

Run: `cd /Users/junmtst/Development/work/azik-type && npm run lint`
Expected: エラーなし（警告は許容）

**Step 4: コミット（必要に応じて修正後）**

```bash
git add -A
git commit -m "chore: fix build and lint issues"
```
