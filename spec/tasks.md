# echo-news タスクリスト

## Phase 1: 環境構築

- [x] `npm init -y` でプロジェクト初期化
- [x] TypeScript 関連パッケージのインストール（`typescript`，`ts-node`，`@types/node`）
- [x] 主要ライブラリのインストール（`commander`，`axios`，`dotenv`，`chalk@4`，`ora@5`）
  - chalk v5+ / ora v6+ はESM-onlyのため，CJS互換版（chalk@4，ora@5）を使用
- [x] `tsconfig.json` を作成（`strict: true`，`outDir: dist`，`rootDir: src`）
- [x] `.gitignore` を作成（`.env`，`node_modules/`，`dist/` を除外）
- [x] `.env.example` を作成（`GNEWS_API_KEY=`，`CURRENTS_API_KEY=` のテンプレート）
- [x] `package.json` の `scripts` に `build`，`dev`，`start`，`clean` を追加

## Phase 2: 型定義・共通基盤

- [x] `src/types.ts` に `Article`，`FetchOptions` インターフェースを定義
- [x] `src/providers/base.ts` に `BaseProvider` 抽象クラスを実装

## Phase 3: プロバイダ実装

- [x] `src/providers/gnews.ts` に `GNewsProvider` を実装
  - GNews API への `GET /v4/top-headlines` および `/search` リクエスト
  - レスポンスを `Article[]` に正規化
  - 動作確認（APIキーあり環境でテスト実行）
- [x] `src/providers/currents.ts` に `CurrentsProvider` を実装
  - Currents API への `GET /v1/latest-news` および `/search` リクエスト
  - レスポンスを `Article[]` に正規化（日時フォーマット変換含む）
  - 動作確認（APIキーあり環境でテスト実行）

## Phase 4: 重複排除ロジック

- [x] `src/deduplicator.ts` に `deduplicate` 関数を実装
  - URLハッシュによる完全一致検出
  - Levenshtein距離によるタイトル類似度計算（閾値: 0.85）
  - Mergerによる代表記事選定（本文が長い方を優先）

## Phase 5: 集約・CLI

- [x] `src/aggregator.ts` に `NewsAggregator` クラスを実装
  - 各プロバイダを呼び出して記事を集約（Promise.allSettled で一部失敗を許容）
  - `deduplicate` を適用して統合結果を返す
- [x] `src/formatter.ts` にターミナル出力ロジックを実装
  - chalk を用いたカラー表示
  - タイトル・ソース・日時・概要のレイアウト
- [x] `src/index.ts` にCLIエントリポイントを実装
  - `commander` でオプション（`--topic`，`--limit`，`--source`）を定義
  - `ora` によるローディングスピナー表示
  - エラーハンドリング（APIキー未設定，ネットワークエラー，不正オプション）

## Phase 6: 仕上げ

- [x] `README.md` の作成（インストール手順，使い方，APIキーの取得方法）
- [x] `npm run build` でコンパイルエラーがないことを確認
- [x] 実際のAPIキーで結合動作確認（`--source all`，`--source currents`，`--source gnews` すべて動作確認済み）
- [x] コマンドを `npm link` でグローバル登録して動作確認

---

## 依存関係

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
```

各フェーズは前フェーズの完了を前提とする．
Phase 3のGNewsとCurrentsは並行して実装可能．
