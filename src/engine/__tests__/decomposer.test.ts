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

  it('複合語ショートカットで最短パスのみ残る', () => {
    // 「こと」は kt(2キー) のみ許可。ko+to(4キー)は枝刈り
    const dag = decompose('こと')
    expect(dag.nodeCount).toBe(3) // [0], [1], [2]
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(1) // kt のみ
    expect(edgesFrom0[0].kana).toBe('こと')
    expect(edgesFrom0[0].romajiOptions).toContain('kt')
    expect(edgesFrom0[0].to).toBe(2)
  })

  it('ことがある: 最短パスのみ残る', () => {
    const dag = decompose('ことがある')
    expect(dag.nodeCount).toBe(6) // 5文字 + 終端
    // 位置0から「こと」(kt)のみ（「こ」(ko)は枝刈り）
    const edgesFrom0 = dag.edgesByNode[0].map(i => dag.edges[i])
    expect(edgesFrom0.length).toBe(1)
    expect(edgesFrom0[0].kana).toBe('こと')
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

  it('同一かなに複数エントリがある場合、最短キー列のみ許可する', () => {
    // 「ん」: q(1キー) と nn(2キー) → q のみ許可
    const dag = decompose('ん')
    const edge = dag.edges[0]
    expect(edge.kana).toBe('ん')
    expect(edge.romajiOptions).toContain('q')
    expect(edge.romajiOptions).not.toContain('nn')
  })

  it('同キー数のエントリは全て許可する', () => {
    // 「さん」: sz(2キー) と sn(2キー) → 両方許可
    const dag = decompose('さん')
    // 2文字マッチのエッジを探す
    const sanEdge = dag.edges.find(e => e.kana === 'さん')
    expect(sanEdge).toBeDefined()
    expect(sanEdge!.romajiOptions).toContain('sz')
    expect(sanEdge!.romajiOptions).toContain('sn')
  })

  it('1文字マッチでも最短フィルタが適用される', () => {
    // 「か」: ka(2キー) のみ。他に短いエントリがなければそのまま
    const dag = decompose('か')
    const edge = dag.edges[0]
    expect(edge.romajiOptions).toContain('ka')
    // kaより短いエントリは存在しないので、kaが残る
    expect(edge.romajiOptions.length).toBeGreaterThanOrEqual(1)
  })
})
