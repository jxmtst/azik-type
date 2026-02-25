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
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 120 })
    expect(session.timeLimitMs).toBe(120000)
  })

  it('getNextQuestionで文章とDAGを取得できる', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 120 })
    const q = getNextQuestion(session)
    expect(q).toBeDefined()
    expect(q!.text.length).toBeGreaterThan(0)
    expect(q!.dag.nodeCount).toBeGreaterThan(1)
  })

  it('全文消化するとnullを返す', () => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 120 })
    // 全文取得
    let count = 0
    while (getNextQuestion(session) !== null) {
      count++
      if (count > 100) break // 安全弁
    }
    expect(count).toBeGreaterThan(0)
    expect(getNextQuestion(session)).toBeNull()
  })
})
