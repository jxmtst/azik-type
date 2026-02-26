// src/engine/__tests__/inputMatcher.test.ts
import { describe, it, expect } from 'vitest'
import { createMatcher, feedKey, getCurrentKanaPosition } from '../inputMatcher'
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

  it('複合語: 非最短パスko+toは拒否される', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'o')).toBe('error') // koパスは枝刈り済み
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

  it('大文字入力も小文字と同じ扱いで受理される', () => {
    const dag = decompose('か')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'K')).toBe('progress')
    expect(feedKey(state, dag, 'A')).toBe('complete')
  })

  it('てんき: 最短パスtdkiのみ受理、teqkiは不可', () => {
    const dag = decompose('てんき')
    const state = createMatcher(dag)
    // td(てん) + ki(き) = 最短4キー
    expect(feedKey(state, dag, 't')).toBe('progress')
    // 'd' はてん(td)の2文字目。もし 'e' を押すとて(te)のパスだが、最短ではないのでerror
    expect(feedKey(state, dag, 'e')).toBe('error')
    // 正しいパス
    expect(feedKey(state, dag, 'd')).toBe('progress') // td完了→ノード2
    expect(feedKey(state, dag, 'k')).toBe('progress')
    expect(feedKey(state, dag, 'i')).toBe('complete')
  })

  it('こと: 最短パスktのみ受理、ko+toは不可', () => {
    const dag = decompose('こと')
    const state = createMatcher(dag)
    expect(feedKey(state, dag, 'k')).toBe('progress')
    // 'o' はこ(ko)のパスだが、kt(こと)の方が短いのでkoパスは存在しない
    expect(feedKey(state, dag, 'o')).toBe('error')
    // 正しいパス
    expect(feedKey(state, dag, 't')).toBe('complete')
  })

  it('createMatcherは常にカウンタ0で初期化される（セッション累計はhook側の責務）', () => {
    const dag1 = decompose('か')
    const state1 = createMatcher(dag1)
    feedKey(state1, dag1, 'k')
    feedKey(state1, dag1, 'a')
    expect(state1.totalKeystrokes).toBe(2)

    // 次の問題で新Matcherを作ると0にリセットされる（これは正しい挙動）
    const dag2 = decompose('き')
    const state2 = createMatcher(dag2)
    expect(state2.totalKeystrokes).toBe(0)
    expect(state2.missCount).toBe(0)
  })
})

describe('getCurrentKanaPosition', () => {
  it('初期状態では位置0を返す', () => {
    const dag = decompose('かき')
    const state = createMatcher(dag)
    expect(getCurrentKanaPosition(state)).toBe(0)
  })

  it('1文字目入力完了後は位置1を返す', () => {
    const dag = decompose('かき')
    const state = createMatcher(dag)
    feedKey(state, dag, 'k')
    feedKey(state, dag, 'a') // 「か」完了 → ノード1へ
    expect(getCurrentKanaPosition(state)).toBe(1)
  })

  it('1文字目入力途中は位置0を返す', () => {
    const dag = decompose('かき')
    const state = createMatcher(dag)
    feedKey(state, dag, 'k') // 「か」の途中
    expect(getCurrentKanaPosition(state)).toBe(0)
  })

  it('複合語ショートカットで2文字分進んだ場合', () => {
    const dag = decompose('ことが')
    const state = createMatcher(dag)
    feedKey(state, dag, 'k')
    feedKey(state, dag, 't') // 「こと」(kt) 完了 → ノード2へ
    expect(getCurrentKanaPosition(state)).toBe(2)
  })
})
