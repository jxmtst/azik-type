// src/engine/hintBuilder.ts
import type { InputDag } from './types'
import { getPreferredRomaji } from '../data/azikData'

export type HintPart = { romaji: string; fromNode: number; toNode: number }

/** エッジからHINT用の最適romajiを選択する（AZIKショートカット優先） */
function pickRomaji(kana: string, romajiOptions: string[]): string {
  const preferred = getPreferredRomaji(kana)
  if (preferred && romajiOptions.includes(preferred)) return preferred
  return romajiOptions.reduce((a, b) => a.length <= b.length ? a : b)
}

/** DAGの最短経路のDP計算 */
function computeShortestPath(dag: InputDag) {
  const n = dag.nodeCount
  const dist = new Array<number>(n).fill(Infinity)
  const choice = new Array<{ edgeIdx: number; romaji: string } | null>(n).fill(null)

  dist[n - 1] = 0

  for (let i = n - 2; i >= 0; i--) {
    const edgeIndices = dag.edgesByNode[i]
    if (!edgeIndices) continue

    for (const edgeIdx of edgeIndices) {
      const edge = dag.edges[edgeIdx]
      if (edge.isSkip) {
        const cost = dist[edge.to]
        if (cost < dist[i]) {
          dist[i] = cost
          choice[i] = { edgeIdx, romaji: '' }
        }
      } else {
        const romaji = pickRomaji(edge.kana, edge.romajiOptions)
        const cost = romaji.length + dist[edge.to]
        if (cost < dist[i]) {
          dist[i] = cost
          choice[i] = { edgeIdx, romaji }
        }
      }
    }
  }

  return { choice }
}

/**
 * DAGの最短経路（総romaji長が最小）を求め、各エッジの最短romajiを連結して返す。
 */
export function buildShortestHint(dag: InputDag): string {
  const n = dag.nodeCount
  if (n <= 1) return ''

  const { choice } = computeShortestPath(dag)

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

/**
 * DAGの最短経路をパートごとに分解して返す。
 * 各パートはromaji文字列と対応するDAGノード区間を持つ。
 */
export function buildShortestHintParts(dag: InputDag): HintPart[] {
  const n = dag.nodeCount
  if (n <= 1) return []

  const { choice } = computeShortestPath(dag)

  const parts: HintPart[] = []
  let node = 0
  while (node < n - 1) {
    const c = choice[node]
    if (!c) break
    const edge = dag.edges[c.edgeIdx]
    if (c.romaji) {
      parts.push({ romaji: c.romaji, fromNode: node, toNode: edge.to })
    }
    node = edge.to
  }

  return parts
}
