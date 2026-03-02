import { AZIK_ENTRIES } from '../../data/azikData'
import type { Category } from '../../engine/types'

// 基本・濁音は標準ローマ字と同じなので省略
const EXCLUDED_CATEGORIES: Set<Category> = new Set(['basic', 'dakuten'])

const CATEGORY_LABELS: Partial<Record<Category, string>> = {
  youon: '拗音',
  hatsuon_shortcut: '撥音ショートカット',
  double_vowel: '二重母音',
  compound_word: '複合語',
  symbol: '記号',
  punctuation: '句読点',
}

const CATEGORY_ORDER: Category[] = [
  'youon', 'hatsuon_shortcut',
  'double_vowel', 'compound_word', 'symbol', 'punctuation',
]

export function AzikReferenceScreen() {
  const grouped = new Map<Category, { romaji: string; kana: string }[]>()
  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, [])
  }
  for (const entry of AZIK_ENTRIES) {
    if (EXCLUDED_CATEGORIES.has(entry.category)) continue
    grouped.get(entry.category)!.push({ romaji: entry.romaji, kana: entry.kana })
  }

  return (
    <div className="azik-ref">
      <div className="azik-ref__header">
        <h2 className="azik-ref__title">AZIKキーマップ</h2>
      </div>
      <div className="azik-ref__tables">
        {CATEGORY_ORDER.map(cat => {
          const entries = grouped.get(cat)!
          if (entries.length === 0) return null
          return (
            <div key={cat} className="azik-ref__category">
              <h3 className="azik-ref__category-title">{CATEGORY_LABELS[cat]}</h3>
              <div className="azik-ref__grid">
                {entries.map((e, i) => (
                  <div key={i} className="azik-ref__entry">
                    <span className="azik-ref__romaji">{e.romaji}</span>
                    <span className="azik-ref__kana">{e.kana}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
