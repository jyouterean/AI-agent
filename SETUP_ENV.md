# 環境変数の設定方法

## 問題

`DATABASE_URL`環境変数が見つからないエラーが発生しています。

## 解決方法

### ステップ1: `.env`ファイルを作成

プロジェクトのルートディレクトリ（`/Users/rean/Desktop/AI-agent`）に`.env`ファイルを作成してください。

### ステップ2: データベース接続URLを設定

`.env`ファイルに以下の形式で`DATABASE_URL`を設定してください：

```env
DATABASE_URL="postgresql://ユーザー名:パスワード@ホスト名/データベース名?sslmode=require"
```

### データベース接続URLの取得方法

#### Vercelを使用している場合

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. `DATABASE_URL`の値をコピー
5. ローカルの`.env`ファイルに貼り付け

#### Neon PostgreSQLを使用している場合

1. Neonダッシュボードにログイン
2. プロジェクトを選択
3. 「Connection Details」を開く
4. 「Connection string」をコピー
5. ローカルの`.env`ファイルに貼り付け

#### その他のPostgreSQLデータベースの場合

接続文字列の形式：
```
postgresql://ユーザー名:パスワード@ホスト名:ポート/データベース名?sslmode=require
```

例：
```
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb?sslmode=require"
```

### ステップ3: その他の環境変数（オプション）

必要に応じて、`.env.example`を参考に他の環境変数も設定できます。

### ステップ4: 設定の確認

`.env`ファイルを作成したら、再度コマンドを実行してください：

```bash
# マイグレーション実行
npx prisma migrate deploy

# 管理者アカウント作成
npx tsx prisma/seed-admin.ts
```

## 注意事項

- `.env`ファイルはGitにコミットされません（`.gitignore`に含まれています）
- 機密情報を含むため、絶対にGitにコミットしないでください
- 本番環境（Vercel）では、Vercelダッシュボードで環境変数を設定してください

