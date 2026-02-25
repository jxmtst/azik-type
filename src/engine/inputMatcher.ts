// src/engine/inputMatcher.ts
import type { InputDag, MatcherCursor, MatcherState, MatchResult } from './types'

/**
 * ε-closure展開: 指定ノードから到達可能な全カーソルを生成する。
 * スキップエッジ(ε遷移)は自動的にたどり、その先のノードのエッジも展開する。
 */
function expandEpsilon(dag: InputDag, nodeId: number): MatcherCursor[] {
  const cursors: MatcherCursor[] = []
  const visited = new Set<number>()

  const queue: number[] = [nodeId]
  while (queue.length > 0) {
    const nid = queue.shift()!
    if (visited.has(nid)) continue
    visited.add(nid)

    const edgeIndices = dag.edgesByNode[nid]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        // ε遷移: 自動的にたどる
        queue.push(edge.to)
      } else {
        // 通常エッジ: カーソルを生成（offset=0から開始）
        cursors.push({ nodeId: nid, edgeIndex: edgeIdx, offset: 0 })
      }
    }
  }

  return cursors
}

/** DAGの終端ノードIDかどうか */
function isTerminal(dag: InputDag, nodeId: number): boolean {
  return nodeId === dag.nodeCount - 1
}

/** ノードIDが終端、またはε遷移のみで終端に到達できるか */
function canReachTerminal(dag: InputDag, nodeId: number): boolean {
  const visited = new Set<number>()
  const queue: number[] = [nodeId]
  while (queue.length > 0) {
    const nid = queue.shift()!
    if (visited.has(nid)) continue
    visited.add(nid)

    if (isTerminal(dag, nid)) return true

    const edgeIndices = dag.edgesByNode[nid]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        queue.push(edge.to)
      }
    }
  }
  return false
}

export function createMatcher(dag: InputDag): MatcherState {
  if (dag.nodeCount <= 1) {
    return { cursors: [], totalKeystrokes: 0, missCount: 0 }
  }

  const cursors = expandEpsilon(dag, 0)
  return { cursors, totalKeystrokes: 0, missCount: 0 }
}

export function feedKey(state: MatcherState, dag: InputDag, key: string): MatchResult {
  // totalKeystrokesは判定前にインクリメント
  state.totalKeystrokes++

  // error時の復元用にcursorsをディープコピー
  const savedCursors = state.cursors.map(c => ({ ...c }))

  const nextCursors: MatcherCursor[] = []

  for (const cursor of state.cursors) {
    const edge = dag.edges[cursor.edgeIndex]
    // このエッジのromajiOptionsの中でcursor.offsetの位置がkeyと一致するものがあるか
    for (const romaji of edge.romajiOptions) {
      if (cursor.offset < romaji.length && romaji[cursor.offset] === key) {
        const newOffset = cursor.offset + 1
        if (newOffset >= romaji.length) {
          // このromajiオプションを完走 → 次のノードへ遷移
          // ε-closure展開で次のカーソルを取得
          const expanded = expandEpsilon(dag, edge.to)
          // 終端チェック: edge.toが終端ノード、またはε遷移で終端に到達可能
          if (canReachTerminal(dag, edge.to)) {
            // expandedが空（終端ノードに到達）ならcomplete
            if (expanded.length === 0) {
              state.cursors = []
              return 'complete'
            }
            // expandedがあるが、終端にも到達可能 → まだ先があるのでprogress扱いで追加
          }
          for (const nc of expanded) {
            // 重複チェック
            if (!nextCursors.some(c => c.nodeId === nc.nodeId && c.edgeIndex === nc.edgeIndex && c.offset === nc.offset)) {
              nextCursors.push(nc)
            }
          }
        } else {
          // まだromajiの途中 → offsetを進めたカーソルを追加
          const advanced = { nodeId: cursor.nodeId, edgeIndex: cursor.edgeIndex, offset: newOffset }
          if (!nextCursors.some(c => c.nodeId === advanced.nodeId && c.edgeIndex === advanced.edgeIndex && c.offset === advanced.offset)) {
            nextCursors.push(advanced)
          }
        }
      }
    }
  }

  if (nextCursors.length === 0) {
    // 全カーソルが除去された → ミスキー
    state.cursors = savedCursors
    state.missCount++
    return 'error'
  }

  state.cursors = nextCursors
  return 'progress'
}
