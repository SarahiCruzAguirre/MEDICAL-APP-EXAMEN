import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { generateAppointmentPDF } from '@/lib/pdf'
import { prisma } from '@/lib/prisma'

// POST /api/appointments/pdf
// generates and returns a PDF file with the appointment confirmation
export async function POST(req: NextRequest) {
  try {
    // get the user id injected by the middleware from the JWT token
    const userId = req.headers.get('x-user-id')

    // if no user id, the request is not authenticated
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // extract the appointment data sent from the frontend
    const { doctorName, specialty, contact, date } = await req.json()

    // find the patient in the database using the user id
    // needed to get the patient name for the PDF
    const patient = await prisma.patient.findUnique({ where: { userId } })

    // generate the PDF bytes using the pdf-lib function
    // if patient is not found, use 'Paciente' as default name
    const pdfBytes = await generateAppointmentPDF({
      doctorName,
      specialty,
      contact,
      date,
      patientName: patient?.name ?? 'Paciente'
    })

    // return the PDF as a binary HTTP response
    // Content-Type tells the browser it is a PDF file
    // Content-Disposition tells the browser to download it with that filename
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cita-medica.pdf"'
      }
    })

  } catch (e) {
    // if something fails during generation return a 500 error
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}