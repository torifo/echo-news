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

## 仕様書

実装の仕様については `spec/` ディレクトリを参照してください．

| ファイル | 内容 |
|---------|------|
| [spec/requirements.md](../spec/requirements.md) | 要件定義書 |
| [spec/design.md](../spec/design.md) | 設計書 |
| [spec/tasks.md](../spec/tasks.md) | タスクリスト |
