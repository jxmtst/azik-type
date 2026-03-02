import { useEffect } from 'react'
import type { SessionMetrics } from '../../engine/types'

type Props = {
  metrics: SessionMetrics
  kpm: number
  accuracy: number | null
  effectiveKpm: number | null
  onRestart: () => void
}

export function SessionResult({ metrics, kpm, accuracy, effectiveKpm, onRestart }: Props) {
  // Spaceキーでもう一度
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        onRestart()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onRestart])

  const hasKeystrokes = metrics.totalKeystrokes > 0

  return (
    <div className="text-center py-12 px-4 space-y-8">
      <h2 className="text-2xl text-text-primary">Result</h2>
      <div className="flex justify-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[2rem] font-mono text-accent">
            {hasKeystrokes ? Math.round(kpm) : 0}
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-[0.05em]">KPM</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[2rem] font-mono text-accent">
            {accuracy !== null ? `${accuracy.toFixed(1)}%` : '--'}
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-[0.05em]">Accuracy</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[2rem] font-mono text-accent">
            {effectiveKpm !== null ? Math.round(effectiveKpm) : '--'}
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-[0.05em]">Effective KPM</span>
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={onRestart}>
          もう一度
        </button>
      </div>
    </div>
  )
}
