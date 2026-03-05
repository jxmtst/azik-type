import { describe, it, expect } from 'vitest'
import { computeExtensionChars } from '../TypingDisplay'
import { decompose } from '../../../engine/decomposer'

describe('computeExtensionChars', () => {
  it('撥音ショートカット対象の文字インデックスを返す', () => {
    // 「かんたん」→ DAGに「かん」(from:0,to:2) と「たん」(from:2,to:4) のエッジがある
    // これらは hatsuon_shortcut カテゴリのエントリを持つ
    const dag = decompose('かんたん')
    const result = computeExtensionChars(dag)
    expect(result.has(0)).toBe(true) // 「か」(「かん」エッジの一部)
    expect(result.has(1)).toBe(true) // 「ん」(「かん」エッジの一部 & 単独「ん」)
    expect(result.has(2)).toBe(true) // 「た」(「たん」エッジの一部)
    expect(result.has(3)).toBe(true) // 「ん」(「たん」エッジの一部 & 単独「ん」)
  })

  it('二重母音ショートカット対象の文字インデックスを返す', () => {
    // 「しょうらい」→ 「しょう」の「う」(index 2) が二重母音対象
    const dag = decompose('しょうらい')
    const result = computeExtensionChars(dag)
    // 「しょう」をカバーするエッジがあるはず
    expect(result.has(0)).toBe(true) // 「し」(しょう の一部)
    expect(result.has(1)).toBe(true) // 「ょ」(しょう の一部)
    expect(result.has(2)).toBe(true) // 「う」(しょう の一部)
  })

  it('拡張ショートカットがない場合は空Setを返す', () => {
    // 「あいう」→ 基本文字のみ
    const dag = decompose('あいう')
    const result = computeExtensionChars(dag)
    expect(result.size).toBe(0)
  })

  it('促音「っ」を拡張対象として返す', () => {
    const dag = decompose('かった')
    const result = computeExtensionChars(dag)
    // 「っ」のインデックスが含まれる
    expect(result.has(1)).toBe(true) // 「っ」
  })

  it('単一文字エッジの二重母音エントリは拡張対象にしない', () => {
    // 「で」はKANA_TO_ENTRIESにdf(double_vowel)があるが、単一文字エッジなので対象外
    const dag = decompose('でがみ')
    const result = computeExtensionChars(dag)
    expect(result.has(0)).toBe(false) // 「で」は対象外
  })

  it('dagがnullの場合は空Setを返す', () => {
    const result = computeExtensionChars(null)
    expect(result.size).toBe(0)
  })
})
