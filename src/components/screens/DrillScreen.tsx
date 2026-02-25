import { useState, useEffect } from 'react'
import type { TypingSessionState } from '../../hooks/useTypingSession'
import type { Category } from '../../engine/types'
import { TypingDisplay } from '../ui/TypingDisplay'
import { KeyHint } from '../ui/KeyHint'
import { CategorySelect } from '../ui/CategorySelect'

type Props = {
  session: TypingSessionState
}

export function DrillScreen({ session }: Props) {
  const [categories, setCategories] = useState<Category[]>(['basic'])
  const [hintVisible, setHintVisible] = useState(false)

  // keydownイベントのハンドリング
  useEffect(() => {
    if (session.mode !== 'drill') return

    const handler = (e: KeyboardEvent) => {
      // key.length === 1 のアルファベット・記号のみ処理
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        session.handleKey(e.key)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.mode, session.handleKey])

  // 開始前画面
  if (session.mode === 'idle') {
    return (
      <div className="drill-screen">
        <div className="drill-screen__start">
          <h2 className="drill-screen__start-title">カテゴリを選択</h2>
          <CategorySelect selected={categories} onChange={setCategories} />
          <button
            className="drill-screen__start-button"
            disabled={categories.length === 0}
            onClick={() => session.startDrill(categories)}
          >
            開始
          </button>
        </div>
      </div>
    )
  }

  // 練習中画面
  return (
    <div className="drill-screen">
      <div className="drill-screen__header">
        <span className="drill-screen__progress">
          {session.questionIndex + 1} / {session.totalQuestions}
        </span>
        <div className="drill-screen__stats">
          <span>
            KPM:
            <span className="drill-screen__stat-value">
              {Math.round(session.kpm)}
            </span>
          </span>
          <span>
            正確率:
            <span className="drill-screen__stat-value">
              {session.accuracy !== null ? `${session.accuracy.toFixed(1)}%` : '--'}
            </span>
          </span>
        </div>
      </div>

      <TypingDisplay
        targetKana={session.currentKana}
        matcherState={session.matcherState}
        dag={session.currentDag}
        lastResult={session.lastResult}
        mode="drill"
      />

      <div className="drill-screen__hint-toggle">
        <button
          className="hint-toggle-button"
          onClick={() => setHintVisible(v => !v)}
        >
          {hintVisible ? 'ヒントを隠す' : 'ヒントを表示'}
        </button>
      </div>

      {session.currentEntry && (
        <KeyHint kana={session.currentEntry.kana} visible={hintVisible} />
      )}
    </div>
  )
}
