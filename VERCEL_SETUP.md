# Vercel設定手順

## Root Directoryの設定方法

Vercelのダッシュボードで以下の手順で設定してください：

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard にアクセス
   - プロジェクト「ai-agent」を選択

2. **Settingsタブを開く**
   - プロジェクトページの上部にある「Settings」タブをクリック

3. **Generalセクションを開く**
   - 左側のメニューから「General」を選択

4. **Root Directoryを設定**
   - 「Root Directory」セクションを見つける
   - 「Edit」ボタンをクリック
   - 入力フィールドに `Zentry合同会社` と入力
   - 「Save」ボタンをクリック

5. **再デプロイ**
   - 設定を保存すると自動的に再デプロイが開始されます
   - または、「Deployments」タブから最新のデプロイメントを選択し、「Redeploy」をクリック

## 注意事項

- Root Directoryは `Zentry合同会社` に設定してください（日本語のフォルダ名）
- 設定後、ビルドログでNext.jsのバージョンが正しく検出されることを確認してください

