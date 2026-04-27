'use client'
// runs in the browser - required because it uses state and user events

import { useEffect, useState } from 'react'
// useEffect - runs code when the component mounts
// useState - manages local state for form, doctors, appointments, etc.

import { useRouter } from 'next/navigation'
// used to redirect to login after logout

import FullCalendar from '@fullcalendar/react'
// main calendar component
import dayGridPlugin from '@fullcalendar/daygrid'
// adds the month grid view
import timeGridPlugin from '@fullcalendar/timegrid'
// adds the week and day views with hours
import interactionPlugin from '@fullcalendar/interaction'
// allows clicking on calendar days

// defines the shape of the doctor object returned by the API
type Doctor = { id: string; name: string; specialty: string; experience: number; contact: string; available: boolean }

// defines the shape of the appointment object returned by the API
// includes the nested doctor object because Prisma uses include: { doctor: true }
type Appointment = { id: string; date: string; status: string; doctor: Doctor; patient: { name: string } }

export default function AppointmentsPage() {
  const router = useRouter()

  // list of all doctors fetched from the API
  const [doctors, setDoctors] = useState<Doctor[]>([])
  // list of appointments of the logged patient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  // id of the doctor selected in the booking form
  const [selectedDoctor, setSelectedDoctor] = useState('')
  // date and time selected for the appointment
  const [selectedDate, setSelectedDate] = useState('')
  // controls the spinner on the book button
  const [loading, setLoading] = useState(false)
  // true while the initial data is loading
  const [fetchLoading, setFetchLoading] = useState(true)
  // error message from validation or the API
  const [error, setError] = useState('')
  // success message shown after booking
  const [success, setSuccess] = useState('')
  // controls which tab is active - calendar or list
  const [activeTab, setActiveTab] = useState<'calendar'|'list'>('calendar')

  // fetches doctors and appointments in parallel using Promise.all
  // faster than fetching one after the other
  async function fetchData() {
    setFetchLoading(true)
    const [docRes, appRes] = await Promise.all([fetch('/api/doctors'), fetch('/api/appointments')])
    setDoctors(await docRes.json())
    setAppointments(await appRes.json())
    setFetchLoading(false)
  }

  // runs only once when the component mounts in the DOM
  // empty array [] means no dependencies - won't re-run on state changes
  useEffect(() => { fetchData() }, [])

  // handles the booking form submission
  async function handleBook() {
    // validate that a doctor is selected
    if (!selectedDoctor) { setError('Selecciona un médico'); return }
    // validate that a date is selected
    if (!selectedDate) { setError('Selecciona una fecha y hora'); return }
    // validate that the selected date is in the future
    if (new Date(selectedDate) < new Date()) { setError('La fecha debe ser futura'); return }

    // activate loading and clear previous messages
    setLoading(true); setError(''); setSuccess('')

    // send the doctor id and date to the API
    // the API checks availability and creates the appointment in the database
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctor, date: selectedDate })
    })
    const data = await res.json()
    setLoading(false)

    // if the API returns an error (e.g. slot already taken) show it and stop
    if (!res.ok) { setError(data.error); return }

    // show success message
    setSuccess('¡Cita agendada! Descargando comprobante...')

    // reset the form fields
    setSelectedDoctor(''); setSelectedDate('')

    // reload the data to update the calendar and download the PDF
    fetchData(); await handleDownloadPDF(data)
  }

  // calls the PDF endpoint and triggers the file download in the browser
  async function handleDownloadPDF(appointment: Appointment) {
    try {
      // send appointment data to the PDF generation endpoint
      const res = await fetch('/api/appointments/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: appointment.doctor.name,
          specialty: appointment.doctor.specialty,
          contact: appointment.doctor.contact,
          // format the date to readable spanish before sending
          date: new Date(appointment.date).toLocaleString('es-CO', {
            weekday:'long', year:'numeric', month:'long',
            day:'numeric', hour:'2-digit', minute:'2-digit'
          })
        })
      })

      // convert the response to a binary blob (the PDF file)
      const blob = await res.blob()

      // create a temporary URL in browser memory pointing to the PDF
      const url = URL.createObjectURL(blob)

      // create an invisible link element and simulate a click to download
      const a = document.createElement('a'); a.href = url
      a.download = `cita-${appointment.doctor.name.replace(' ','-')}.pdf`
      a.click()

      // release the temporary URL from browser memory
      URL.revokeObjectURL(url)
    } catch { console.error('Error PDF') }
  }

  // calls the logout endpoint which deletes the cookies and redirects to login
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // transforms appointments into the format FullCalendar expects
  // each appointment becomes an event with title, date and color based on status
  const calendarEvents = appointments.map(app => ({
    id: app.id,
    title: `Dr. ${app.doctor.name}`,
    start: app.date,
    // color depends on the appointment status
    backgroundColor: app.status==='CONFIRMED'?'#16a34a':app.status==='CANCELLED'?'#dc2626':'#2563eb',
    borderColor: 'transparent'
  }))

  // finds the full doctor object of the selected doctor
  // used to show the doctor info card below the select
  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor)

  return (
    // main container with full dark background
    <div className="min-h-screen bg-zinc-950">

      {/* sticky navbar with logo, navigation link and logout button */}
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* company logo */}
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white">
              <img src="/logos/horus.webp" alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-white">Horus Braslet</span>
              <span className="text-zinc-500 text-sm ml-2">/ Mis Citas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* link to the doctors dashboard */}
            <a href="/dashboard/doctors" className="text-sm text-zinc-400 hover:text-yellow-400 font-medium transition">Médicos</a>
            {/* logout button */}
            <button onClick={handleLogout} className="btn-danger text-sm py-1.5 px-3">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Mis Citas Médicas</h1>
          <p className="text-zinc-400 mt-1">Agenda y gestiona tus citas con nuestros especialistas</p>
        </div>

        {/* main grid - 1 column on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left column - booking form and available doctors */}
          <div className="lg:col-span-1 space-y-5">

            {/* booking form card */}
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-5">📅 Agendar Cita</h2>
              <div className="space-y-4">

                {/* doctor selector - only shows available doctors */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Médico</label>
                  <select className="input-field" value={selectedDoctor} onChange={e => { setSelectedDoctor(e.target.value); setError('') }}>
                    <option value="">Seleccionar médico</option>
                    {doctors.filter(d => d.available).map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} — {doc.specialty}</option>
                    ))}
                  </select>
                </div>

                {/* doctor info card - only shows when a doctor is selected */}
                {selectedDoctorInfo && (
                  <div className="bg-zinc-800 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-blue-800">{selectedDoctorInfo.name}</p>
                    <p className="text-yellow-400">{selectedDoctorInfo.specialty}</p>
                    <p className="text-blue-500 text-xs mt-1">
                      📅 {selectedDoctorInfo.experience} años · 📞 {selectedDoctorInfo.contact}
                    </p>
                  </div>
                )}

                {/* date and time picker - min prevents selecting past dates */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha y hora</label>
                  <input type="datetime-local" className="input-field" value={selectedDate}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => { setSelectedDate(e.target.value); setError('') }} />
                </div>

                {/* error message from validation or API */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-700 text-sm">⚠️ {error}</p>
                  </div>
                )}

                {/* success message after booking */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-green-700 text-sm">✅ {success}</p>
                  </div>
                )}

                {/* book button - shows spinner while loading */}
                <button onClick={handleBook} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Agendando...
                    </>
                  ) : 'Agendar Cita'}
                </button>
              </div>
            </div>

            {/* available doctors list - clicking a card selects that doctor in the form */}
            <div className="card">
              <h2 className="text-base font-bold text-white mb-4">👨‍⚕️ Médicos Disponibles</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {doctors.filter(d => d.available).length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No hay médicos disponibles</p>
                ) : doctors.filter(d => d.available).map(doc => (
                  // clicking a doctor card sets it as selected in the form
                  <div key={doc.id} onClick={() => setSelectedDoctor(doc.id)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${
                      selectedDoctor===doc.id
                        ? 'border-blue-400 bg-zinc-800'
                        : 'border-zinc-700 hover:border-blue-200 hover:bg-zinc-950'
                    }`}>
                    <p className="font-semibold text-white text-sm">{doc.name}</p>
                    <p className="text-yellow-400 text-xs">{doc.specialty}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{doc.experience} años exp.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right column - calendar and appointments list */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">

              {/* tabs to switch between calendar and list view */}
              <div className="flex items-center gap-2 mb-5">
                {(['calendar','list'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      activeTab===tab ? 'bg-yellow-500 text-white' : 'text-zinc-400 hover:bg-slate-100'
                    }`}>
                    {tab==='calendar' ? '📅 Calendario' : '📋 Lista'}
                  </button>
                ))}
              </div>

              {/* calendar view - appointments shown as colored events */}
              {activeTab==='calendar' ? (
                <FullCalendar
                  plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,timeGridDay' }}
                  events={calendarEvents}
                  locale="es"
                  height="auto"
                  buttonText={{ today:'Hoy', month:'Mes', week:'Semana', day:'Día' }}
                />
              ) : (
                // list view - appointments shown as cards with status badge and PDF button
                <div className="space-y-3">
                  {fetchLoading ? (
                    <p className="text-center text-zinc-500 py-8">Cargando citas...</p>
                  ) : appointments.length===0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="font-medium">No tienes citas agendadas</p>
                      <p className="text-sm mt-1">Agenda tu primera cita con el formulario</p>
                    </div>
                  ) : appointments.map(app => (
                    <div key={app.id} className="border border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-lg">👨‍⚕️</div>
                        <div>
                          <p className="font-bold text-white">Dr. {app.doctor.name}</p>
                          <p className="text-yellow-400 text-sm">{app.doctor.specialty}</p>
                          {/* format date to readable spanish format */}
                          <p className="text-zinc-500 text-xs mt-0.5">
                            {new Date(app.date).toLocaleString('es-CO',{
                              weekday:'short', day:'numeric', month:'short',
                              year:'numeric', hour:'2-digit', minute:'2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* status badge - color changes based on appointment status */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          app.status==='CONFIRMED' ? 'bg-green-100 text-green-700' :
                          app.status==='CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-zinc-800 text-blue-700'
                        }`}>
                          {app.status==='CONFIRMED' ? '✓ Confirmada' :
                           app.status==='CANCELLED' ? '✗ Cancelada' : '⏳ Pendiente'}
                        </span>
                        {/* button to download the PDF of this specific appointment */}
                        <button onClick={() => handleDownloadPDF(app)}
                          className="text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-zinc-950 font-medium transition flex items-center gap-1">
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* stats cards showing total, confirmed and pending appointments */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total', value:appointments.length, color:'text-yellow-400', bg:'bg-zinc-800' },
                { label:'Confirmadas', value:appointments.filter(a=>a.status==='CONFIRMED').length, color:'text-green-600', bg:'bg-green-50' },
                { label:'Pendientes', value:appointments.filter(a=>a.status==='PENDING').length, color:'text-orange-600', bg:'bg-orange-50' },
              ].map(s => (
                <div key={s.label} className={`card ${s.bg} text-center`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-600 text-xs mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}