type Screen = 'drill' | 'sentence' | 'reference'

type Props = {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

const NAV_ITEMS: { screen: Screen; label: string }[] = [
  { screen: 'drill', label: 'ドリル' },
  { screen: 'sentence', label: '文章' },
  { screen: 'reference', label: 'キーマップ' },
]

export function AppHeader({ currentScreen, onNavigate }: Props) {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-6 px-8 py-3 bg-bg-secondary border-b border-border">
      <span className="font-mono text-lg font-bold text-accent">AZIK Type</span>
      <nav className="flex gap-1">
        {NAV_ITEMS.map(({ screen, label }) => (
          <button
            key={screen}
            className={`bg-transparent border-0 px-3 py-1.5 text-sm cursor-pointer rounded transition-colors duration-150 hover:text-accent hover:bg-transparent ${
              currentScreen === screen
                ? 'text-text-primary border-b-2 border-b-accent'
                : 'text-text-secondary'
            }`}
            tabIndex={-1}
            onClick={() => onNavigate(screen)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
