import type { Category } from '../../engine/types'

type Props = {
  selected: Category[]
  onChange: (categories: Category[]) => void
}

const CATEGORY_LABELS: { key: Category; label: string }[] = [
  { key: 'dakuten', label: '濁音・半濁音' },
  { key: 'youon', label: '拗音' },
  { key: 'hatsuon_shortcut', label: '撥音ショートカット' },
  { key: 'double_vowel', label: '二重母音' },
  { key: 'compound_word', label: '複合語' },
  { key: 'symbol', label: '記号' },
]

export function CategorySelect({ selected, onChange }: Props) {
  const toggle = (cat: Category) => {
    if (selected.includes(cat)) {
      onChange(selected.filter(c => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  return (
    <div className="category-select">
      {CATEGORY_LABELS.map(({ key, label }) => (
        <label key={key} className="category-select__item">
          <input
            type="checkbox"
            checked={selected.includes(key)}
            onChange={() => toggle(key)}
          />
          {label}
        </label>
      ))}
    </div>
  )
}
