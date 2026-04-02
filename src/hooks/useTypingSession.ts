// src/hooks/useTypingSession.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import type { InputDag, MatcherState, MatchResult, Category, SessionMetrics, AzikEntry } from '../engine/types.ts'
import type { DrillSession, SentenceSession } from '../engine/session.ts'
import { createDrillSession, createSentenceSession, getNextQuestion } from '../engine/session.ts'
import { createMatcher, feedKey } from '../engine/inputMatcher.ts'
import { createMetricsAccumulator } from '../engine/sessionMetrics.ts'

type Mode = 'idle' | 'drill' | 'sentence' | 'result'

export type TypingSessionState = {
  // セッション状態
  mode: Mode

  // 現在の問題
  currentKana: string
  currentDag: InputDag | null
  matcherState: MatcherState | null

  // ドリル専用
  questionIndex: number
  totalQuestions: number
  currentEntry: AzikEntry | null

  // メトリクス
  metrics: SessionMetrics

  // 表示用の計算値
  kpm: number
  accuracy: number | null
  effectiveKpm: number | null

  // 文章モード
  remainingMs: number

  // 最後のキー入力結果
  lastResult: MatchResult | null

  // アクション
  startDrill: (categories: Category[], questionCount?: number) => void
  startSentence: () => void
  handleKey: (key: string) => void
  reset: () => void
}

function computeKpm(totalKeystrokes: number, elapsedMs: number): number {
  if (totalKeystrokes === 0) return 0
  return totalKeystrokes / (elapsedMs / 60000)
}

function computeAccuracy(totalKeystrokes: number, missCount: number): number | null {
  if (totalKeystrokes === 0) return null
  return ((totalKeystrokes - missCount) / totalKeystrokes) * 100
}

function computeEffectiveKpm(kpm: number, accuracy: number | null): number | null {
  if (accuracy === null) return null
  return kpm * accuracy / 100
}

