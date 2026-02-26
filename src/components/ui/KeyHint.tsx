import { useMemo } from 'react'
import type { InputDag } from '../../engine/types'
import { getShortestRomaji } from '../../data/azikData'
import { buildShortestHint } from '../../engine/hintBuilder'

type Props = {
  visible: boolean
} & (
  | { kana: string; dag?: undefined }
  | { dag: InputDag; kana?: undefined }
)

export function KeyHint(props: Props) {
  const hint = useMemo(() => {
    if (props.dag) {
      return buildShortestHint(props.dag)
    }
    if (props.kana) {
      return getShortestRomaji(props.kana).join(' / ')
    }
    return ''
  }, [props.dag, props.kana])

  if (!props.visible || !hint) return null

  return (
    <div className="key-hint">
      <span className="key-hint__label">HINT:</span>
      <span className="key-hint__key">{hint}</span>
    </div>
  )
}
