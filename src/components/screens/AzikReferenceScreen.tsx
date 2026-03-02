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
    <div className="p-4 space-y-3">
      <h2 className="text-xl">AZIKキーマップ</h2>
      <div className="grid grid-cols-2 gap-y-2 gap-x-6">
        {CATEGORY_ORDER.map(cat => {
          const entries = grouped.get(cat)!
          if (entries.length === 0) return null
          return (
            <div key={cat} className="space-y-1.5">
              <h3 className="text-[0.85rem] text-accent border-b border-border pb-1">{CATEGORY_LABELS[cat]}</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-1">
                {entries.map((e, i) => (
                  <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-bg-secondary rounded text-xs">
                    <span className="font-mono text-accent min-w-8">{e.romaji}</span>
                    <span className="text-text-primary">{e.kana}</span>
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
