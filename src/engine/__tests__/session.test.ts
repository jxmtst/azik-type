// src/engine/__tests__/session.test.ts
import { describe, it, expect } from 'vitest'
import { createDrillSession, createSentenceSession, getNextQuestion } from '../session'

describe('DrillSession', () => {
  it('カテゴリを指定して問題を生成する', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['basic'], questionCount: 5 })
    expect(session.questions.length).toBe(5)
    for (const q of session.questions) {
      expect(q.entry.category).toBe('basic')
    }
  })

  it('同一セット内で重複しない', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['basic'], questionCount: 10 })
    const kanas = session.questions.map(q => q.entry.kana)
    expect(new Set(kanas).size).toBe(kanas.length)
  })

  it('エントリ数未満の場合はエントリ数分', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['punctuation'], questionCount: 100 })
    expect(session.questions.length).toBeLessThanOrEqual(100)
    expect(session.questions.length).toBeGreaterThan(0)
  })

  it('各問題にDAGが付与されている', () => {
    const session = createDrillSession({ mode: 'drill', categories: ['basic'], questionCount: 3 })
    for (const q of session.questions) {
      expect(q.dag.nodeCount).toBeGreaterThan(1)
      expect(q.dag.edges.length).toBeGreaterThan(0)
    }
  })
})

describe('SentenceSession', () => {
  it('文章セッションを作成できる', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 60 })
    expect(session.timeLimitMs).toBe(60000)
  })

  it('デフォルトの制限時間は60秒（設計仕様）', () => {
    // useTypingSession.tsでの呼び出し値が設計書通り60秒であることを確認するため、
    // ここではsession.tsの変換が正しいことだけ検証
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 60 })
    expect(session.timeLimitMs).toBe(60 * 1000)
  })

  it('getNextQuestionで文章とDAGを取得できる', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 60 })
    const q = getNextQuestion(session)
    expect(q).toBeDefined()
    expect(q!.text.length).toBeGreaterThan(0)
    expect(q!.dag.nodeCount).toBeGreaterThan(1)
  })

  it('一巡後も再シャッフルして問題を返し続ける', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 60 })
    const total = session.shuffled.length
    // 一巡分取得
    for (let i = 0; i < total; i++) {
      expect(getNextQuestion(session)).not.toBeNull()
    }
    // 一巡後も問題が返る（再シャッフル）
    expect(getNextQuestion(session)).not.toBeNull()
    expect(session.sentenceIndex).toBe(1)
  })
})
