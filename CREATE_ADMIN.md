# 管理者アカウントの作成方法

## 問題: ログインできない場合

ログインできない場合は、以下の手順で管理者アカウントを作成・確認してください。

## 方法1: 環境変数を設定して実行（推奨）

```bash
# .envファイルがある場合
DATABASE_URL="postgresql://..." npx tsx scripts/create-admin-direct.ts
```

## 方法2: .envファイルを作成してから実行

1. プロジェクトのルートディレクトリに`.env`ファイルを作成
2. 以下の内容を追加：

```env
DATABASE_URL="postgresql://ユーザー名:パスワード@ホスト名/データベース名?sslmode=require"
```

3. スクリプトを実行：

```bash
npx tsx scripts/create-admin-direct.ts
```

## 方法3: 既存のseed-admin.tsを使用

```bash
# .envファイルがある場合
npx tsx prisma/seed-admin.ts
```

## 作成されるアカウント情報

- **メールアドレス**: `admin@zentry.co.jp`
- **パスワード**: `admin123`
- **権限**: 管理者（admin）

## ログイン方法

1. ブラウザで `/login` にアクセス
2. 上記のメールアドレスとパスワードを入力
3. 「ログイン」をクリック

## トラブルシューティング

### エラー: "Environment variable not found: DATABASE_URL"

`.env`ファイルを作成して`DATABASE_URL`を設定してください。

### エラー: "User not found"

管理者アカウントが作成されていません。上記の方法でアカウントを作成してください。

### エラー: "Invalid password"

パスワードが正しくありません。`admin123`を使用してください。

### パスワードをリセットしたい場合

`scripts/create-admin-direct.ts`を実行すると、既存のアカウントのパスワードをリセットします。

