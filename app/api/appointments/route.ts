import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const patient = await prisma.patient.findUnique({ where: { userId } })
    if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id }, include: { doctor: true, patient: true }, orderBy: { date: 'asc' }
    })
    return NextResponse.json(appointments)
  } catch (e) { return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    const ip = req.headers.get('x-user-ip') ?? undefined
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { doctorId, date } = await req.json()
    if (!doctorId || !date) return NextResponse.json({ error: 'Médico y fecha requeridos' }, { status: 400 })
    const patient = await prisma.patient.findUnique({ where: { userId } })
    if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    const conflict = await prisma.appointment.findFirst({ where: { doctorId, date: new Date(date), status: { not: 'CANCELLED' } } })
    if (conflict) return NextResponse.json({ error: 'Horario no disponible, elige otro' }, { status: 409 })
    const appointment = await prisma.appointment.create({
      data: { doctorId, patientId: patient.id, date: new Date(date) },
      include: { doctor: true, patient: true }
    })
    await logAction({ action: 'CREATE_APPOINTMENT', path: '/api/appointments', userId, ip })
    return NextResponse.json(appointment, { status: 201 })
  } catch (e) { return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 }) }
}
