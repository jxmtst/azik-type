// src/engine/__tests__/decomposer.test.ts
import { describe, it, expect } from 'vitest'
import { decompose } from '../decomposer'

describe('decompose', () => {
  it('単一かな文字列のDAGを構築する', () => {
    const dag = decompose('か')
    expect(dag.nodeCount).toBe(2) // [0] -> [1]
    expect(dag.edges).toHaveLength(1)
    expect(dag.edges[0].romajiOptions).toContain('ka')
    expect(dag.edges[0].kana).toBe('か')
  })

  it('複数かなの直列DAGを構築する', () => {
    const dag = decompose('かき')
    expect(dag.nodeCount).toBe(3) // [0] -> [1] -> [2]
    expect(dag.edges.length).toBeGreaterThanOrEqual(2)
  })

  it('複合語ショートカットで分岐DAGを構築する', () => {
    // 「こと」は kt(2キー) でも ko+to(4キー) でも入力可能
    const dag = decompose('こと')
    expect(dag.nodeCount).toBe(3) // [0], [1], [2]
    // ko→[1], to→[2] のパスと kt→[2] のパスがある
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(2) // ko と kt
    const ktEdge = edgesFrom0.find(e => e.kana === 'こと')
    expect(ktEdge).toBeDefined()
    expect(ktEdge!.romajiOptions).toContain('kt')
    expect(ktEdge!.to).toBe(2)
  })

  it('設計書の例: ことがある', () => {
    const dag = decompose('ことがある')
    expect(dag.nodeCount).toBe(6) // 5文字 + 終端
    // 位置0から「こ」(ko)と「こと」(kt)の2エッジ
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(2)
  })

  it('非対象文字はスキップエッジになる', () => {
    // 漢字はスキップ
    const dag = decompose('あ字か')
    const skipEdges = dag.edges.filter(e => e.isSkip)
    expect(skipEdges.length).toBe(1)
    expect(skipEdges[0].kana).toBe('字')
  })

  it('句読点は入力対象', () => {
    const dag = decompose('あ。')
    const periodEdge = dag.edges.find(e => e.kana === '。')
    expect(periodEdge).toBeDefined()
    expect(periodEdge!.isSkip).toBe(false)
    expect(periodEdge!.romajiOptions).toContain('.')
  })

  it('空文字列は空DAGを返す', () => {
    const dag = decompose('')
    expect(dag.nodeCount).toBe(1)
    expect(dag.edges).toHaveLength(0)
  })

  it('NFKC正規化される', () => {
    // ひらがな「か」はそのまま処理
    const dag = decompose('か')
    expect(dag.edges[0].kana).toBe('か')
  })
})
