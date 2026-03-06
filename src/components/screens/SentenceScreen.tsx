import { useEffect } from 'react'
import type { TypingSessionState } from '../../hooks/useTypingSession'
import { TypingDisplay } from '../ui/TypingDisplay'
import { KeyHint } from '../ui/KeyHint'

type Props = {
  session: TypingSessionState
}

export function SentenceScreen({ session }: Props) {

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
      if (e.key === 'Enter') {
        e.preventDefault()
        return
      }
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
    <div className="max-w-[960px] mx-auto py-4 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <span className="font-mono text-sm text-text-secondary">
          残り: {remainingSec}秒
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
        mode="sentence"
      />

      {session.currentDag && (
        <KeyHint dag={session.currentDag} matcherState={session.matcherState} />
      )}
    </div>
  )
}
