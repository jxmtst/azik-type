import { useMemo } from 'react'
import type { InputDag, MatcherState } from '../../engine/types'
import { getShortestRomaji } from '../../data/azikData'
import { buildShortestHint, buildShortestHintParts } from '../../engine/hintBuilder'
import { getCurrentKanaPosition } from '../../engine/inputMatcher'

type Props =
  | { kana: string; dag?: undefined; matcherState?: undefined }
  | { dag: InputDag; kana?: undefined; matcherState?: MatcherState }

export function KeyHint(props: Props) {
  const currentNode = props.matcherState ? getCurrentKanaPosition(props.matcherState) : 0

  const parts = useMemo(() => {
    if (props.dag) {
      return buildShortestHintParts(props.dag)
    }
    return null
  }, [props.dag])

  const simpleHint = useMemo(() => {
    if (props.kana) {
      return getShortestRomaji(props.kana).join(' / ')
    }
    return ''
  }, [props.kana])

  if (!parts && !simpleHint) return null

  return (
    <div className="my-4 font-mono text-lg text-text-secondary text-center">
      {parts ? (
        <span>
          {parts.map((part, i) => {
            let className: string
            if (part.toNode <= currentNode) {
              className = 'text-success'
            } else if (part.fromNode <= currentNode && part.toNode > currentNode) {
              className = 'text-accent'
            } else {
              className = 'text-text-secondary'
            }
            return <span key={i} className={className}>{part.romaji}</span>
          })}
        </span>
      ) : (
        <span className="text-accent">{simpleHint}</span>
      )}
    </div>
  )
}
