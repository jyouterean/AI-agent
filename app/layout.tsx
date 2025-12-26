import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '合同会社Zentry - 経理管理システム',
  description: '合同会社Zentryの経理管理と請求書作成システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <Link href="/dashboard" className="hover:text-gray-300">ダッシュボード</Link>
              <Link href="/transactions" className="hover:text-gray-300">取引</Link>
              <Link href="/invoices" className="hover:text-gray-300">請求書</Link>
              <Link href="/clients" className="hover:text-gray-300">顧客</Link>
              <Link href="/tasks" className="hover:text-gray-300">タスク</Link>
              <Link href="/agent" className="hover:text-gray-300">エージェント</Link>
              <Link href="/users" className="hover:text-gray-300">従業員管理</Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">合同会社Zentry</span>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm hover:text-gray-300">
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}

