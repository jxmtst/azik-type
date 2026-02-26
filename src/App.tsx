import { useState } from 'react'
import { useTypingSession } from './hooks/useTypingSession'
import { HomeScreen } from './components/screens/HomeScreen'
import { DrillScreen } from './components/screens/DrillScreen'
import { SentenceScreen } from './components/screens/SentenceScreen'
import { SessionResult } from './components/ui/SessionResult'

type Screen = 'home' | 'drill' | 'sentence'

function App() {
  const session = useTypingSession()
  const [screen, setScreen] = useState<Screen>('home')

  // session.mode === 'result' のとき結果画面を表示
  if (session.mode === 'result') {
    return (
      <SessionResult
        metrics={session.metrics}
        kpm={session.kpm}
        accuracy={session.accuracy}
        effectiveKpm={session.effectiveKpm}
        onRestart={() => {
          if (screen === 'sentence') {
            session.startSentence()
          }
          // drillは画面に戻ればカテゴリ選択からやり直せる
          if (screen === 'drill') {
            session.reset()
          }
        }}
        onHome={() => {
          session.reset()
          setScreen('home')
        }}
      />
    )
  }

  switch (screen) {
    case 'home':
      return <HomeScreen onSelectMode={(mode) => setScreen(mode)} />
    case 'drill':
      return <DrillScreen session={session} />
    case 'sentence':
      return <SentenceScreen session={session} />
  }
}

export default App
