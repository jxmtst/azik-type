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
    <div className="session-result">
      <h2 className="session-result__title">Result</h2>
      <div className="session-result__metrics">
        <div className="session-result__metric">
          <span className="session-result__value">
            {hasKeystrokes ? Math.round(kpm) : 0}
          </span>
          <span className="session-result__label">KPM</span>
        </div>
        <div className="session-result__metric">
          <span className="session-result__value">
            {accuracy !== null ? `${accuracy.toFixed(1)}%` : '--'}
          </span>
          <span className="session-result__label">Accuracy</span>
        </div>
        <div className="session-result__metric">
          <span className="session-result__value">
            {effectiveKpm !== null ? Math.round(effectiveKpm) : '--'}
          </span>
          <span className="session-result__label">Effective KPM</span>
        </div>
      </div>
      <div className="session-result__actions">
        <button onClick={onRestart}>
          もう一度
        </button>
      </div>
    </div>
  )
}
