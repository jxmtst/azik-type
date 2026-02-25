/**
 * azik_romantable.txt から src/data/azikData.ts を生成するスクリプト。
 *
 * 使用方法: npx tsx scripts/generateAzikData.ts
 *
 * azik_romantable.txt をTSV(タブ区切り)として読み込み、
 * 各エントリにカテゴリとpriorityを付与して azikData.ts を出力する。
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Category } from '../src/engine/types'

const ROMANTABLE_PATH = resolve(import.meta.dirname ?? '.', '..', 'azik_romantable.txt')
const OUTPUT_PATH = resolve(import.meta.dirname ?? '.', '..', 'src', 'data', 'azikData.ts')

// === 分類ルール ===

/** punctuation: 句読点・中黒 */
const PUNCTUATION_ROMAJI = new Set(['.', ',', 'z/'])

const SYMBOL_ROMAJI = new Set([
  ';', 'q', 'nn', '-', ':', '~',
  'z.', 'z,', 'z-', 'z[', 'z]', '[', ']',
  'la', 'li', 'lu', 'le', 'lo', 'lya', 'lyu', 'lyo',
])

const COMPOUND_WORD_ROMAJI = new Set([
  'kt', 'wt', 'km', 'sr', 'rr', 'nb', 'nt', 'st', 'mn', 'tm',
  'tr', 'zr', 'bt', 'dt', 'tt', 'ms', 'dm', 'nr', 'mt', 'gr',
  'wr', 'ht', 'ds', 'kr', 'yr', 'tb', 'gt',
])

/** 標準ローマ字パターン（hatsuon_shortcutを除外するため） */
const STANDARD_ROMAJI_HATSUON = /^(nn)$/

const DAKUTEN_ROMAJI = new Set([
  'ga', 'gi', 'gu', 'ge', 'go',
  'za', 'zi', 'zu', 'ze', 'zo',
  'da', 'di', 'du', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po',
])

const BASIC_ROMAJI = new Set([
  'a', 'i', 'u', 'e', 'o',
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'si', 'su', 'se', 'so',
  'ta', 'ti', 'tu', 'te', 'to',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'hu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'wa', 'wo',
  'fu', 'vu',
])

function classifyEntry(romaji: string, kana: string): Category {
  if (PUNCTUATION_ROMAJI.has(romaji)) return 'punctuation'
  if (SYMBOL_ROMAJI.has(romaji)) return 'symbol'
  if (COMPOUND_WORD_ROMAJI.has(romaji)) return 'compound_word'
  if (BASIC_ROMAJI.has(romaji)) return 'basic'
  if (DAKUTEN_ROMAJI.has(romaji)) return 'dakuten'

  // hatsuon_shortcut: かなが「ん」で終わり、2文字以上、nn以外
  if (kana.endsWith('ん') && kana.length >= 2 && !STANDARD_ROMAJI_HATSUON.test(romaji)) {
    return 'hatsuon_shortcut'
  }

  // double_vowel: 母音ショートカット類
  // ここに残るのは youon か double_vowel
  // youon は拗音（きゃ、しゃ等）や外来音（ふぁ、てぃ等）の直接入力
  // double_vowel はそのショートカット

  // youon パターン: 末尾が母音(a,i,u,e,o) で kana が拗音系
  const youonPatterns = [
    /^[kstnhmrgzbp]y[aiueo]$/, // kya, sya, etc.
    /^[ksnhmp]g[aiueo]$/, // kga, nga, etc.
    /^[xcj][aiueo]$/, // xa, ca, ja, etc.
    /^ty[aiueo]$/, // tya, tyu, etc.
    /^zy[aiueo]$/, // zya, zyu, etc.
    /^by[aiueo]$/, // bya, byu, etc.
    /^f[aieo]$/, // fa, fi, fe, fo (not fu)
    /^v[aieo]$/, // va, vi, ve, vo (not vu)
    /^tg[iu]$/, // tgi, tgu
    /^dc[iu]$/, // dci, dcu
    /^wso$/, // wso
    /^w[ie]$/, // wi, we
  ]

  if (youonPatterns.some(p => p.test(romaji))) {
    return 'youon'
  }

  return 'double_vowel'
}

// === メイン処理 ===

const rawText = readFileSync(ROMANTABLE_PATH, 'utf-8')
const lines = rawText.split('\n')

type ParsedEntry = { romaji: string; kana: string; category: Category; priority: number }

const entries: ParsedEntry[] = []
for (const line of lines) {
  if (!line.includes('\t') || !line.trim()) continue
  const [romaji, kana] = line.split('\t')
  if (romaji && kana) {
    const r = romaji.trim()
    const k = kana.trim()
    entries.push({
      romaji: r,
      kana: k,
      category: classifyEntry(r, k),
      priority: r.length,
    })
  }
}

console.log(`パース済みエントリ数: ${entries.length}`)

// エントリ配列のリテラルを生成
const entryLines = entries.map(e => {
  const romajiEscaped = e.romaji.replace(/'/g, "\\'")
  const kanaEscaped = e.kana.replace(/'/g, "\\'")
  return `  { romaji: '${romajiEscaped}', kana: '${kanaEscaped}', category: '${e.category}', priority: ${e.priority} },`
})

const output = `// このファイルは scripts/generateAzikData.ts で自動生成されたものです。
// 手動で編集しないでください。

import type { AzikEntry } from '../engine/types'

export const AZIK_ENTRIES: AzikEntry[] = [
${entryLines.join('\n')}
]

export const ROMAJI_TO_KANA = new Map<string, string>(
  AZIK_ENTRIES.map(e => [e.romaji, e.kana])
)

export const KANA_TO_ENTRIES = new Map<string, AzikEntry[]>()
for (const entry of AZIK_ENTRIES) {
  const list = KANA_TO_ENTRIES.get(entry.kana) ?? []
  list.push(entry)
  KANA_TO_ENTRIES.set(entry.kana, list)
}
`

writeFileSync(OUTPUT_PATH, output, 'utf-8')
console.log(`生成完了: ${OUTPUT_PATH}`)
