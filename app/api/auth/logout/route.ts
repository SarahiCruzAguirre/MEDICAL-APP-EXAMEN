export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('refresh_token')?.value
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (token) await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => null)
  await logAction({ action: 'LOGOUT', path: '/api/auth/logout', ip })
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('access_token')
  res.cookies.delete('refresh_token')
  return res
}

