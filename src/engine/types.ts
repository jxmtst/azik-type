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
