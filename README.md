# 経理管理と請求書作成が可能なAIエージェント

経理管理と請求書作成を支援するWebアプリケーションです。AIエージェントが自然言語で指示を受け、取引登録や請求書作成を補助します。

## 機能

- **取引管理**: 売上/支出の登録・一覧・編集・削除（CRUD）
- **請求書作成**: 顧客情報、明細行の追加、税率設定、PDF出力
- **ダッシュボード**: 今月の売上、支出、粗利、未回収額を表示
- **タスク管理**: Notion APIを使用したタスクの作成・管理（ステータス、優先度、期限、タグ対応）
- **AIエージェント**: 自然言語で指示を受け、取引登録や請求書作成を補助（承認フロー付き）

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS
- **データベース**: SQLite (開発) / PostgreSQL (本番想定)
- **ORM**: Prisma
- **PDF生成**: @react-pdf/renderer
- **AI**: OpenAI API (GPT-4)
- **タスク管理**: Notion API
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
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COMPANY_NAME="会社名"
COMPANY_ADDRESS="住所"
COMPANY_EMAIL="メールアドレス"
COMPANY_INVOICE_REG_NO="適格請求書発行事業者番号"
COMPANY_DEFAULT_TAX_RATE="0.1"
COMPANY_DEFAULT_PAYMENT_TERM_DAYS="30"

# Notion AI統合（オプション）
NOTION_API_KEY="secret_..."
NOTION_DATABASE_ID="..."
NOTION_TASKS_DATABASE_ID="..."  # タスク管理用データベースID
```

**注意**: 
- `OPENAI_API_KEY`は実際のAPIキーに置き換えてください
- Notion AI統合を使用する場合は、`NOTION_API_KEY`と`NOTION_DATABASE_ID`を設定してください
- `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません

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
│   │   ├── tasks/        # タスク管理API
│   │   └── agent/        # AIエージェントAPI
│   ├── dashboard/        # ダッシュボード
│   ├── transactions/     # 取引管理
│   ├── invoices/         # 請求書管理
│   ├── tasks/            # タスク管理
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

### タスク管理

1. `/tasks` にアクセス
2. 「新規作成」ボタンをクリック
3. タイトル、説明、ステータス、優先度、期限、タグを設定
4. タスク一覧でステータスや優先度でフィルタリング可能
5. 各タスクからNotionページに直接アクセス可能

**注意**: タスク管理を使用するには、Notionでタスク管理用のデータベースを作成し、以下のプロパティを設定してください：
- `Title` (タイトル) - Title型
- `Description` (説明) - Rich Text型
- `Status` (ステータス) - Select型（not_started, in_progress, completed, on_hold）
- `Priority` (優先度) - Select型（low, medium, high, urgent）
- `Due Date` (期限) - Date型
- `Tags` (タグ) - Multi-select型

### AIエージェントの使用

1. `/agent` にアクセス
2. AIプロバイダーを選択（OpenAI / Notion API / Hybrid）
3. 自然言語で指示を入力
   - 例: 「12/20にガソリン代 6500円、支出で登録して」
   - 例: 「A社に11月分の請求書作って。単価2万円×5日、消費税10%」
   - 例: 「この取引をNotionに保存して」（Notion API統合時）
4. AIが提案したアクションを確認
5. 「承認して実行」ボタンで確定

#### AIプロバイダーの選択

- **OpenAI**: GPT-4を使用した高精度なAI処理
- **Notion API**: Notionデータベースへの保存・検索に特化
- **Hybrid**: OpenAIの言語理解能力とNotion APIのデータ管理機能を組み合わせ（推奨）

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
- Notion AI統合を使用する場合は、Notion APIキーとデータベースIDが必要です
- Hybridモードは、OpenAI APIキーとNotion APIキーの両方が必要です

## Notion AI統合について

このアプリケーションは、Notion AIを組み込むことで、エージェントの汎用性を高めています。

### 主な機能

1. **Notionへの自動保存**: 取引、請求書、顧客情報をNotionデータベースに自動保存
2. **Notionからの検索**: 過去の取引や請求書情報をNotionから検索
3. **ハイブリッドモード**: OpenAIの強力な言語理解能力とNotion APIのデータ管理機能を組み合わせ

### セットアップ

1. Notionでインテグレーションを作成し、APIキーを取得
2. データベースを作成し、データベースIDを取得
3. 環境変数に`NOTION_API_KEY`と`NOTION_DATABASE_ID`を設定
4. AIエージェントページで「Hybrid」モードを選択

### 使用例

- 「この取引をNotionに保存して」
- 「先月の請求書をNotionから検索して」
- 「Notionに保存されている顧客情報を確認して」

## 今後の拡張予定

- 認証・多テナント対応
- レポート機能
- データエクスポート（CSV/Excel）
- メール送信機能
- 請求書テンプレートのカスタマイズ
- より高度なNotion AI統合機能

## ライセンス

MIT

