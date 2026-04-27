import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccess, signRefresh } from '@/lib/jwt'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password)))
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    const accessToken = await signAccess({ userId: user.id, role: user.role })
    const refreshToken = await signRefresh({ userId: user.id })
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } })
    await logAction({ action: 'LOGIN', path: '/api/auth/login', userId: user.id, ip })
    const res = NextResponse.json({ ok: true, role: user.role })
    res.cookies.set('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600 })
    res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800 })
    return res
  } catch (e) { console.error('[LOGIN]', e); return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
