# Currents API リファレンス

## 概要

| 項目 | 内容 |
|------|------|
| ベースURL | `https://api.currentsapi.services/v1` |
| 認証方式 | クエリパラメータ `apiKey` |
| 無料プラン | 日20リクエスト，最大200件/リクエスト |
| 公式ドキュメント | https://currentsapi.services/en/docs/ |

---

## 使用エンドポイント

### GET `/latest-news`

最新ニュースを取得する．

**リクエスト例:**

```
GET https://api.currentsapi.services/v1/latest-news?language=ja&apiKey={CURRENTS_API_KEY}
```

**主要クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `apiKey` | string | ✅ | - | APIキー |
| `keywords` | string | | - | キーワード検索（スペース区切りでAND） |
| `language` | string | | `en` | 言語コード（例: `ja`，`en`） |
| `country` | string | | - | 国コード（例: `JP`，`US`） |
| `category` | string | | - | カテゴリ（`technology`，`sports`，`finance` 等） |
| `start_date` | string | | - | 取得開始日時（ISO 8601形式） |
| `end_date` | string | | - | 取得終了日時（ISO 8601形式） |
| `page_number` | integer | | `1` | ページ番号 |

### GET `/search`

キーワード検索でニュースを取得する．

**リクエスト例:**

```
GET https://api.currentsapi.services/v1/search?keywords=AI&language=en&apiKey={CURRENTS_API_KEY}
```

`/latest-news` と同じパラメータ体系を持つ．`keywords` の指定が主目的のエンドポイント．

---

## レスポンス形式

```json
{
  "status": "ok",
  "news": [
    {
      "id": "uuid-string",
      "title": "記事タイトル",
      "description": "記事の概要文",
      "url": "https://example.com/article",
      "author": "著者名",
      "image": "https://example.com/image.jpg",
      "language": "ja",
      "category": ["technology"],
      "published": "2026-02-20 12:34:56 +0000"
    }
  ]
}
```

---

## Article への正規化マッピング

| Currents フィールド | Article フィールド | 備考 |
|-------------------|------------------|------|
| `title` | `title` | そのまま使用 |
| `description` | `description` | そのまま使用 |
| `url` | `url` / `id` | urlをSHA-256ハッシュしてidに |
| `author` | `source` | 著者名をソースとして使用，空の場合は `"Currents"` |
| `published` | `publishedAt` | `"YYYY-MM-DD HH:mm:ss +0000"` → ISO 8601に変換が必要 |
| -(固定値) | `provider` | `"currents"` |
| -(なし) | `content` | Currentsは本文を返さないため `undefined` |

---

## 日時フォーマット変換

Currents の `published` フィールドは `"2026-02-20 12:34:56 +0000"` 形式で返る．
GNews の `publishedAt`（ISO 8601）と統一するため，正規化時に変換する．

```typescript
// "2026-02-20 12:34:56 +0000" → "2026-02-20T12:34:56.000Z"
const publishedAt = new Date(raw.published).toISOString();
```

---

## エラーレスポンス

| HTTPステータス | 意味 | 対処 |
|--------------|------|------|
| `401` | APIキー無効または未指定 | .env の CURRENTS_API_KEY を確認 |
| `429` | レート制限超過 | 月600リクエスト制限を確認 |
| `400` | 不正なパラメータ | language コード等を確認 |

---

## 実装ノート

- GNewsと異なりカテゴリフィルタ（`category`）が使用可能．将来的な機能拡張で活用できる．
- `description` が空文字で返ってくる記事が存在する．正規化時に空文字チェックを行う．
- `author` フィールドも空の場合があるため，フォールバック（`"Unknown"` 等）を設ける．
- 無料プランの日次リクエスト上限は20回のため，開発中は不必要なリクエストを避けること．
- 最大200件/リクエストはGNewsより多いが，日20回制限に注意．
