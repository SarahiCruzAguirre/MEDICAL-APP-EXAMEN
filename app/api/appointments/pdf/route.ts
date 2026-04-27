import { NextRequest, NextResponse } from 'next/server'
import { generateAppointmentPDF } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { doctorName, specialty, contact, date } = await req.json()
    const patient = await prisma.patient.findUnique({ where: { userId } })
    const pdfBytes = await generateAppointmentPDF({ doctorName, specialty, contact, date, patientName: patient?.name ?? 'Paciente' })
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="cita-medica.pdf"' }
    })
  } catch (e) { return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 }) }
}
