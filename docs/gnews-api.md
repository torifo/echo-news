# GNews API リファレンス

## 概要

| 項目 | 内容 |
|------|------|
| ベースURL | `https://gnews.io/api/v4` |
| 認証方式 | クエリパラメータ `apikey` |
| 無料プラン | 日100リクエスト，最大10件/リクエスト |
| 公式ドキュメント | https://gnews.io/docs/v4 |

---

## 使用エンドポイント

### GET `/top-headlines`

最新のトップニュースを取得する．

**リクエスト例:**

```
GET https://gnews.io/api/v4/top-headlines?lang=ja&max=10&apikey={GNEWS_API_KEY}
```

**主要クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `apikey` | string | ✅ | - | APIキー |
| `q` | string | | - | キーワード検索（AND/OR/NOT対応） |
| `lang` | string | | `en` | 言語コード（例: `ja`，`en`） |
| `country` | string | | - | 国コード（例: `jp`，`us`） |
| `max` | integer | | `10` | 取得件数（無料プランは最大10） |
| `from` | string | | - | 取得開始日時（ISO 8601形式） |
| `to` | string | | - | 取得終了日時（ISO 8601形式） |
| `sortby` | string | | `publishedAt` | ソート基準（`publishedAt` / `relevance`） |

---

## レスポンス形式

```json
{
  "totalArticles": 123,
  "articles": [
    {
      "title": "記事タイトル",
      "description": "記事の概要文",
      "content": "記事の本文（最初の数百字）...",
      "url": "https://example.com/article",
      "image": "https://example.com/image.jpg",
      "publishedAt": "2026-02-20T12:34:56Z",
      "source": {
        "name": "Example News",
        "url": "https://example.com"
      }
    }
  ]
}
```

---

## Article への正規化マッピング

| GNews フィールド | Article フィールド | 備考 |
|----------------|------------------|------|
| `title` | `title` | そのまま使用 |
| `description` | `description` | そのまま使用 |
| `content` | `content` | そのまま使用 |
| `url` | `url` / `id` | urlをSHA-256ハッシュしてidに |
| `source.name` | `source` | |
| `publishedAt` | `publishedAt` | ISO 8601のまま使用 |
| -(固定値) | `provider` | `"gnews"` |

---

## エラーレスポンス

| HTTPステータス | 意味 | 対処 |
|--------------|------|------|
| `401` | APIキー無効または未指定 | .env の GNEWS_API_KEY を確認 |
| `429` | レート制限超過 | 月100リクエスト制限を確認 |
| `400` | 不正なリクエスト | パラメータを確認 |

---

## 実装ノート

- **無料プランは最大12時間の記事遅延あり．** リアルタイム配信には有料プランが必要（`realTimeArticles` フィールドで通知される）．
- 無料プランでは `max` は10が上限，日100リクエストまで．Currentsより余裕があるが無駄なリクエストは避けること．
- `content` フィールドは本文全体ではなく，先頭数百字のみ含まれる場合がある．
- `publishedAt` は UTC の ISO 8601形式で返却される．
