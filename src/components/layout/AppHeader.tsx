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
    <header className="app-header">
      <span className="app-header__logo">AZIK Type</span>
      <nav className="app-header__nav">
        {NAV_ITEMS.map(({ screen, label }) => (
          <button
            key={screen}
            className={`app-header__link${currentScreen === screen ? ' app-header__link--active' : ''}`}
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
