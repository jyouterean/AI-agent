# 初期管理者アカウント作成（クイックガイド）

## 必要なコマンド（順番に実行）

```bash
# 1. マイグレーション実行（テーブル作成）
npx prisma migrate deploy

# 2. Prismaクライアント生成
npx prisma generate

# 3. 管理者アカウント作成
npx tsx prisma/seed-admin.ts
```

## 作成されるアカウント

- **メール**: admin@zentry.co.jp
- **パスワード**: admin123

## ログイン

http://localhost:3000/login にアクセスして上記の情報でログイン
