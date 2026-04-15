import type { ScoreRecord } from './types'

const STORAGE_KEY = 'azik-type-scores'
const MAX_SCORES = 50

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadScores(storage: MinimalStorage = localStorage): ScoreRecord[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScoreRecord[]
  } catch {
    return []
  }
}

export function saveScore(record: ScoreRecord, storage: MinimalStorage = localStorage): void {
  try {
    const scores = loadScores(storage)
    scores.unshift(record)
    storage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, MAX_SCORES)))
  } catch {
    // localStorage unavailable — silently fail
  }
}

export function clearScores(storage: MinimalStorage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // silently fail
  }
}
