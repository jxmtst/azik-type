# AZIK Type

AZIK配列に特化したタイピング練習アプリ。

<img width="1865" height="362" alt="文章タイピング" src="https://github.com/user-attachments/assets/bf5460d1-1981-4361-a23d-55eba9bf96eb" />

<img width="1864" height="308" alt="ドリル" src="https://github.com/user-attachments/assets/159b9efe-27eb-49d9-b329-977c9b370049" />

<img width="2062" height="883" alt="キーマップ" src="https://github.com/user-attachments/assets/7800b52c-ed11-4a31-b109-ffe26082a009" />

## AZIKとは

AZIK（エイズィック）は、木村清氏が1994年に提案した拡張ローマ字入力方式。標準のローマ字入力と互換性を保ちながら、頻出する日本語の音（二重母音・撥音など）を少ない打鍵で入力できるようにローマ字テーブルを拡張している。シミュレーションでは通常のローマ字入力に比べて約12%の打鍵削減が確認されている。

> 学習の移行性を重視した拡張ローマ字入力 : AZIK
> ― 木村 清（1994）
> [CiNii Research](https://cir.nii.ac.jp/crid/1571135652062676864)

特徴:
- キーボード配列を変更しないため、標準ローマ字入力からの移行コストが低い
- `q` → 「ん」、`;` → 「っ」のように、使用頻度の低いキーに頻出音を割り当て
- 二重母音（ai, uu, ei, ou）や撥音（an, in, un, en, on）を子音キー1打で入力可能
- 標準ローマ字入力との併用が可能（`;` → 「っ」のルール以外は干渉しない）

参考: [AZIK総合解説書](https://note.com/actbemu/n/n74f1c04c9a2e)

## About

AZIK配列の習得を目的としたタイピング練習アプリ。3つのモードで段階的に練習できる。

- **文章モード** - 日本語の文章をAZIK配列でタイピング。AZIK拡張ショートカット文字はゴールドでハイライト表示される
- **ドリルモード** - カテゴリ別にAZIKの入力パターンを反復練習
- **キーマップモード** - AZIK配列のキー配置を確認

## Usage

### 操作方法

| 操作 | 説明 |
|------|------|
| 文章モード | 開くと自動開始。制限時間内にタイピング |
| ドリルモード | カテゴリ選択後、`Space` で開始 |
| `Shift+Tab` | モード切替 |
| `ESC` | リセット |

### AZIKショートカットの例

| キー | 入力 |
|------|------|
| `q` | ん |
| `;` | っ（促音） |
| `kb` | きん |
| `ds` | です |

## Development

```bash
npm install
npm run dev
npm run build
npm test
```
