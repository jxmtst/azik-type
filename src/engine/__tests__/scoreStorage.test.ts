import { describe, it, expect } from 'vitest'
import type { ScoreRecord } from '../types'
import { saveScore, loadScores, clearScores } from '../scoreStorage'

function createMockStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const store: Record<string, string> = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
  }
}

function makeRecord(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: 'sentence',
    kpm: 200,
    accuracy: 95,
    effectiveKpm: 190,
    totalKeystrokes: 100,
    missCount: 5,
    elapsedMs: 30000,
    ...overrides,
  }
}

describe('scoreStorage', () => {
  describe('saveScore', () => {
    it('空のストレージにスコアを保存できる', () => {
      const storage = createMockStorage()
      const record = makeRecord()
      saveScore(record, storage)
      const scores = loadScores(storage)
      expect(scores).toHaveLength(1)
      expect(scores[0].id).toBe(record.id)
    })

    it('既存スコアの先頭に新しいスコアが追加される', () => {
      const storage = createMockStorage()
      const first = makeRecord({ kpm: 100 })
      const second = makeRecord({ kpm: 200 })
      saveScore(first, storage)
      saveScore(second, storage)
      const scores = loadScores(storage)
      expect(scores).toHaveLength(2)
      expect(scores[0].kpm).toBe(200)
      expect(scores[1].kpm).toBe(100)
    })

    it('MAX_SCORES(50)を超えたら古いスコアが削除される', () => {
      const storage = createMockStorage()
      for (let i = 0; i < 52; i++) {
        saveScore(makeRecord({ kpm: i }), storage)
      }
      const scores = loadScores(storage)
      expect(scores).toHaveLength(50)
      expect(scores[0].kpm).toBe(51)
    })
  })

  describe('loadScores', () => {
    it('ストレージが空のとき空配列を返す', () => {
      const storage = createMockStorage()
      expect(loadScores(storage)).toEqual([])
    })

    it('保存されたスコアを読み込める', () => {
      const storage = createMockStorage()
      const record = makeRecord({ mode: 'drill', categories: ['basic'], questionCount: 10 })
      saveScore(record, storage)
      const scores = loadScores(storage)
      expect(scores[0].mode).toBe('drill')
      expect(scores[0].categories).toEqual(['basic'])
      expect(scores[0].questionCount).toBe(10)
    })

    it('不正なJSONのとき空配列を返す', () => {
      const storage = createMockStorage()
      storage.setItem('azik-type-scores', '{invalid json}')
      expect(loadScores(storage)).toEqual([])
    })
  })

  describe('clearScores', () => {
    it('保存されたスコアがクリアされる', () => {
      const storage = createMockStorage()
      saveScore(makeRecord(), storage)
      clearScores(storage)
      expect(loadScores(storage)).toEqual([])
    })
  })
})
