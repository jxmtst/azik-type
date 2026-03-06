import { describe, it, expect } from 'vitest'
import { AZIK_ENTRIES, KANA_TO_ENTRIES, ROMAJI_TO_KANA, getShortestRomaji, getPreferredRomaji } from '../../data/azikData'

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

describe('getPreferredRomaji', () => {
  it('同じ長さならAZIKショートカットを優先する', () => {
    // き: ki(basic) vs kf(double_vowel) → kf
    expect(getPreferredRomaji('き')).toBe('kf')
  })

  it('ふ=hf, む=mf, ぬ=nf を優先', () => {
    expect(getPreferredRomaji('ふ')).toBe('hf')
    expect(getPreferredRomaji('む')).toBe('mf')
    expect(getPreferredRomaji('ぬ')).toBe('nf')
  })

  it('みゃ=mga, みゅ=mgu, みょ=mgo を優先', () => {
    expect(getPreferredRomaji('みゃ')).toBe('mga')
    expect(getPreferredRomaji('みゅ')).toBe('mgu')
    expect(getPreferredRomaji('みょ')).toBe('mgo')
  })

  it('ざい=zv, せい=ss, さい=sf, わい=wf（長さが短い方が選ばれる）', () => {
    expect(getPreferredRomaji('ざい')).toBe('zv')
    expect(getPreferredRomaji('せい')).toBe('ss')
    expect(getPreferredRomaji('さい')).toBe('sf')
    expect(getPreferredRomaji('わい')).toBe('wf')
  })

  it('ショートカットがない場合は最短のbasicを返す', () => {
    expect(getPreferredRomaji('か')).toBe('ka')
  })

  it('存在しないかなは空文字列', () => {
    expect(getPreferredRomaji('★')).toBe('')
  })
})
