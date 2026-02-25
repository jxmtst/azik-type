import { useMemo } from 'react'
import { KANA_TO_ENTRIES } from '../../data/azikData'

type Props = {
  kana: string
  visible: boolean
}

export function KeyHint({ kana, visible }: Props) {
  const hints = useMemo(() => {
    const entries = KANA_TO_ENTRIES.get(kana)
    if (!entries || entries.length === 0) return []
    return entries.map(e => e.romaji)
  }, [kana])

  if (!visible || hints.length === 0) return null

  return (
    <div className="key-hint">
      <span className="key-hint__label">HINT:</span>
      {hints.map((h, i) => (
        <span key={i} className="key-hint__key">{h}</span>
      ))}
    </div>
  )
}
