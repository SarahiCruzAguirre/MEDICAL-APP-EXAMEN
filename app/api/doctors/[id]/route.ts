import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { name, specialty, experience, contact, available } = await req.json()
    const userId = req.headers.get('x-user-id') ?? undefined
    const ip = req.headers.get('x-user-ip') ?? undefined
    const doctor = await prisma.doctor.update({ where: { id }, data: { name, specialty, experience: Number(experience), contact, available } })
    await logAction({ action: 'UPDATE_DOCTOR', path: `/api/doctors/${id}`, userId, ip })
    return NextResponse.json(doctor)
  } catch (e) { return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id') ?? undefined
    const ip = req.headers.get('x-user-ip') ?? undefined
    await prisma.doctor.delete({ where: { id } })
    await logAction({ action: 'DELETE_DOCTOR', path: `/api/doctors/${id}`, userId, ip })
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 }) }
}
