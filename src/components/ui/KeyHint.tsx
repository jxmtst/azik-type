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
    <div className="my-4 px-4 py-3 bg-bg-secondary border border-border rounded-md font-mono text-sm text-text-secondary text-center">
      <span className="text-text-secondary mr-2">HINT:</span>
      <span className="inline-block px-2 py-0.5 mx-1 bg-bg-tertiary border border-border rounded text-accent">{hint}</span>
    </div>
  )
}
