# 初期管理者アカウントの作成手順

## 前提条件

1. データベース（PostgreSQL）が設定されていること
2. 環境変数`DATABASE_URL`が設定されていること
3. 必要なパッケージがインストールされていること

## 手順

### ステップ1: 環境変数の確認

プロジェクトのルートディレクトリに`.env`ファイルがあることを確認し、`DATABASE_URL`が設定されていることを確認してください。

```bash
# .envファイルの例
DATABASE_URL="postgresql://ユーザー名:パスワード@ホスト名/データベース名?sslmode=require"
```

### ステップ2: データベースマイグレーションの実行

まず、データベースにテーブルを作成する必要があります。

```bash
# マイグレーションを実行
npx prisma migrate deploy
```

または、開発環境の場合は：

```bash
npx prisma db push
```

### ステップ3: Prismaクライアントの生成

```bash
npx prisma generate
```

### ステップ4: 初期管理者アカウントの作成

以下のコマンドを実行して、初期管理者アカウントを作成します：

```bash
npx tsx prisma/seed-admin.ts
```

### ステップ5: 作成結果の確認

コマンドを実行すると、以下のようなメッセージが表示されます：

- **成功時**: `管理者アカウントを作成しました: admin@zentry.co.jp`
- **既に存在する場合**: `管理者アカウントは既に存在します`

## 作成されるアカウント情報

- **メールアドレス**: `admin@zentry.co.jp`
- **パスワード**: `admin123`
- **権限**: 管理者（admin）
- **名前**: 管理者

## 注意事項

⚠️ **重要**: 本番環境では、必ずパスワードを変更してください！

## トラブルシューティング

### エラー: "Cannot find module 'bcryptjs'"

```bash
npm install bcryptjs @types/bcryptjs
```

### エラー: "Cannot find module 'tsx'"

```bash
npm install --save-dev tsx
```

### エラー: "P1001: Can't reach database server"

- `DATABASE_URL`が正しく設定されているか確認
- データベースサーバーが起動しているか確認
- ネットワーク接続を確認

### エラー: "P2025: Record to update not found"

- マイグレーションが正しく実行されているか確認
- `npx prisma migrate deploy`を再実行

## データベースの状態確認

Prisma Studioを使用して、データベースの内容を確認できます：

```bash
npx prisma studio
```

ブラウザで`http://localhost:5555`が開き、データベースの内容を視覚的に確認できます。

## ログイン方法

1. ブラウザでアプリケーションにアクセス
2. `/login`ページに移動
3. 以下の情報でログイン：
   - メールアドレス: `admin@zentry.co.jp`
   - パスワード: `admin123`

## 次のステップ

ログイン後、以下の操作が可能です：

1. **従業員管理**: `/users`ページから従業員アカウントを作成
2. **パスワード変更**: 管理者アカウントのパスワードを変更（今後実装予定）
3. **各種機能の利用**: 取引、請求書、顧客、タスクなどの管理

