'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

type Doctor = { id: string; name: string; specialty: string; experience: number; contact: string; available: boolean }
type Appointment = { id: string; date: string; status: string; doctor: Doctor; patient: { name: string } }

export default function AppointmentsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'calendar'|'list'>('calendar')

  async function fetchData() {
    setFetchLoading(true)
    const [docRes, appRes] = await Promise.all([fetch('/api/doctors'), fetch('/api/appointments')])
    setDoctors(await docRes.json()); setAppointments(await appRes.json())
    setFetchLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  async function handleBook() {
    if (!selectedDoctor) { setError('Selecciona un médico'); return }
    if (!selectedDate) { setError('Selecciona una fecha y hora'); return }
    if (new Date(selectedDate) < new Date()) { setError('La fecha debe ser futura'); return }
    setLoading(true); setError(''); setSuccess('')
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctor, date: selectedDate })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess('¡Cita agendada! Descargando comprobante...')
    setSelectedDoctor(''); setSelectedDate('')
    fetchData(); await handleDownloadPDF(data)
  }

  async function handleDownloadPDF(appointment: Appointment) {
    try {
      const res = await fetch('/api/appointments/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: appointment.doctor.name, specialty: appointment.doctor.specialty,
          contact: appointment.doctor.contact,
          date: new Date(appointment.date).toLocaleString('es-CO', { weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit' })
        })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `cita-${appointment.doctor.name.replace(' ','-')}.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch { console.error('Error PDF') }
  }

  async function handleLogout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

  const calendarEvents = appointments.map(app => ({
    id: app.id, title: `Dr. ${app.doctor.name}`, start: app.date,
    backgroundColor: app.status==='CONFIRMED'?'#16a34a':app.status==='CANCELLED'?'#dc2626':'#2563eb',
    borderColor: 'transparent'
  }))
  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg">🏥</div>
            <div><span className="font-bold text-slate-800">MediCitas</span><span className="text-slate-400 text-sm ml-2">/ Mis Citas</span></div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard/doctors" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition">Médicos</a>
            <button onClick={handleLogout} className="btn-danger text-sm py-1.5 px-3">Cerrar sesión</button>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Mis Citas Médicas</h1>
          <p className="text-slate-500 mt-1">Agenda y gestiona tus citas con nuestros especialistas</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <div className="card">
              <h2 className="text-lg font-bold text-slate-800 mb-5">📅 Agendar Cita</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Médico</label>
                  <select className="input-field" value={selectedDoctor} onChange={e => { setSelectedDoctor(e.target.value); setError('') }}>
                    <option value="">Seleccionar médico</option>
                    {doctors.filter(d => d.available).map(doc => <option key={doc.id} value={doc.id}>{doc.name} — {doc.specialty}</option>)}
                  </select>
                </div>
                {selectedDoctorInfo && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-blue-800">{selectedDoctorInfo.name}</p>
                    <p className="text-blue-600">{selectedDoctorInfo.specialty}</p>
                    <p className="text-blue-500 text-xs mt-1">📅 {selectedDoctorInfo.experience} años · 📞 {selectedDoctorInfo.contact}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha y hora</label>
                  <input type="datetime-local" className="input-field" value={selectedDate}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => { setSelectedDate(e.target.value); setError('') }} />
                </div>
                {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-700 text-sm">⚠️ {error}</p></div>}
                {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-green-700 text-sm">✅ {success}</p></div>}
                <button onClick={handleBook} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Agendando...</>) : 'Agendar Cita'}
                </button>
              </div>
            </div>
            <div className="card">
              <h2 className="text-base font-bold text-slate-800 mb-4">👨‍⚕️ Médicos Disponibles</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {doctors.filter(d => d.available).length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No hay médicos disponibles</p>
                ) : doctors.filter(d => d.available).map(doc => (
                  <div key={doc.id} onClick={() => setSelectedDoctor(doc.id)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${selectedDoctor===doc.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                    <p className="font-semibold text-slate-800 text-sm">{doc.name}</p>
                    <p className="text-blue-600 text-xs">{doc.specialty}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{doc.experience} años exp.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                {(['calendar','list'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab===tab?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-100'}`}>
                    {tab==='calendar'?'📅 Calendario':'📋 Lista'}
                  </button>
                ))}
              </div>
              {activeTab==='calendar' ? (
                <FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]} initialView="dayGridMonth"
                  headerToolbar={{ left:'prev,next today', center:'title', right:'dayGridMonth,timeGridWeek,timeGridDay' }}
                  events={calendarEvents} locale="es" height="auto"
                  buttonText={{ today:'Hoy', month:'Mes', week:'Semana', day:'Día' }} />
              ) : (
                <div className="space-y-3">
                  {fetchLoading ? <p className="text-center text-slate-400 py-8">Cargando citas...</p>
                  : appointments.length===0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="font-medium">No tienes citas agendadas</p>
                      <p className="text-sm mt-1">Agenda tu primera cita con el formulario</p>
                    </div>
                  ) : appointments.map(app => (
                    <div key={app.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">👨‍⚕️</div>
                        <div>
                          <p className="font-bold text-slate-800">Dr. {app.doctor.name}</p>
                          <p className="text-blue-600 text-sm">{app.doctor.specialty}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{new Date(app.date).toLocaleString('es-CO',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${app.status==='CONFIRMED'?'bg-green-100 text-green-700':app.status==='CANCELLED'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>
                          {app.status==='CONFIRMED'?'✓ Confirmada':app.status==='CANCELLED'?'✗ Cancelada':'⏳ Pendiente'}
                        </span>
                        <button onClick={() => handleDownloadPDF(app)}
                          className="text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition flex items-center gap-1">
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total', value:appointments.length, color:'text-blue-600', bg:'bg-blue-50' },
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
