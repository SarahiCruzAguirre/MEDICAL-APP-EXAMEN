import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function generateAppointmentPDF(data: {
  doctorName: string; specialty: string; patientName: string; date: string; contact: string
}) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([600, 420])
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const blue = rgb(0.1, 0.35, 0.75)
  const gray = rgb(0.5, 0.5, 0.5)
  const dark = rgb(0.15, 0.15, 0.15)
  page.drawRectangle({ x: 0, y: 340, width: 600, height: 80, color: blue })
  page.drawText('MediCitas - Sistema Medico', { x: 40, y: 390, size: 18, font: bold, color: rgb(1,1,1) })
  page.drawText('Confirmacion de Cita Medica', { x: 40, y: 365, size: 12, font: regular, color: rgb(0.85,0.9,1) })
  page.drawLine({ start: { x: 40, y: 335 }, end: { x: 560, y: 335 }, thickness: 1, color: rgb(0.85,0.85,0.85) })
  const fields = [
    { label: 'Medico:', value: data.doctorName },
    { label: 'Especialidad:', value: data.specialty },
    { label: 'Paciente:', value: data.patientName },
    { label: 'Fecha y hora:', value: data.date },
    { label: 'Contacto:', value: data.contact },
  ]
  fields.forEach((f, i) => {
    const y = 300 - i * 42
    page.drawText(f.label, { x: 40, y, size: 12, font: bold, color: dark })
    page.drawText(f.value, { x: 200, y, size: 12, font: regular, color: dark })
    page.drawLine({ start: { x: 40, y: y-10 }, end: { x: 560, y: y-10 }, thickness: 0.5, color: rgb(0.92,0.92,0.92) })
  })
  page.drawRectangle({ x: 0, y: 0, width: 600, height: 50, color: rgb(0.97,0.97,0.97) })
  page.drawText('Este documento es su comprobante oficial de cita medica.', { x: 90, y: 22, size: 10, font: regular, color: gray })
  page.drawText(`Generado: ${new Date().toLocaleString("es-CO")}`, { x: 195, y: 8, size: 9, font: regular, color: gray })
  return doc.save()
}
