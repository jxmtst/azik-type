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
  const [categories, setCategories] = useState<Category[]>([])
  const [hintVisible, setHintVisible] = useState(true)

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
    // session.handleKeyは安定したコールバック（useCallback）なので、sessionオブジェクト全体は不要
  }, [session.mode, session.handleKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // idle時のSpaceキーで開始
  useEffect(() => {
    if (session.mode !== 'idle') return

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && categories.length > 0) {
        e.preventDefault()
        session.startDrill(categories)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.mode, categories, session.startDrill]) // eslint-disable-line react-hooks/exhaustive-deps

  // 開始前画面
  if (session.mode === 'idle') {
    return (
      <div className="max-w-[960px] mx-auto py-4 space-y-4">
        <div className="text-center py-8 space-y-4">
          <h2 className="text-xl text-text-primary">カテゴリを選択</h2>
          <CategorySelect selected={categories} onChange={setCategories} />
          <button
            className="px-8 py-3 text-base bg-bg-secondary border-accent text-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="max-w-[960px] mx-auto py-4 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <span className="font-mono text-sm text-text-secondary">
          {session.questionIndex + 1} / {session.totalQuestions}
        </span>
        <div className="flex gap-6 font-mono text-sm text-text-secondary">
          <span>
            KPM:
            <span className="text-accent ml-1">
              {Math.round(session.kpm)}
            </span>
          </span>
          <span>
            正確率:
            <span className="text-accent ml-1">
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

      {session.currentEntry && (
        <KeyHint kana={session.currentEntry.kana} visible={hintVisible} />
      )}

      <div className="text-center">
        <button
          className="bg-transparent border-0 text-text-secondary text-xs cursor-pointer px-2 py-1 hover:text-accent hover:bg-transparent"
          onClick={() => setHintVisible(v => !v)}
        >
          {hintVisible ? 'ヒントを隠す' : 'ヒントを表示'}
        </button>
      </div>
    </div>
  )
}
