import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login?redirect=' + pathname, req.url))
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?redirect=' + pathname, req.url))
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/registrati')) && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/login', '/auth/registrati'],
}
