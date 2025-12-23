import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '経理管理AIエージェント',
  description: '経理管理と請求書作成が可能なAIエージェント',
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
          <div className="container mx-auto flex gap-4">
            <Link href="/dashboard" className="hover:text-gray-300">ダッシュボード</Link>
            <Link href="/transactions" className="hover:text-gray-300">取引</Link>
            <Link href="/invoices" className="hover:text-gray-300">請求書</Link>
            <Link href="/clients" className="hover:text-gray-300">顧客</Link>
            <Link href="/agent" className="hover:text-gray-300">AIエージェント</Link>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}

