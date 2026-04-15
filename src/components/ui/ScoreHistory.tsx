import { useState } from 'react'
import { loadScores, clearScores } from '../../engine/scoreStorage'
import type { ScoreRecord } from '../../engine/types'

const INITIAL_DISPLAY = 10

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function modeLabel(record: ScoreRecord): string {
  return record.mode === 'drill' ? 'ドリル' : '文章'
}

export function ScoreHistory() {
  const [scores, setScores] = useState(() => loadScores())
  const [showAll, setShowAll] = useState(false)

  if (scores.length === 0) return null

  const displayed = showAll ? scores : scores.slice(0, INITIAL_DISPLAY)
  const hasMore = scores.length > INITIAL_DISPLAY

  const handleClear = () => {
    clearScores()
    setScores([])
  }

  return (
    <div className="mt-12 max-w-xl mx-auto">
      <h3 className="text-lg text-text-primary mb-4">スコア履歴</h3>
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-text-secondary text-xs uppercase tracking-[0.05em]">
            <th className="text-left pb-2">日時</th>
            <th className="text-left pb-2">モード</th>
            <th className="text-right pb-2">KPM</th>
            <th className="text-right pb-2">正確率</th>
            <th className="text-right pb-2">実効KPM</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((s) => (
            <tr key={s.id} className="border-t border-white/10">
              <td className="py-1.5 text-text-secondary">{formatDate(s.date)}</td>
              <td className="py-1.5 text-text-secondary">{modeLabel(s)}</td>
              <td className="py-1.5 text-right text-accent">{Math.round(s.kpm)}</td>
              <td className="py-1.5 text-right text-accent">{s.accuracy.toFixed(1)}%</td>
              <td className="py-1.5 text-right text-accent">{Math.round(s.effectiveKpm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between items-center">
        {hasMore && !showAll ? (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            もっと見る ({scores.length - INITIAL_DISPLAY}件)
          </button>
        ) : <span />}
        <button
          onClick={handleClear}
          className="text-xs text-text-secondary hover:text-red-400"
        >
          履歴をクリア
        </button>
      </div>
    </div>
  )
}
