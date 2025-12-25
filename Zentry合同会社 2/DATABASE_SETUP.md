# Neon PostgreSQL データベースセットアップ

## データベース接続情報

Neon PostgreSQLデータベースが設定されています。

### 接続文字列

```
postgresql://neondb_owner:npg_nYXFIxP3o9fr@ep-divine-tree-a1x38li5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## データベース設計

### テーブル構成

#### 1. transactions（取引）
- `id`: 主キー (CUID)
- `type`: 種別 (income/expense) - VARCHAR(20)
- `date`: 取引日 - TIMESTAMP
- `accountCategory`: 勘定科目 - VARCHAR(100)
- `partnerName`: 取引先名 - VARCHAR(200)
- `amountYen`: 金額（円） - INTEGER
- `memo`: メモ - TEXT
- `attachmentUrl`: 添付URL - VARCHAR(500)
- `createdAt`: 作成日時 - TIMESTAMP
- `updatedAt`: 更新日時 - TIMESTAMP

**インデックス:**
- `date` (取引日)
- `type` (種別)

#### 2. clients（顧客）
- `id`: 主キー (CUID)
- `name`: 顧客名 - VARCHAR(200)
- `email`: メールアドレス - VARCHAR(255)
- `address`: 住所 - TEXT
- `invoiceRegNo`: 適格請求書発行事業者番号 - VARCHAR(50)
- `createdAt`: 作成日時 - TIMESTAMP
- `updatedAt`: 更新日時 - TIMESTAMP

**インデックス:**
- `name` (顧客名)

#### 3. invoices（請求書）
- `id`: 主キー (CUID)
- `clientId`: 顧客ID (外部キー) - TEXT
- `issueDate`: 発行日 - TIMESTAMP
- `dueDate`: 支払期限 - TIMESTAMP
- `status`: ステータス (draft/sent/paid) - VARCHAR(20)
- `subtotalYen`: 税抜合計 - INTEGER
- `taxYen`: 税額 - INTEGER
- `totalYen`: 税込合計 - INTEGER
- `notes`: 備考 - TEXT
- `bankAccount`: 振込先 - VARCHAR(200)
- `createdAt`: 作成日時 - TIMESTAMP
- `updatedAt`: 更新日時 - TIMESTAMP

**インデックス:**
- `clientId` (顧客ID)
- `status` (ステータス)
- `issueDate` (発行日)

**外部キー制約:**
- `clientId` → `clients.id` (CASCADE削除)

#### 4. invoice_items（請求書明細）
- `id`: 主キー (CUID)
- `invoiceId`: 請求書ID (外部キー) - TEXT
- `description`: 明細名 - VARCHAR(200)
- `quantity`: 数量 - INTEGER
- `unitPriceYen`: 単価（円） - INTEGER
- `amountYen`: 金額 - INTEGER
- `taxRate`: 税率 (0, 0.08, 0.1) - DOUBLE PRECISION
- `createdAt`: 作成日時 - TIMESTAMP

**インデックス:**
- `invoiceId` (請求書ID)

**外部キー制約:**
- `invoiceId` → `invoices.id` (CASCADE削除)

## 環境変数の設定

### 開発環境

`.env`ファイルに以下を設定：

```env
DATABASE_URL="postgresql://neondb_owner:npg_nYXFIxP3o9fr@ep-divine-tree-a1x38li5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 本番環境

`.env.production`ファイルに設定済みです。

## データベース操作コマンド

### Prismaクライアントの生成

```bash
npx prisma generate
```

### スキーマの適用（開発用）

```bash
npx prisma db push
```

### マイグレーションの適用（本番用）

```bash
npx prisma migrate deploy
```

### サンプルデータの投入

```bash
npx tsx prisma/seed.ts
```

### Prisma Studioでデータベースを確認

```bash
npx prisma studio
```

## 注意事項

1. **接続プーラー**: Neonの接続文字列には`-pooler`が含まれています。これは接続プーラーを使用することを意味します。

2. **SSL接続**: `sslmode=require`が設定されているため、SSL接続が必須です。

3. **CASCADE削除**: 
   - 顧客を削除すると、関連する請求書も自動的に削除されます
   - 請求書を削除すると、関連する明細も自動的に削除されます

4. **インデックス**: パフォーマンス向上のため、頻繁に検索されるカラムにインデックスを設定しています。

5. **型の制約**: 
   - 文字列型には適切な長さ制限を設定
   - 金額は整数（円）で統一
   - 税率は浮動小数点数（0, 0.08, 0.1）

## データベースの状態確認

Neonのダッシュボードからデータベースの状態を確認できます：
- 接続数
- クエリパフォーマンス
- ストレージ使用量
- ログ

