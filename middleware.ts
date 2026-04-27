import { NextRequest, NextResponse } from 'next/server'
import { verifyAccess } from '@/lib/jwt'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/refresh']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  const token = req.cookies.get('access_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  try {
    const payload = await verifyAccess(token)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/doctors/:path*', '/api/appointments/:path*'],
}

// updated
