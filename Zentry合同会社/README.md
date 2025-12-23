# 経理管理と請求書作成が可能なAIエージェント

経理管理と請求書作成を支援するWebアプリケーションです。AIエージェントが自然言語で指示を受け、取引登録や請求書作成を補助します。

## 機能

- **取引管理**: 売上/支出の登録・一覧・編集・削除（CRUD）
- **請求書作成**: 顧客情報、明細行の追加、税率設定、PDF出力
- **ダッシュボード**: 今月の売上、支出、粗利、未回収額を表示
- **AIエージェント**: 自然言語で指示を受け、取引登録や請求書作成を補助（承認フロー付き）

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS
- **データベース**: SQLite (開発) / PostgreSQL (本番想定)
- **ORM**: Prisma
- **PDF生成**: @react-pdf/renderer
- **AI**: OpenAI API (GPT-4)
- **バリデーション**: Zod
- **日付処理**: dayjs

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
# または
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate
# または
pnpm db:generate

# データベースのマイグレーション
npx prisma db push
# または
pnpm db:push

# サンプルデータの投入
npx tsx prisma/seed.ts
# または
pnpm db:seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構成

```
.
├── app/
│   ├── api/              # APIルート
│   │   ├── transactions/ # 取引API
│   │   ├── invoices/     # 請求書API
│   │   ├── clients/      # 顧客API
│   │   └── agent/        # AIエージェントAPI
│   ├── dashboard/        # ダッシュボード
│   ├── transactions/     # 取引管理
│   ├── invoices/         # 請求書管理
│   └── agent/            # AIエージェントUI
├── components/           # Reactコンポーネント
├── lib/                  # ユーティリティ
├── prisma/               # Prismaスキーマとseed
└── public/               # 静的ファイル
```

## 使用方法

### 取引の登録

1. `/transactions` にアクセス
2. 「新規登録」ボタンをクリック
3. 種別（売上/支出）、日付、勘定科目、取引先、金額を入力
4. 「登録」ボタンをクリック

### 請求書の作成

1. `/invoices` にアクセス
2. 「新規作成」ボタンをクリック
3. 顧客を選択し、発行日・支払期限を設定
4. 明細を追加（明細名、数量、単価、税率）
5. 「保存して詳細へ」をクリック
6. PDFを表示・ダウンロード可能

### AIエージェントの使用

1. `/agent` にアクセス
2. 自然言語で指示を入力
   - 例: 「12/20にガソリン代 6500円、支出で登録して」
   - 例: 「A社に11月分の請求書作って。単価2万円×5日、消費税10%」
3. AIが提案したアクションを確認
4. 「承認して実行」ボタンで確定

## データモデル

### Transaction (取引)
- `type`: income (売上) / expense (支出)
- `date`: 取引日
- `accountCategory`: 勘定科目
- `partnerName`: 取引先名
- `amountYen`: 金額（円、整数）
- `memo`: メモ（任意）
- `attachmentUrl`: 添付URL（任意）

### Client (顧客)
- `name`: 顧客名
- `email`: メールアドレス（任意）
- `address`: 住所（任意）
- `invoiceRegNo`: 適格請求書発行事業者番号（任意）

### Invoice (請求書)
- `clientId`: 顧客ID
- `issueDate`: 発行日
- `dueDate`: 支払期限
- `status`: draft (下書き) / sent (送付済) / paid (入金済)
- `subtotalYen`: 税抜合計
- `taxYen`: 税額
- `totalYen`: 税込合計
- `notes`: 備考（任意）
- `bankAccount`: 振込先（任意）

### InvoiceItem (請求書明細)
- `invoiceId`: 請求書ID
- `description`: 明細名
- `quantity`: 数量
- `unitPriceYen`: 単価（円、整数）
- `amountYen`: 金額（数量×単価）
- `taxRate`: 税率 (0, 0.08, 0.1)

## 注意事項

- 金額はすべて整数（円）で扱います
- PDF生成はブラウザ上で行われます
- AIエージェントのアクションは必ずユーザー承認後に実行されます
- 開発環境ではSQLiteを使用しますが、本番環境ではPostgreSQLを推奨します

## 今後の拡張予定

- 認証・多テナント対応
- レポート機能
- データエクスポート（CSV/Excel）
- メール送信機能
- 請求書テンプレートのカスタマイズ

## ライセンス

MIT

