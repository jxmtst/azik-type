import { useMemo } from 'react'
import type { InputDag, MatcherState, MatchResult } from '../../engine/types'
import { KANA_TO_ENTRIES } from '../../data/azikData'

type Props = {
  targetKana: string
  matcherState: MatcherState | null
  dag: InputDag | null
  lastResult: MatchResult | null
  mode: 'drill' | 'sentence'
}

/**
 * matcherStateのcursorsから、DAG内で最も進んでいるnodeIdを取得し、
 * 元の文字列で何文字目まで完了したかを算出する。
 *
 * nodeId は decomposer が文字列の各文字に対応するノードを 0..N で振っているため、
 * nodeId がそのまま「完了した文字数」に対応する。
 */
function computeCompletedChars(matcherState: MatcherState | null, dag: InputDag | null): number {
  if (!matcherState || !dag) return 0
  if (matcherState.cursors.length === 0) return 0

  let maxNodeId = 0
  for (const cursor of matcherState.cursors) {
    if (cursor.nodeId > maxNodeId) {
      maxNodeId = cursor.nodeId
    }
  }
  return maxNodeId
}

/**
 * 現在のカーソルから入力中のromajiプレフィックスを推定する。
 * 同じedgeIndex上の最も進んだoffsetを使い、romajiOptionsの最初のオプションから部分文字列を取得する。
 */
function computeCurrentRomaji(matcherState: MatcherState | null, dag: InputDag | null): string {
  if (!matcherState || !dag) return ''
  if (matcherState.cursors.length === 0) return ''

  // 最もnodeIdが進んでいるカーソル群のうち、offsetが最大のものを取得
  let maxNodeId = 0
  for (const cursor of matcherState.cursors) {
    if (cursor.nodeId > maxNodeId) maxNodeId = cursor.nodeId
  }

  const leadingCursors = matcherState.cursors.filter(c => c.nodeId === maxNodeId)
  let bestOffset = 0
  let bestEdgeIndex = -1
  for (const cursor of leadingCursors) {
    if (cursor.offset > bestOffset) {
      bestOffset = cursor.offset
      bestEdgeIndex = cursor.edgeIndex
    }
  }

  if (bestOffset === 0 || bestEdgeIndex < 0) return ''

  const edge = dag.edges[bestEdgeIndex]
  if (!edge || edge.romajiOptions.length === 0) return ''

  return edge.romajiOptions[0].slice(0, bestOffset)
}

const EXTENSION_CATEGORIES = new Set(['hatsuon_shortcut', 'double_vowel', 'compound_word'])
const SHORTCUT_SINGLE_KANA = new Set(['っ', 'ん'])

export function computeExtensionChars(dag: InputDag | null): Set<number> {
  if (!dag) return new Set()
  const result = new Set<number>()
  for (const edge of dag.edges) {
    if (edge.isSkip) continue
    const span = edge.to - edge.from
    if (span >= 2) {
      const entries = KANA_TO_ENTRIES.get(edge.kana)
      if (!entries) continue
      if (entries.some(e => EXTENSION_CATEGORIES.has(e.category))) {
        for (let i = edge.from; i < edge.to; i++) {
          result.add(i)
        }
      }
    } else if (span === 1 && SHORTCUT_SINGLE_KANA.has(edge.kana)) {
      result.add(edge.from)
    }
  }
  return result
}

export function TypingDisplay({ targetKana, matcherState, dag, lastResult, mode }: Props) {
  const completedChars = useMemo(
    () => computeCompletedChars(matcherState, dag),
    [matcherState, dag],
  )

  const currentRomaji = useMemo(
    () => computeCurrentRomaji(matcherState, dag),
    [matcherState, dag],
  )

  const chars = useMemo(() => [...targetKana], [targetKana])

  const extensionChars = useMemo(
    () => computeExtensionChars(dag),
    [dag],
  )

  const errorClass = lastResult === 'error' ? ' animate-error-flash' : ''

  if (mode === 'drill') {
    return (
      <div className={`my-8 text-center space-y-4${errorClass}`}>
        <div className="font-sans text-[3rem]">{targetKana}</div>
        {currentRomaji && (
          <div className="font-mono text-xl text-text-secondary">{currentRomaji}</div>
        )}
      </div>
    )
  }

  // sentence mode
  return (
    <div className={`my-8 text-center space-y-2${errorClass}`}>
      <div className="font-sans text-2xl leading-[2] tracking-[0.05em]">
        {chars.map((ch, i) => {
          let cls = 'text-text-primary'
          if (i < completedChars) {
            cls = 'text-success'
          } else if (i === completedChars) {
            const base = extensionChars.has(i) ? 'text-azik-extension' : ''
            cls = `${base} underline underline-offset-4 decoration-accent`
          } else if (extensionChars.has(i)) {
            cls = 'text-azik-extension'
          }
          return (
            <span key={i} className={cls}>
              {ch}
            </span>
          )
        })}
      </div>
      {currentRomaji && (
        <div className="font-mono text-xl text-text-secondary">{currentRomaji}</div>
      )}
    </div>
  )
}
