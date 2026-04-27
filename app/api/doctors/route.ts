import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(doctors)
  } catch (e) { return NextResponse.json({ error: 'Error al obtener médicos' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { name, specialty, experience, contact } = await req.json()
    const userId = req.headers.get('x-user-id') ?? undefined
    const ip = req.headers.get('x-user-ip') ?? undefined
    if (!name || !specialty || !experience || !contact)
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    const doctor = await prisma.doctor.create({ data: { name, specialty, experience: Number(experience), contact } })
    await logAction({ action: 'CREATE_DOCTOR', path: '/api/doctors', userId, ip })
    return NextResponse.json(doctor, { status: 201 })
  } catch (e) { return NextResponse.json({ error: 'Error al crear médico' }, { status: 500 }) }
}
