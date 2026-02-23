# echo-news

複数のニュースAPIから情報を集約し，重複を排除してターミナル上で表示するCLIツール．

> デモ GIF は[こちら](#デモ)から確認できます．

## インストール

```bash
git clone https://github.com/torifo/echo-news.git
cd echo-news
npm install
npm run build
npm link
```

## クイックスタート

```bash
# 最新ニュースを10件表示（全プロバイダ）
echo-news

# キーワードで絞り込み
echo-news --topic AI

# 残りAPIリクエスト数を確認
echo-news --quota
```

---

## APIキーの設定

### ステップ1: `.env` を作成（クローン直後にこれだけでOK）

```bash
cp .env.example .env
```

`.env.example` には共有キーがあらかじめ入っています．そのままコピーするだけで動作します．

> **共有キーの制限:** GNews 5回/日，Currents 1回/日

### ステップ2（任意）: 自分のAPIキーを登録して制限を緩和

自分のキーを取得して登録すると，制限がフルになります．

| プロバイダ | 共有キー上限 | 自分のキー上限 | 取得先 |
|-----------|------------|-------------|--------|
| GNews | 5回/日 | 100回/日 | https://gnews.io/ |
| Currents | 1回/日 | 20回/日 | https://currentsapi.services/ |

```bash
echo-news config set-key gnews <あなたのキー>
echo-news config set-key currents <あなたのキー>
```

キーは `~/.config/echo-news/config.json` にローカル保存されます（リポジトリには含まれません）．

```bash
# 現在の設定と残りリクエスト数を確認
echo-news config show

# キーを削除して共有キーに戻す
echo-news config remove-key gnews
```

---

## コマンドリファレンス

### ニュース取得

```bash
echo-news [options]
```

#### 検索・絞り込み

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--topic <keyword>` | キーワード検索 | `--topic AI` |
| `--lang <code>` | 言語コード（デフォルト: `ja`） | `--lang en` |
| `--country <code>` | 国コード | `--country us` |
| `--category <name>` | カテゴリ絞り込み（Currentsのみ） | `--category technology` |
| `--sort <order>` | 並び順（GNewsのみ） | `--sort relevance` |
| `--from <date>` | 取得開始日（YYYY-MM-DD） | `--from 2026-02-01` |
| `--to <date>` | 取得終了日（YYYY-MM-DD） | `--to 2026-02-20` |

Currents の `--category` に指定できる値: `technology`，`sports`，`finance`，`science`，`world`，`politics`，`entertainment` 等

GNews の `--sort` に指定できる値: `publishedAt`（デフォルト），`relevance`

#### 表示件数・ソース

| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `--limit <number>` | 表示件数 | `10` |
| `--source <provider>` | プロバイダ指定（`gnews` / `currents` / `all`） | `all` |

#### 出力形式

| オプション | 説明 |
|-----------|------|
| `--url` | 記事URLを表示する |
| `--json` | JSON形式で出力（パイプ処理向け） |
| `--no-dedup` | 重複排除を無効にする |
| `--quota` | 今日の残りリクエスト数だけ表示して終了 |

### 設定管理

```bash
echo-news config set-key <provider> <key>   # APIキーを設定
echo-news config remove-key <provider>      # APIキーを削除（共有キーに戻す）
echo-news config show                       # 現在の設定と使用状況を表示
```

---

## 使用例

```bash
# AI関連ニュースをURL付きで5件
echo-news --topic AI --limit 5 --url

# テクノロジーカテゴリを英語で（Currents）
echo-news --source currents --category technology --lang en

# GNewsで関連度順に検索
echo-news --source gnews --topic 経済 --sort relevance

# 指定期間のニュース
echo-news --from 2026-02-01 --to 2026-02-20 --topic スポーツ

# 重複排除なしで全件取得しJSON出力（シェルスクリプト等との連携）
echo-news --source all --no-dedup --json | jq '.[].title'

# 現在のAPIキー設定と残りリクエスト数を確認
echo-news config show
```

---

## クォータ管理

実行のたびに残りリクエスト数が表示されます．色で残量を確認できます．

- 緑: 余裕あり
- 黄: 残り少ない
- 赤: ほぼ上限

カウントは `~/.config/echo-news/quota.json` にローカル保存され，日付が変わると自動リセットされます．

---

## デモ

**Windows（/mnt/c/ 経由）から実行**

![Windows demo](./demo/windows.gif)

**WSL2 から全機能デモ**

![WSL demo](./demo/wsl.gif)

**Windows + WSL2 連続デモ**

![Combined demo](./demo/combined.gif)

---

## 開発

```bash
# ts-node で直接実行（ビルド不要）
npm run dev -- --topic AI

# ビルド
npm run build

# dist クリーン
npm run clean
```

## 備考

- **GNews 無料プランは最大12時間の記事遅延があります．** リアルタイム配信は有料プランが必要です．
- Currents はリアルタイム配信に対応しています．

## ドキュメント

- [GNews API リファレンス](./docs/gnews-api.md)
- [Currents API リファレンス](./docs/currents-api.md)
