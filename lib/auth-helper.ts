// 認証チェックを一時的に無効化するためのヘルパー
// 開発用：本番環境では true に設定してください
export const AUTH_ENABLED = true

// 認証チェックをスキップするかどうか
export function shouldSkipAuth(): boolean {
  return !AUTH_ENABLED
}

