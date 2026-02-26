// src/engine/sessionMetrics.ts
import type { SessionMetrics } from './types'

type MatcherCounters = {
  totalKeystrokes: number
  missCount: number
}

export type MetricsAccumulator = {
  update: (counters: MatcherCounters, elapsedMs: number) => void
  commit: () => void
  reset: () => void
  current: () => SessionMetrics
}

export function createMetricsAccumulator(): MetricsAccumulator {
  let cumulativeKeystrokes = 0
  let cumulativeMissCount = 0
  let currentKeystrokes = 0
  let currentMissCount = 0
  let elapsedMs = 0

  return {
    update(counters: MatcherCounters, elapsed: number) {
      currentKeystrokes = counters.totalKeystrokes
      currentMissCount = counters.missCount
      elapsedMs = elapsed
    },
    commit() {
      cumulativeKeystrokes += currentKeystrokes
      cumulativeMissCount += currentMissCount
      currentKeystrokes = 0
      currentMissCount = 0
    },
    reset() {
      cumulativeKeystrokes = 0
      cumulativeMissCount = 0
      currentKeystrokes = 0
      currentMissCount = 0
      elapsedMs = 0
    },
    current(): SessionMetrics {
      return {
        totalKeystrokes: cumulativeKeystrokes + currentKeystrokes,
        missCount: cumulativeMissCount + currentMissCount,
        elapsedMs,
      }
    },
  }
}
