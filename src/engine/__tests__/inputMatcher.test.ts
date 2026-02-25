// src/engine/__tests__/inputMatcher.test.ts
import { describe, it, expect } from 'vitest'
import { createMatcher, feedKey } from '../inputMatcher'
import { decompose } from '../decomposer'

describe('InputMatcher', () => {
  it('単一かな「か」をkaで入力完了', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'a')).toBe('complete')
  })

  it('ミスキーでerrorを返しcursorsが復元される', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    const cursorsBefore = JSON.stringify(state.cursors)
    expect(feedKey(state, dag, 'k')).toBe('error') // 'ka'の2文字目に'k'はミス
    expect(JSON.stringify(state.cursors)).toBe(cursorsBefore) // 復元される
    expect(state.missCount).toBe(1)
    expect(state.totalKeystrokes).toBe(2) // k, k(miss) の2回
  })

  it('ミス後に正しいキーで続行できる', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    feedKey(state, dag, 'k')
    feedKey(state, dag, 'x') // miss
    expect(feedKey(state, dag, 'a')).toBe('complete') // 正しいキーで完了
  })

  it('複合語ショートカット: ことをktで入力', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 't')).toBe('complete')
  })

  it('複合語を通常入力: ことをko+toで入力', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'o')).toBe('progress') // ko完了、次のエッジへ
    expect(feedKey(state, dag, 't')).toBe('progress')
    expect(feedKey(state, dag, 'o')).toBe('complete')
  })

  it('totalKeystrokesは毎回インクリメント（エラー含む）', () => {
    const dag = decompose('あ')
    const state = createMatcher(dag)
    feedKey(state, dag, 'x') // miss
    feedKey(state, dag, 'a') // correct
    expect(state.totalKeystrokes).toBe(2)
    expect(state.missCount).toBe(1)
  })

  it('ε遷移（スキップ）を自動通過する', () => {
    // 「あ字い」→ 「字」はスキップ
    const dag = decompose('あ字い')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'a')).toBe('progress') // 「あ」完了 → 「字」自動スキップ
    expect(feedKey(state, dag, 'i')).toBe('complete') // 「い」完了
  })

  it('空DAGはcreateMatcherでcursorsが空', () => {
    const dag = decompose('')
    const state = createMatcher(dag)
    expect(state.cursors.length).toBe(0)
  })
})