export function useTypingSession(): TypingSessionState {
  const [mode, setMode] = useState<Mode>('idle')
  const [currentKana, setCurrentKana] = useState('')
  const [currentDag, setCurrentDag] = useState<InputDag | null>(null)
  const [matcherState, setMatcherState] = useState<MatcherState | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [currentEntry, setCurrentEntry] = useState<AzikEntry | null>(null)
  const [metrics, setMetrics] = useState<SessionMetrics>({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
  const [remainingMs, setRemainingMs] = useState(0)
  const [lastResult, setLastResult] = useState<MatchResult | null>(null)
  const [timerStarted, setTimerStarted] = useState(false)

  const startTimeRef = useRef<number | null>(null)
  const drillSessionRef = useRef<DrillSession | null>(null)
  const sentenceSessionRef = useRef<SentenceSession | null>(null)
  const timeLimitMsRef = useRef(0)
  const accumulatorRef = useRef(createMetricsAccumulator())

  // 文章モードのタイマー
  useEffect(() => {
    if (mode !== 'sentence') return
    if (!timerStarted) return

    const id = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current!
      const remaining = Math.max(0, timeLimitMsRef.current - elapsed)
      setRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        setMode('result')
        setMetrics(prev => ({ ...prev, elapsedMs: timeLimitMsRef.current }))
      }
    }, 100)

    return () => clearInterval(id)
  }, [mode, timerStarted])

  const startDrill = useCallback((categories: Category[], questionCount = 10) => {
    const session = createDrillSession({ mode: 'drill', categories, questionCount })
    drillSessionRef.current = session
    sentenceSessionRef.current = null
    startTimeRef.current = null
    accumulatorRef.current.reset()

    if (session.questions.length === 0) {
      setMode('result')
      setCurrentKana('')
      setCurrentDag(null)
      setMatcherState(null)
      setQuestionIndex(0)
      setTotalQuestions(0)
      setCurrentEntry(null)
      setMetrics({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
      setLastResult(null)
      return
    }

    const first = session.questions[0]
    const matcher = createMatcher(first.dag)

    setMode('drill')
    setCurrentKana(first.entry.kana)
    setCurrentDag(first.dag)
    setMatcherState(matcher)
    setQuestionIndex(0)
    setTotalQuestions(session.questions.length)
    setCurrentEntry(first.entry)
    setMetrics({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
    setRemainingMs(0)
    setLastResult(null)
  }, [])

  const startSentence = useCallback(() => {
    const session = createSentenceSession({ mode: 'sentence', timeLimitSec: 60 })
    sentenceSessionRef.current = session
    drillSessionRef.current = null
    startTimeRef.current = null
    setTimerStarted(false)
    accumulatorRef.current.reset()
    timeLimitMsRef.current = session.timeLimitMs

    const question = getNextQuestion(session)
    if (!question) {
      setMode('result')
      setCurrentKana('')
      setCurrentDag(null)
      setMatcherState(null)
      setMetrics({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
      setLastResult(null)
      return
    }

    const matcher = createMatcher(question.dag)

    setMode('sentence')
    setCurrentKana(question.text)
    setCurrentDag(question.dag)
    setMatcherState(matcher)
    setQuestionIndex(0)
    setTotalQuestions(0)
    setCurrentEntry(null)
    setMetrics({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
    setRemainingMs(session.timeLimitMs)
    setLastResult(null)
  }, [])

  const handleKey = useCallback((key: string) => {
    if (mode !== 'drill' && mode !== 'sentence') return
    if (!currentDag || !matcherState) return

    // 最初の打鍵でタイマー開始
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
      setTimerStarted(true)
    }

    // feedKeyはstateをmutateするので、コピーを作ってから渡す
    const stateCopy: MatcherState = {
      cursors: matcherState.cursors.map(c => ({ ...c })),
      totalKeystrokes: matcherState.totalKeystrokes,
      missCount: matcherState.missCount,
    }

    const result = feedKey(stateCopy, currentDag, key)
    const elapsedMs = Date.now() - startTimeRef.current

    // matcherStateを更新（新オブジェクトとしてセット）
    const newMatcherState: MatcherState = {
      cursors: stateCopy.cursors.map(c => ({ ...c })),
      totalKeystrokes: stateCopy.totalKeystrokes,
      missCount: stateCopy.missCount,
    }

    setMatcherState(newMatcherState)
    setLastResult(result)

    const acc = accumulatorRef.current
    acc.update({ totalKeystrokes: newMatcherState.totalKeystrokes, missCount: newMatcherState.missCount }, elapsedMs)
    setMetrics(acc.current())

    if (result === 'complete') {
      acc.commit()
      setMetrics(acc.current())

      if (mode === 'drill') {
        const session = drillSessionRef.current!
        const nextIndex = questionIndex + 1
        if (nextIndex >= session.questions.length) {
          // 全問完了
          setMode('result')
        } else {
          // 次の問題へ
          const next = session.questions[nextIndex]
          const matcher = createMatcher(next.dag)
          setQuestionIndex(nextIndex)
          setCurrentKana(next.entry.kana)
          setCurrentDag(next.dag)
          setMatcherState(matcher)
          setCurrentEntry(next.entry)
        }
      } else if (mode === 'sentence') {
        const session = sentenceSessionRef.current!
        const question = getNextQuestion(session)
        if (!question) {
          // 全文消化
          setMode('result')
        } else {
          const matcher = createMatcher(question.dag)
          setCurrentKana(question.text)
          setCurrentDag(question.dag)
          setMatcherState(matcher)
        }
      }
    }
  }, [mode, currentDag, matcherState, questionIndex])

  const reset = useCallback(() => {
    setMode('idle')
    setCurrentKana('')
    setCurrentDag(null)
    setMatcherState(null)
    setQuestionIndex(0)
    setTotalQuestions(0)
    setCurrentEntry(null)
    setMetrics({ totalKeystrokes: 0, missCount: 0, elapsedMs: 0 })
    setRemainingMs(0)
    setLastResult(null)
    setTimerStarted(false)
    startTimeRef.current = null
    drillSessionRef.current = null
    sentenceSessionRef.current = null
  }, [])

  const kpm = computeKpm(metrics.totalKeystrokes, metrics.elapsedMs)
  const accuracy = computeAccuracy(metrics.totalKeystrokes, metrics.missCount)
  const effectiveKpm = computeEffectiveKpm(kpm, accuracy)

  return {
    mode,
    currentKana,
    currentDag,
    matcherState,
    questionIndex,
    totalQuestions,
    currentEntry,
    metrics,
    kpm,
    accuracy,
    effectiveKpm,
    remainingMs,
    lastResult,
    startDrill,
    startSentence,
    handleKey,
    reset,
  }
}
