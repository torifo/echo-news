# echo-news 設計書

## アーキテクチャ概要

```
CLI Entry Point (src/index.ts)
  └─ Commander (コマンド解析)
       └─ NewsAggregator (src/aggregator.ts)
            ├─ GNewsProvider   (src/providers/gnews.ts)
            ├─ CurrentsProvider (src/providers/currents.ts)
            └─ Deduplicator    (src/deduplicator.ts)
                  └─ Formatter (src/formatter.ts)
```

---

## Provider パターン

各ニュースAPIの差異を `BaseProvider` 抽象クラスで吸収し，共通の `Article` インターフェースを出力する．
新しいプロバイダを追加する場合は `BaseProvider` を継承したクラスを実装するだけでよい．

### Article インターフェース

```typescript
interface Article {
  id: string;          // URLをSHA-256ハッシュしたID
  title: string;       // 記事タイトル
  description: string; // 概要文
  url: string;         // 記事URL
  source: string;      // ソース名（例: "BBC News"）
  provider: string;    // プロバイダ名（例: "gnews"）
  publishedAt: string; // ISO 8601形式の公開日時
  content?: string;    // 本文（取得できる場合）
}
```

### BaseProvider 抽象クラス

```typescript
abstract class BaseProvider {
  protected apiKey: string;
  abstract fetch(topic?: string, limit?: number): Promise<Article[]>;
  protected normalize(raw: unknown): Article { /* 共通正規化処理 */ }
}
```

---

## 重複排除ロジック（Deduplicator）

### Step 1: URL Hash による完全一致検出

- 全記事のURLをSHA-256でハッシュ化し，同一ハッシュが存在する場合は即座に重複と判定する．

### Step 2: Fuzzy Matching によるタイトル類似度検出

- Levenshtein距離をもとに類似度スコア（0.0〜1.0）を計算する．
- `score = 1 - (editDistance / Math.max(len1, len2))`
- スコアが閾値（デフォルト: 0.85）以上の場合，同一記事とみなす．

### Step 3: Merger（代表記事の選定）

- 重複グループの中から `content` または `description` が最も長い記事を代表として採用する．
- 採用されなかった記事のURLは代表記事の `relatedUrls` に保持する（将来的な参照用）．

---

## CLIコマンド設計

```
echo-news [options]

検索・絞り込み:
  --topic <keyword>      キーワード検索
  --lang <code>          言語コード（デフォルト: ja）
  --country <code>       国コード（例: jp，us）
  --category <name>      カテゴリ（Currentsのみ: technology / sports / finance / science / world 等）
  --sort <order>         並び順 publishedAt | relevance（GNewsのみ，デフォルト: publishedAt）
  --from <date>          取得開始日（YYYY-MM-DD）
  --to <date>            取得終了日（YYYY-MM-DD）

表示件数・ソース:
  --limit <number>       表示件数（デフォルト: 10）
  --source <provider>    使用プロバイダ（gnews | currents | all，デフォルト: all）

出力形式:
  --url                  記事URLを表示する
  --json                 JSON形式で出力する

動作:
  --no-dedup             重複排除を無効にする
  --quota                今日の残りリクエスト数を表示して終了

その他:
  -h, --help             ヘルプを表示
  -V, --version          バージョンを表示
```

## クォータトラッカー

`~/.config/echo-news/quota.json` にリクエスト数をローカル保存し，日次リセットする．
各実行後に残りリクエスト数をカラーで表示（残り少ないほど赤）．

| プロバイダ | 日次上限 | 警告閾値 |
|-----------|---------|---------|
| GNews | 100 | 残30以下: 黄，残10以下: 赤 |
| Currents | 20 | 残7以下: 黄，残3以下: 赤 |

---

## ターミナル出力レイアウト

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [1]  タイトルがここに表示されます
      Source: BBC News  |  2026-02-20 12:34
      概要文がここに表示されます．長い場合は折り返して
      表示します．
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- タイトル: 太字・シアン
- ソース名・日時: グレー
- 概要: 白
- 区切り線: ダークグレー

---

## ディレクトリ構成

```
echo-news/
├── spec/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── src/
│   ├── index.ts          # エントリポイント・CLIコマンド定義
│   ├── aggregator.ts     # 全プロバイダを束ねて記事を集約
│   ├── deduplicator.ts   # 重複排除ロジック
│   ├── formatter.ts      # ターミナル出力フォーマット
│   ├── types.ts          # Article など共通型定義
│   └── providers/
│       ├── base.ts       # BaseProvider 抽象クラス
│       ├── gnews.ts      # GNews API プロバイダ
│       └── currents.ts   # Currents API プロバイダ
├── .env                  # APIキー（gitignore対象）
├── .env.example          # APIキーのテンプレート
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 主要ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| `commander` | CLIコマンド・オプション解析 |
| `axios` | HTTP APIリクエスト |
| `dotenv` | .env ファイルの読み込み |
| `chalk` | ターミナルのカラー出力 |
| `ora` | ローディングスピナー |
| `typescript` | 型安全な実装 |
| `ts-node` | 開発時の直接実行 |
