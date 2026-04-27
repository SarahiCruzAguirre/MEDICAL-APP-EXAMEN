import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccess, signRefresh } from '@/lib/jwt'
import { logAction } from '@/lib/logger'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!email || !password || !name) return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Mínimo 8 caracteres' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })
    const hashed = await bcrypt.hash(password, 10)
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'PATIENT'
    const user = await prisma.user.create({
      data: { email, password: hashed, role: userRole, patient: userRole === 'PATIENT' ? { create: { name } } : undefined }
    })
    const accessToken = await signAccess({ userId: user.id, role: user.role })
    const refreshToken = await signRefresh({ userId: user.id })
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } })
    await logAction({ action: 'REGISTER', path: '/api/auth/register', userId: user.id, ip })
    const res = NextResponse.json({ ok: true, role: user.role })
    res.cookies.set('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600 })
    res.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800 })
    return res
  } catch (e) { console.error('[REGISTER]', e); return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
