'use client'

// client side - this component runs in the browser
import { useEffect, useState } from 'react' // hook for local state management
import { useRouter } from 'next/navigation' // hook of next for navigation between pages
import FullCalendar from '@fullcalendar/react' // fullcalendar component
import dayGridPlugin from '@fullcalendar/daygrid' // plugin for month view
import timeGridPlugin from '@fullcalendar/timegrid' // plugin for week and day view
import interactionPlugin from '@fullcalendar/interaction' // plugin for click interaction

// define the shape of the objects that the API returns
type Doctor = { id: string; name: string; specialty: string; experience: number; contact: string; available: boolean }
type Appointment = { id: string; date: string; status: string; doctor: Doctor; patient: { name: string } }

// main page of the appointments where we can see the doctors, the form to book
// and the calendar with the appointments, also we can download the pdf and logout
export default function AppointmentsPage() {
  const router = useRouter()

  // list of all available doctors for the select
  const [doctors, setDoctors] = useState<Doctor[]>([])
  // list of appointments of the logged patient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  // id of the selected doctor in the form
  const [selectedDoctor, setSelectedDoctor] = useState('')
  // date and time chosen for the appointment
  const [selectedDate, setSelectedDate] = useState('')
  // controls the spinner of the book button
  const [loading, setLoading] = useState(false)
  // indicates if the data is loading when the page opens
  const [fetchLoading, setFetchLoading] = useState(true)
  // error message from the form or the API
  const [error, setError] = useState('')
  // success message after booking
  const [success, setSuccess] = useState('')
  // controls if the calendar or the list is shown
  const [activeTab, setActiveTab] = useState<'calendar'|'list'>('calendar')

  // fetch doctors and appointments at the same time using Promise.all
  async function fetchData() {
    setFetchLoading(true)
    const [docRes, appRes] = await Promise.all([fetch('/api/doctors'), fetch('/api/appointments')])
    setDoctors(await docRes.json()); setAppointments(await appRes.json())
    setFetchLoading(false)
  }

  // runs just once when the component mounts in the DOM
  useEffect(() => { fetchData() }, [])

  // happens when the user clicks on "Agendar Cita"
  // validates the form and sends the data to the API
  async function handleBook() {
    // validate that a doctor is selected
    if (!selectedDoctor) { setError('Selecciona un médico'); return }
    // validate that a date is selected
    if (!selectedDate) { setError('Selecciona una fecha y hora'); return }
    // validate and compare the date - must be in the future
    if (new Date(selectedDate) < new Date()) { setError('La fecha debe ser futura'); return }

    // clean the last messages before making the fetch
    setLoading(true); setError(''); setSuccess('')

    // send the doctor id and date to the backend
    // the API verifies availability and creates the appointment in the database
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctor, date: selectedDate })
    })
    const data = await res.json()
    setLoading(false)

    // if the API returns an error show it and stop
    if (!res.ok) { setError(data.error); return }
    setSuccess('¡Cita agendada! Descargando comprobante...')

    // clean the form after creating the appointment
    setSelectedDoctor(''); setSelectedDate('')

    // reload the data and download the PDF with the appointment info
    fetchData(); await handleDownloadPDF(data)
  }

  // makes a fetch to the PDF endpoint and triggers the download in the browser
  async function handleDownloadPDF(appointment: Appointment) {
    try {
      // call the PDF generation endpoint with the appointment data
      const res = await fetch('/api/appointments/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: appointment.doctor.name, specialty: appointment.doctor.specialty,
          contact: appointment.doctor.contact,
          // format the date to readable spanish format
          date: new Date(appointment.date).toLocaleString('es-CO', { weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit' })
        })
      })
      // convert the response to a binary blob (PDF file)
      const blob = await res.blob()
      // create a temporary URL in memory pointing to the PDF
      const url = URL.createObjectURL(blob)
      // create an invisible link element and click it to trigger the download
      const a = document.createElement('a'); a.href = url
      a.download = `cita-${appointment.doctor.name.replace(' ','-')}.pdf`
      a.click()
      // release the memory after the download
      URL.revokeObjectURL(url)
    } catch { console.error('Error PDF') }
  }

  // logs out the user by calling the logout endpoint which deletes the cookies
  async function handleLogout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

  // transform appointments to FullCalendar event format
  // color depends on the status of the appointment
  const calendarEvents = appointments.map(app => ({
    id: app.id, title: `Dr. ${app.doctor.name}`, start: app.date,
    backgroundColor: app.status==='CONFIRMED'?'#16a34a':app.status==='CANCELLED'?'#dc2626':'#2563eb',
    borderColor: 'transparent'
  }))

  // find the full doctor object of the selected doctor to show the info card
  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor)

  // visual interface of the appointments page
  return (
    <div className="min-h-screen bg-slate-50">
      {/* sticky navbar with logo, navigation and logout button */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white">
              <img src="/logos/horus.webp" alt="logo" className="w-full h-full object-contain" />
            </div>
            <div><span className="font-bold text-white">Horus Braslet</span><span className="text-zinc-500 text-sm ml-2">/ Mis Citas</span></div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard/doctors" className="text-sm text-zinc-400 hover:text-yellow-400 font-medium transition">Médicos</a>
            <button onClick={handleLogout} className="btn-danger text-sm py-1.5 px-3">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Mis Citas Médicas</h1>
          <p className="text-zinc-400 mt-1">Agenda y gestiona tus citas con nuestros especialistas</p>
        </div>

        {/* main grid - left column for booking form, right for calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left column - booking form and available doctors list */}
          <div className="lg:col-span-1 space-y-5">
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-5">Agendar Cita</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Médico</label>
                  {/* only shows available doctors in the select */}
                  <select className="input-field" value={selectedDoctor} onChange={e => { setSelectedDoctor(e.target.value); setError('') }}>
                    <option value="">Seleccionar médico</option>
                    {doctors.filter(d => d.available).map(doc => <option key={doc.id} value={doc.id}>{doc.name} — {doc.specialty}</option>)}
                  </select>
                </div>

                {/* shows doctor info card when a doctor is selected */}
                {selectedDoctorInfo && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-yellow-400">{selectedDoctorInfo.name}</p>
                    <p className="text-zinc-300">{selectedDoctorInfo.specialty}</p>
                    <p className="text-zinc-500 text-xs mt-1">{selectedDoctorInfo.experience} años · {selectedDoctorInfo.contact}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Fecha y hora</label>
                  {/* min prevents selecting past dates */}
                  <input type="datetime-local" className="input-field" value={selectedDate}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => { setSelectedDate(e.target.value); setError('') }} />
                </div>

                {/* error and success messages */}
                {error && <div className="bg-red-950 border border-red-800 rounded-xl p-3"><p className="text-red-300 text-sm">⚠️ {error}</p></div>}
                {success && <div className="bg-green-950 border border-green-800 rounded-xl p-3"><p className="text-green-300 text-sm">✅ {success}</p></div>}

                {/* book button - disabled while loading */}
                <button onClick={handleBook} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Agendando...</>) : 'Agendar Cita'}
                </button>
              </div>
            </div>

            {/* clickable list of available doctors - clicking selects the doctor in the form */}
            <div className="card">
              <h2 className="text-base font-bold text-white mb-4">Médicos Disponibles</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {doctors.filter(d => d.available).length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No hay médicos disponibles</p>
                ) : doctors.filter(d => d.available).map(doc => (
                  <div key={doc.id} onClick={() => setSelectedDoctor(doc.id)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${selectedDoctor===doc.id?'border-yellow-500 bg-yellow-500/10':'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'}`}>
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
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab===tab?'bg-yellow-500 text-black':'text-zinc-400 hover:bg-zinc-800'}`}>
                    {tab==='calendar'?'Calendario':'Lista'}
                  </button>
                ))}
              </div>

              {/* calendar view - shows all appointments as colored events */}
              {activeTab==='calendar' ? (
                <FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]} initialView="dayGridMonth"
                  headerToolbar={{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,timeGridDay' }}
                  events={calendarEvents} locale="es" height="auto"
                  buttonText={{ today:'Hoy', month:'Mes', week:'Semana', day:'Día' }} />
              ) : (
                // list view - shows appointments as cards with status and PDF button
                <div className="space-y-3">
                  {fetchLoading ? <p className="text-center text-zinc-500 py-8">Cargando citas...</p>
                  : appointments.length===0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <p className="font-medium">No tienes citas agendadas</p>
                      <p className="text-sm mt-1">Agenda tu primera cita con el formulario</p>
                    </div>
                  ) : appointments.map(app => (
                    <div key={app.id} className="border border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:border-zinc-600 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center text-lg">👨‍⚕️</div>
                        <div>
                          <p className="font-bold text-white">Dr. {app.doctor.name}</p>
                          <p className="text-yellow-400 text-sm">{app.doctor.specialty}</p>
                          {/* format date to readable spanish format */}
                          <p className="text-zinc-500 text-xs mt-0.5">{new Date(app.date).toLocaleString('es-CO',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* status badge - color depends on appointment status */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${app.status==='CONFIRMED'?'bg-green-500/10 text-green-400 border border-green-500/20':app.status==='CANCELLED'?'bg-red-500/10 text-red-400 border border-red-500/20':'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                          {app.status==='CONFIRMED'?'Confirmada':app.status==='CANCELLED'?'Cancelada':'Pendiente'}
                        </span>
                        {/* button to download the PDF of this appointment */}
                        <button onClick={() => handleDownloadPDF(app)}
                          className="text-xs px-3 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 font-medium transition">
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* stats cards - total, confirmed and pending appointments */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total', value:appointments.length, color:'text-yellow-400', bg:'bg-yellow-500/10 border border-yellow-500/20' },
                { label:'Confirmadas', value:appointments.filter(a=>a.status==='CONFIRMED').length, color:'text-green-400', bg:'bg-green-500/10 border border-green-500/20' },
                { label:'Pendientes', value:appointments.filter(a=>a.status==='PENDING').length, color:'text-zinc-300', bg:'bg-zinc-800 border border-zinc-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-6 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-zinc-500 text-xs mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}