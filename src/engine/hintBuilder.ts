// src/engine/hintBuilder.ts
import type { InputDag } from './types'

/**
 * DAGの最短経路（総romaji長が最小）を求め、各エッジの最短romajiを連結して返す。
 * DP（動的計画法）でノード0から終端への最短コストを計算し、経路を復元する。
 */
export function buildShortestHint(dag: InputDag): string {
  const n = dag.nodeCount
  if (n <= 1) return ''

  // dist[i] = ノードiから終端への最短romajiキー数
  const dist = new Array<number>(n).fill(Infinity)
  // choice[i] = ノードiから進むべきエッジインデックスと使うromajiのインデックス
  const choice = new Array<{ edgeIdx: number; romaji: string } | null>(n).fill(null)

  dist[n - 1] = 0 // 終端ノード

  // 後ろから前にDP
  for (let i = n - 2; i >= 0; i--) {
    const edgeIndices = dag.edgesByNode[i]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        // ε遷移: コスト0
        const cost = dist[edge.to]
        if (cost < dist[i]) {
          dist[i] = cost
          choice[i] = { edgeIdx, romaji: '' }
        }
      } else {
        // 通常エッジ: 最短romajiOptionを使う
        const minRomaji = edge.romajiOptions.reduce((a, b) => a.length <= b.length ? a : b)
        const cost = minRomaji.length + dist[edge.to]
        if (cost < dist[i]) {
          dist[i] = cost
          choice[i] = { edgeIdx, romaji: minRomaji }
        }
      }
    }
  }

  // 経路復元
  const parts: string[] = []
  let node = 0
  while (node < n - 1) {
    const c = choice[node]
    if (!c) break
    parts.push(c.romaji)
    node = dag.edges[c.edgeIdx].to
  }

  return parts.join('')
}
