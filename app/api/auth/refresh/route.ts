import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccess, verifyRefresh } from '@/lib/jwt'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('refresh_token')?.value
  const redirectTo = req.nextUrl.searchParams.get('redirect') ?? '/dashboard/appointments'
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  try {
    const payload = await verifyRefresh(token)
    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored) return NextResponse.redirect(new URL('/login', req.url))
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.redirect(new URL('/login', req.url))
    const newAccess = await signAccess({ userId: user.id, role: user.role })
    const res = NextResponse.redirect(new URL(redirectTo, req.url))
    res.cookies.set('access_token', newAccess, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600 })
    return res
  } catch { return NextResponse.redirect(new URL('/login', req.url)) }
}
