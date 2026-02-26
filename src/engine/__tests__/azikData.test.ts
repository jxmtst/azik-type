import { describe, it, expect } from 'vitest'
import { AZIK_ENTRIES, KANA_TO_ENTRIES, ROMAJI_TO_KANA, getShortestRomaji } from '../../data/azikData'

describe('azikData', () => {
  it('エントリが存在する', () => {
    expect(AZIK_ENTRIES.length).toBeGreaterThan(0)
  })

  it('基本的なマッピングが正しい', () => {
    expect(ROMAJI_TO_KANA.get('ka')).toBe('か')
    expect(ROMAJI_TO_KANA.get('kt')).toBe('こと')
    expect(ROMAJI_TO_KANA.get(';')).toBe('っ')
  })

  it('KANA_TO_ENTRIESで逆引きできる', () => {
    const kaEntries = KANA_TO_ENTRIES.get('か')
    expect(kaEntries).toBeDefined()
    expect(kaEntries!.some(e => e.romaji === 'ka')).toBe(true)
  })

  it('全エントリにcategoryとpriorityがある', () => {
    for (const entry of AZIK_ENTRIES) {
      expect(entry.category).toBeTruthy()
      expect(typeof entry.priority).toBe('number')
    }
  })

  it('priorityはromaji.lengthベース', () => {
    for (const entry of AZIK_ENTRIES) {
      expect(entry.priority).toBe(entry.romaji.length)
    }
  })

  it('getShortestRomajiは最短キー列のみ返す', () => {
    // 「ん」: q(1キー) と nn(2キー) → q のみ
    const result = getShortestRomaji('ん')
    expect(result).toContain('q')
    expect(result).not.toContain('nn')
  })

  it('getShortestRomajiは同キー数のものは全て返す', () => {
    // 「さん」: sz(2キー) と sn(2キー)
    const result = getShortestRomaji('さん')
    expect(result).toContain('sz')
    expect(result).toContain('sn')
  })

  it('getShortestRomajiは存在しないかなで空配列', () => {
    expect(getShortestRomaji('★')).toEqual([])
  })
})
