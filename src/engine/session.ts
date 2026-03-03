// src/engine/session.ts
import type { DrillConfig, SentenceConfig, AzikEntry, InputDag } from './types'
import { AZIK_ENTRIES } from '../data/azikData'
import { SENTENCES } from '../data/sentences'
import { decompose } from './decomposer'

export type DrillQuestion = {
  entry: AzikEntry
  dag: InputDag
}

export type DrillSession = {
  questions: DrillQuestion[]
  currentIndex: number
}

export type SentenceQuestion = {
  text: string
  dag: InputDag
}

export type SentenceSession = {
  timeLimitMs: number
  shuffled: string[]
  sentenceIndex: number
  currentQuestion: SentenceQuestion | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createDrillSession(config: DrillConfig): DrillSession {
  const filtered = AZIK_ENTRIES.filter(e => config.categories.includes(e.category))
  // kana重複排除: 同じkanaを持つエントリは最初の1つだけ残す
  const seen = new Set<string>()
  const unique = filtered.filter(e => {
    if (seen.has(e.kana)) return false
    seen.add(e.kana)
    return true
  })
  const shuffled = shuffle(unique)
  const count = Math.min(config.questionCount, shuffled.length)
  const questions = shuffled.slice(0, count).map(entry => ({
    entry,
    dag: decompose(entry.kana),
  }))
  return { questions, currentIndex: 0 }
}

export function createSentenceSession(config: SentenceConfig): SentenceSession {
  return {
    timeLimitMs: config.timeLimitSec * 1000,
    shuffled: shuffle(SENTENCES),
    sentenceIndex: 0,
    currentQuestion: null,
  }
}

export function getNextQuestion(session: SentenceSession): SentenceQuestion | null {
  if (session.sentenceIndex >= session.shuffled.length) {
    // 一巡したら再シャッフル
    session.shuffled = shuffle(SENTENCES)
    session.sentenceIndex = 0
  }
  const text = session.shuffled[session.sentenceIndex]
  session.sentenceIndex++
  const question: SentenceQuestion = { text, dag: decompose(text) }
  session.currentQuestion = question
  return question
}
