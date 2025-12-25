'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-red-600 mb-4">エラー</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">予期しないエラーが発生しました</h2>
      <p className="text-gray-500 mb-4">{error.message || '不明なエラーが発生しました'}</p>
      {error.digest && (
        <p className="text-sm text-gray-400 mb-8">エラーID: {error.digest}</p>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          再試行
        </button>
        <Link
          href="/dashboard"
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}

