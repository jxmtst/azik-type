/**
 * azik_romantable.txt からエントリを読み取り、カテゴリ分類を検証するスクリプト。
 *
 * 使用方法: npx tsx scripts/generateAzikData.ts
 *
 * 既存の azikData.ts の内容とテキストファイルの内容を比較し、
 * 漏れや不一致がないかチェックする。
 * azikData.ts はハードコードされたデータなので、このスクリプトは
 * 検証用途に使う。
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AZIK_ENTRIES, ROMAJI_TO_KANA } from '../src/data/azikData'
import type { Category } from '../src/engine/types'

const ROMANTABLE_PATH = resolve(import.meta.dirname ?? '.', '..', 'azik_romantable.txt')

// === 分類ルール ===

const SYMBOL_ROMAJI = new Set([
  ';', 'q', 'nn', '-', ':', '~', '.', ',',
  'z/', 'z.', 'z,', 'z-', 'z[', 'z]', '[', ']',
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

const txtEntries: Array<{ romaji: string; kana: string }> = []
for (const line of lines) {
  if (!line.includes('\t') || !line.trim()) continue
  const [romaji, kana] = line.split('\t')
  if (romaji && kana) {
    txtEntries.push({ romaji: romaji.trim(), kana: kana.trim() })
  }
}

console.log(`テキストファイルのエントリ数: ${txtEntries.length}`)
console.log(`azikData.ts のエントリ数: ${AZIK_ENTRIES.length}`)

// 1. テキストファイルにあって azikData.ts にないエントリ
let missingCount = 0
for (const entry of txtEntries) {
  if (!ROMAJI_TO_KANA.has(entry.romaji)) {
    console.error(`[MISSING] テキストにあるが azikData にない: ${entry.romaji} → ${entry.kana}`)
    missingCount++
  } else if (ROMAJI_TO_KANA.get(entry.romaji) !== entry.kana) {
    console.error(`[MISMATCH] かな不一致: ${entry.romaji} → azikData: ${ROMAJI_TO_KANA.get(entry.romaji)}, txt: ${entry.kana}`)
    missingCount++
  }
}

// 2. azikData.ts にあってテキストファイルにないエントリ
const txtRomaji = new Set(txtEntries.map(e => e.romaji))
let extraCount = 0
for (const entry of AZIK_ENTRIES) {
  if (!txtRomaji.has(entry.romaji)) {
    console.error(`[EXTRA] azikData にあるがテキストにない: ${entry.romaji} → ${entry.kana}`)
    extraCount++
  }
}

// 3. カテゴリ分類の検証
let categoryMismatchCount = 0
for (const entry of AZIK_ENTRIES) {
  const expected = classifyEntry(entry.romaji, entry.kana)
  if (expected !== entry.category) {
    console.error(`[CATEGORY] ${entry.romaji} → ${entry.kana}: 現在 "${entry.category}", 推定 "${expected}"`)
    categoryMismatchCount++
  }
}

console.log(`\n=== 結果 ===`)
console.log(`漏れ/不一致: ${missingCount}`)
console.log(`余分: ${extraCount}`)
console.log(`カテゴリ不一致: ${categoryMismatchCount}`)

if (missingCount === 0 && extraCount === 0 && categoryMismatchCount === 0) {
  console.log('\nすべてOK!')
  process.exit(0)
} else {
  console.error('\n問題が見つかった。')
  process.exit(1)
}
