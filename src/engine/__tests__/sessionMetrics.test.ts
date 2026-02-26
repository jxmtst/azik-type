// src/engine/__tests__/sessionMetrics.test.ts
import { describe, it, expect } from 'vitest'
import { createMetricsAccumulator } from '../sessionMetrics'

describe('SessionMetricsAccumulator', () => {
  it('初期状態は全て0', () => {
    const acc = createMetricsAccumulator()
    const metrics = acc.current()
    expect(metrics.totalKeystrokes).toBe(0)
    expect(metrics.missCount).toBe(0)
    expect(metrics.elapsedMs).toBe(0)
  })

  it('updateで現在問題のメトリクスを反映する', () => {
    const acc = createMetricsAccumulator()
    acc.update({ totalKeystrokes: 5, missCount: 1 }, 3000)
    const metrics = acc.current()
    expect(metrics.totalKeystrokes).toBe(5)
    expect(metrics.missCount).toBe(1)
    expect(metrics.elapsedMs).toBe(3000)
  })

  it('commitで現在問題のカウンタを累計に確定し、次の問題でリセットされない', () => {
    const acc = createMetricsAccumulator()
    // 問題1: 5打鍵、1ミス
    acc.update({ totalKeystrokes: 5, missCount: 1 }, 3000)
    acc.commit() // 問題1を確定

    // 問題2: 新Matcherでカウンタ0からスタート（updateは0,0から始まる）
    acc.update({ totalKeystrokes: 0, missCount: 0 }, 3500)
    const metrics = acc.current()
    // 累計5 + 現在0 = 5
    expect(metrics.totalKeystrokes).toBe(5)
    expect(metrics.missCount).toBe(1)
  })

  it('複数問題をまたいで累計が正しく計算される', () => {
    const acc = createMetricsAccumulator()
    // 問題1: 5打鍵、1ミス
    acc.update({ totalKeystrokes: 5, missCount: 1 }, 5000)
    acc.commit()

    // 問題2: 3打鍵、0ミス
    acc.update({ totalKeystrokes: 3, missCount: 0 }, 8000)
    acc.commit()

    // 問題3: 途中（2打鍵、1ミス）
    acc.update({ totalKeystrokes: 2, missCount: 1 }, 10000)
    const metrics = acc.current()
    // 累計(5+3) + 現在2 = 10
    expect(metrics.totalKeystrokes).toBe(10)
    // 累計(1+0) + 現在1 = 2
    expect(metrics.missCount).toBe(2)
    expect(metrics.elapsedMs).toBe(10000)
  })

  it('resetで全てクリアされる', () => {
    const acc = createMetricsAccumulator()
    acc.update({ totalKeystrokes: 5, missCount: 1 }, 3000)
    acc.commit()
    acc.update({ totalKeystrokes: 2, missCount: 0 }, 5000)
    acc.reset()
    const metrics = acc.current()
    expect(metrics.totalKeystrokes).toBe(0)
    expect(metrics.missCount).toBe(0)
    expect(metrics.elapsedMs).toBe(0)
  })
})
