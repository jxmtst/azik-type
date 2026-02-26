// src/engine/decomposer.ts
import type { InputDag, DagEdge } from './types'
import { KANA_TO_ENTRIES, getShortestRomaji } from '../data/azikData'
import { pruneToShortest } from './dagShortest'

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
      const romajiOptions = getShortestRomaji(chars[i])
      const idx = edges.length
      edges.push({ from: i, to: i + 1, romajiOptions, kana: chars[i], isSkip: false })
      edgesByNode[i].push(idx)
    }

    // 2文字以上のマッチ（複合語ショートカット等）
    for (let len = 2; len <= Math.min(chars.length - i, 4); len++) {
      const substr = chars.slice(i, i + len).join('')
      const entries = KANA_TO_ENTRIES.get(substr)
      if (entries && entries.length > 0) {
        const romajiOptions = getShortestRomaji(substr)
        const idx = edges.length
        edges.push({ from: i, to: i + len, romajiOptions, kana: substr, isSkip: false })
        edgesByNode[i].push(idx)
      }
    }
  }

  return pruneToShortest({ nodeCount, edges, edgesByNode })
}
