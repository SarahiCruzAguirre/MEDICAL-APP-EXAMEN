import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function generateAppointmentPDF(data: {
  doctorName: string; specialty: string; patientName: string; date: string; contact: string
}) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([600, 480])
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  // Colores
  const black = rgb(0.035, 0.035, 0.035)       // zinc-950
  const darkCard = rgb(0.094, 0.094, 0.098)     // zinc-900
  const gold = rgb(0.918, 0.702, 0.031)         // yellow-500
  const white = rgb(1, 1, 1)
  const grayText = rgb(0.635, 0.635, 0.671)     // zinc-400
  const borderColor = rgb(0.157, 0.157, 0.169)  // zinc-800
  const goldDim = rgb(0.459, 0.351, 0.016)      // gold dim

  // Fondo completo negro
  page.drawRectangle({ x: 0, y: 0, width: 600, height: 480, color: black })

  // Header dorado
  page.drawRectangle({ x: 0, y: 400, width: 600, height: 80, color: gold })

  // Franja decorativa delgada bajo el header
  page.drawRectangle({ x: 0, y: 396, width: 600, height: 4, color: goldDim })

  // Textos del header
  page.drawText('HORUS BRASLET', { x: 40, y: 448, size: 20, font: bold, color: black })
  page.drawText('Confirmacion de Cita Medica', { x: 40, y: 420, size: 11, font: regular, color: rgb(0.1, 0.1, 0.1) })

  // Card central
  page.drawRectangle({ x: 30, y: 80, width: 540, height: 305, color: darkCard, borderColor, borderWidth: 1 })

  // Título dentro de la card
  page.drawText('Detalles de la Cita', { x: 50, y: 362, size: 13, font: bold, color: gold })
  page.drawLine({ start: { x: 50, y: 352 }, end: { x: 550, y: 352 }, thickness: 0.5, color: borderColor })

  // Campos
  const fields = [
    { label: 'Medico', value: data.doctorName },
    { label: 'Especialidad', value: data.specialty },
    { label: 'Paciente', value: data.patientName },
    { label: 'Fecha y hora', value: data.date },
    { label: 'Contacto', value: data.contact },
  ]

  fields.forEach((f, i) => {
    const y = 325 - i * 46
    page.drawText(f.label, { x: 50, y, size: 10, font: bold, color: grayText })
    page.drawText(f.value, { x: 50, y: y - 16, size: 12, font: regular, color: white })
    if (i < fields.length - 1) {
      page.drawLine({ start: { x: 50, y: y - 28 }, end: { x: 550, y: y - 28 }, thickness: 0.5, color: borderColor })
    }
  })

  // Badge de estado
  page.drawRectangle({ x: 50, y: 88, width: 100, height: 22, color: goldDim, borderColor: gold, borderWidth: 1 })
  page.drawText('PENDIENTE', { x: 62, y: 95, size: 9, font: bold, color: gold })

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 600, height: 75, color: darkCard })
  page.drawLine({ start: { x: 0, y: 75 }, end: { x: 600, y: 75 }, thickness: 0.5, color: borderColor })
  page.drawText('Este documento es su comprobante oficial de cita medica.', { x: 80, y: 46, size: 10, font: regular, color: grayText })
  page.drawText('Conserve este documento para presentarlo el dia de su cita.', { x: 75, y: 30, size: 10, font: regular, color: grayText })
  page.drawText(`Generado: ${new Date().toLocaleString('es-CO')}`, { x: 195, y: 10, size: 9, font: regular, color: rgb(0.3, 0.3, 0.3) })

  return doc.save()
}