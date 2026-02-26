import { useState, useEffect } from 'react'
import type { TypingSessionState } from '../../hooks/useTypingSession'
import { TypingDisplay } from '../ui/TypingDisplay'
import { KeyHint } from '../ui/KeyHint'

type Props = {
  session: TypingSessionState
}

export function SentenceScreen({ session }: Props) {
  const [hintVisible, setHintVisible] = useState(true)

  // 自動開始
  useEffect(() => {
    if (session.mode === 'idle') {
      session.startSentence()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // keydownイベントのハンドリング
  useEffect(() => {
    if (session.mode !== 'sentence') return

    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        session.handleKey(e.key)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.mode, session.handleKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const remainingSec = Math.ceil(session.remainingMs / 1000)

  return (
    <div className="sentence-screen">
      <div className="sentence-screen__header">
        <span className="sentence-screen__timer">
          残り: {remainingSec}秒
        </span>
        <div className="sentence-screen__stats">
          <span>
            KPM:
            <span className="sentence-screen__stat-value">
              {Math.round(session.kpm)}
            </span>
          </span>
          <span>
            正確率:
            <span className="sentence-screen__stat-value">
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
        mode="sentence"
      />

      <div className="sentence-screen__hint-toggle">
        <button
          className="hint-toggle-button"
          onClick={() => setHintVisible(v => !v)}
        >
          {hintVisible ? 'ヒントを隠す' : 'ヒントを表示'}
        </button>
      </div>

      {session.currentDag && (
        <KeyHint dag={session.currentDag} visible={hintVisible} />
      )}
    </div>
  )
}
