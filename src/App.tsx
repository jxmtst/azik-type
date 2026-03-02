import { useState, useEffect } from 'react'
import { useTypingSession } from './hooks/useTypingSession'
import { AppHeader } from './components/layout/AppHeader'
import { DrillScreen } from './components/screens/DrillScreen'
import { SentenceScreen } from './components/screens/SentenceScreen'
import { AzikReferenceScreen } from './components/screens/AzikReferenceScreen'
import { SessionResult } from './components/ui/SessionResult'

type Screen = 'drill' | 'sentence' | 'reference'

function App() {
  const session = useTypingSession()
  const [screen, setScreen] = useState<Screen>('drill')

  // ESCキーで戻る（idle以外のとき）
  useEffect(() => {
    if (session.mode === 'idle') return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        session.reset()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [session.mode, session.reset])

  const handleNavigate = (next: Screen) => {
    session.reset()
    setScreen(next)
  }

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
