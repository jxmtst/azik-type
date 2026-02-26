// src/engine/dagShortest.ts
import type { InputDag } from './types'

/**
 * 各ノードから終端への最短romajiキー数を計算する（後ろからDP）。
 * 返り値: dist[i] = ノードiから終端への最短コスト
 */
export function computeShortestDist(dag: InputDag): number[] {
  const n = dag.nodeCount
  const dist = new Array<number>(n).fill(Infinity)
  dist[n - 1] = 0

  for (let i = n - 2; i >= 0; i--) {
    const edgeIndices = dag.edgesByNode[i]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        const cost = dist[edge.to]
        if (cost < dist[i]) dist[i] = cost
      } else {
        const minLen = Math.min(...edge.romajiOptions.map(r => r.length))
        const cost = minLen + dist[edge.to]
        if (cost < dist[i]) dist[i] = cost
      }
    }
  }

  return dist
}

/**
 * DAGから最短経路上にないエッジを除去して返す。
 * エッジが最短経路上にある条件: minRomajiLen(edge) + dist[edge.to] === dist[edge.from]
 */
export function pruneToShortest(dag: InputDag): InputDag {
  const dist = computeShortestDist(dag)
  const n = dag.nodeCount
  const newEdges = [...dag.edges] // 参照保持（indexを維持するため、nullableにしない）
  const newEdgesByNode: number[][] = Array.from({ length: n }, () => [])

  for (let i = 0; i < n; i++) {
    const edgeIndices = dag.edgesByNode[i]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        // ε遷移: dist[to] === dist[from] なら最短経路上
        if (dist[edge.to] === dist[i]) {
          newEdgesByNode[i].push(edgeIdx)
        }
      } else {
        const minLen = Math.min(...edge.romajiOptions.map(r => r.length))
        const cost = minLen + dist[edge.to]
        if (cost === dist[i]) {
          newEdgesByNode[i].push(edgeIdx)
        }
      }
    }
  }

  return { nodeCount: n, edges: newEdges, edgesByNode: newEdgesByNode }
}
