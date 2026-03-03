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

// 左右カラムで高さが均等になるようにカテゴリを振り分け
// 左: double_vowel(162) + youon(91) + punctuation(3) = 256
// 右: hatsuon_shortcut(200) + compound_word(27) + symbol(21) = 248
const LEFT_COLUMN: Category[] = ['double_vowel', 'youon', 'punctuation']
const RIGHT_COLUMN: Category[] = ['hatsuon_shortcut', 'compound_word', 'symbol']

function CategoryColumn({ categories, grouped }: {
  categories: Category[]
  grouped: Map<Category, { romaji: string; kana: string }[]>
}) {
  return (
    <div className="flex flex-col gap-2 w-1/2">
      {categories.map(cat => {
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
  )
}

export function AzikReferenceScreen() {
  const allCategories = [...LEFT_COLUMN, ...RIGHT_COLUMN]
  const grouped = new Map<Category, { romaji: string; kana: string }[]>()
  for (const cat of allCategories) {
    grouped.set(cat, [])
  }
  for (const entry of AZIK_ENTRIES) {
    if (EXCLUDED_CATEGORIES.has(entry.category)) continue
    grouped.get(entry.category)?.push({ romaji: entry.romaji, kana: entry.kana })
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl">AZIKキーマップ</h2>
      <div className="flex gap-6">
        <CategoryColumn categories={LEFT_COLUMN} grouped={grouped} />
        <CategoryColumn categories={RIGHT_COLUMN} grouped={grouped} />
      </div>
    </div>
  )
}
