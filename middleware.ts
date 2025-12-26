import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証不要なパス
const publicPaths = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスの場合は認証チェックをスキップ
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // APIルートの認証チェックは各ルートで行う
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // セッションCookieをチェック
  const session = request.cookies.get('zentry_session')
  if (!session) {
    // ログインページにリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

