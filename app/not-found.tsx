import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">ページが見つかりません</h2>
      <p className="text-gray-500 mb-8">お探しのページは存在しないか、移動された可能性があります。</p>
      <Link
        href="/dashboard"
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        ダッシュボードに戻る
      </Link>
    </div>
  )
}

