// src/engine/__tests__/hintBuilder.test.ts
import { describe, it, expect } from 'vitest'
import { buildShortestHint, buildShortestHintParts } from '../hintBuilder'
import { decompose } from '../decomposer'

describe('buildShortestHint', () => {
  it('単一かなの最短ヒント', () => {
    const dag = decompose('か')
    expect(buildShortestHint(dag)).toBe('ka')
  })

  it('複合語ショートカットが最短パスに選ばれる', () => {
    // こと: kt(2) vs ko(2)+to(2)=4 → kt
    const dag = decompose('こと')
    expect(buildShortestHint(dag)).toBe('kt')
  })

  it('きょうはいいてんきです。の最短ヒント（AZIKショートカット優先）', () => {
    const dag = decompose('きょうはいいてんきです。')
    // きょう(kgp/3) + はい(hq/2) + い(i/1) + てん(td/2) + き(kf/2) + です(ds/2) + 。(./1) = 13
    expect(buildShortestHint(dag)).toBe('kgphqitdkfds.')
  })

  it('ε遷移（スキップ文字）は出力に含まれない', () => {
    const dag = decompose('あ字い')
    // あ(a) + 字(skip) + い(i)
    expect(buildShortestHint(dag)).toBe('ai')
  })

  it('空文字列は空ヒント', () => {
    const dag = decompose('')
    expect(buildShortestHint(dag)).toBe('')
  })

  it('ことがある の最短ヒント', () => {
    const dag = decompose('ことがある')
    // こと(kt/2) + が(ga/2) + あ(a/1) + る(ru/2)
    expect(buildShortestHint(dag)).toBe('ktgaaru')
  })
})

describe('buildShortestHintParts', () => {
  it('単一かなのパーツ', () => {
    const dag = decompose('か')
    const parts = buildShortestHintParts(dag)
    expect(parts).toEqual([
      { romaji: 'ka', fromNode: 0, toNode: 1 },
    ])
  })

  it('複合語ショートカットのパーツ', () => {
    const dag = decompose('こと')
    const parts = buildShortestHintParts(dag)
    // kt はノード0→2（終端）
    expect(parts).toEqual([
      { romaji: 'kt', fromNode: 0, toNode: 2 },
    ])
  })

  it('ε遷移はパーツに含まれない', () => {
    const dag = decompose('あ字い')
    const parts = buildShortestHintParts(dag)
    expect(parts).toEqual([
      { romaji: 'a', fromNode: 0, toNode: 1 },
      { romaji: 'i', fromNode: 2, toNode: 3 },
    ])
  })

  it('空文字列は空配列', () => {
    const dag = decompose('')
    const parts = buildShortestHintParts(dag)
    expect(parts).toEqual([])
  })

  it('パーツのromajiを連結するとbuildShortestHintと同じ', () => {
    const dag = decompose('きょうはいいてんきです。')
    const parts = buildShortestHintParts(dag)
    const joined = parts.map(p => p.romaji).join('')
    expect(joined).toBe(buildShortestHint(dag))
  })
})
