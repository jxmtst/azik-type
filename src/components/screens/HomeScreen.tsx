type Props = {
  onSelectMode: (mode: 'drill' | 'sentence') => void
}

export function HomeScreen({ onSelectMode }: Props) {
  return (
    <div className="home-screen">
      <h1 className="home-screen__title">AZIK Type</h1>
      <p className="home-screen__description">
        AZIKの入力方式を練習するタイピングアプリ。
        <br />
        ドリルモードで個別のかなを練習したり、文章モードで実際の文章をタイピングしよう。
      </p>
      <div className="home-screen__buttons">
        <button
          className="home-screen__button"
          onClick={() => onSelectMode('drill')}
        >
          ドリルモード
        </button>
        <button
          className="home-screen__button"
          onClick={() => onSelectMode('sentence')}
        >
          文章タイピング
        </button>
      </div>
    </div>
  )
}
