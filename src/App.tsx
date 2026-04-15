import { useState, useEffect, useRef } from 'react'
import { useTypingSession } from './hooks/useTypingSession'
import { AppHeader } from './components/layout/AppHeader'
import { DrillScreen } from './components/screens/DrillScreen'
import { SentenceScreen } from './components/screens/SentenceScreen'
import { AzikReferenceScreen } from './components/screens/AzikReferenceScreen'
import { SessionResult } from './components/ui/SessionResult'
import { saveScore } from './engine/scoreStorage'
import type { ScoreRecord } from './engine/types'

type Screen = 'drill' | 'sentence' | 'reference'
const screens: Screen[] = ['sentence', 'drill', 'reference']

function App() {
  const session = useTypingSession()
  const [screen, setScreen] = useState<Screen>('sentence')

  // ESCキーで戻る（idle以外のとき）
  useEffect(() => {
    if (session.mode === 'idle' || session.mode === 'sentence') return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        session.reset()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.mode, session.reset])

  // Shift+Tabで画面タブを切り替える
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        setScreen(prev => {
          const next = screens[(screens.indexOf(prev) + 1) % screens.length]
          session.reset()
          return next
        })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.reset])

  const handleNavigate = (next: Screen) => {
    session.reset()
    setScreen(next)
  }

  // スコア保存
  const savedRef = useRef(false)
  useEffect(() => {
    if (session.mode === 'result' && session.metrics.totalKeystrokes > 0 && !savedRef.current) {
      savedRef.current = true
      const record: ScoreRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        mode: screen === 'drill' ? 'drill' : 'sentence',
        kpm: session.kpm,
        accuracy: session.accuracy ?? 0,
        effectiveKpm: session.effectiveKpm ?? 0,
        totalKeystrokes: session.metrics.totalKeystrokes,
        missCount: session.metrics.missCount,
        elapsedMs: session.metrics.elapsedMs,
        ...(screen === 'drill' ? {
          categories: session.drillCategories ?? [],
          questionCount: session.drillQuestionCount ?? 0,
        } : {}),
      }
      saveScore(record)
    }
    if (session.mode !== 'result') {
      savedRef.current = false
    }
  }, [session.mode])

  // session.mode === 'result' のとき結果画面を表示
  if (session.mode === 'result') {
    return (
      <>
        <AppHeader currentScreen={screen} onNavigate={handleNavigate} />
        <main className="p-8">
          <SessionResult
            metrics={session.metrics}
            kpm={session.kpm}
            accuracy={session.accuracy}
            effectiveKpm={session.effectiveKpm}
            onRestart={() => {
              if (screen === 'sentence') {
                session.startSentence()
              }
              if (screen === 'drill') {
                session.reset()
              }
            }}
          />
        </main>
      </>
    )
  }

  const content = (() => {
    switch (screen) {
      case 'drill':
        return <DrillScreen session={session} />
      case 'sentence':
        return <SentenceScreen session={session} />
      case 'reference':
        return <AzikReferenceScreen />
    }
  })()

  return (
    <>
      <AppHeader currentScreen={screen} onNavigate={handleNavigate} />
      <main className="p-8">
        {content}
      </main>
    </>
  )
}

export default App
