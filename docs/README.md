# echo-news ドキュメント

## ファイル一覧

| ファイル | 内容 |
|---------|------|
| [gnews-api.md](./gnews-api.md) | GNews API のエンドポイント・パラメータ・レスポンス仕様，Article正規化マッピング |
| [currents-api.md](./currents-api.md) | Currents API のエンドポイント・パラメータ・レスポンス仕様，Article正規化マッピングと日時変換 |

## APIキーの取得

| プロバイダ | 登録URL |
|-----------|---------|
| GNews | https://gnews.io/ |
| Currents | https://currentsapi.services/ |

取得後は `.env.example` をコピーして `.env` を作成し，各キーを設定してください．

```bash
cp .env.example .env
```
