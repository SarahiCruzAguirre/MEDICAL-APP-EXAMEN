'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Doctor = { id: string; name: string; specialty: string; experience: number; contact: string; available: boolean }

const SPECIALTIES = ['Medicina General','Cardiología','Dermatología','Neurología','Pediatría','Ortopedia','Ginecología','Psiquiatría','Oftalmología','Otra']

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [form, setForm] = useState({ name: '', specialty: '', experience: '', contact: '' })
  const [errors, setErrors] = useState({ name: '', specialty: '', experience: '', contact: '' })
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function fetchDoctors() {
    setFetchLoading(true)
    const res = await fetch('/api/doctors')
    setDoctors(await res.json())
    setFetchLoading(false)
  }
  useEffect(() => { fetchDoctors() }, [])

  function validate() {
    const e = { name: '', specialty: '', experience: '', contact: '' }
    let ok = true
    if (!form.name.trim() || form.name.length < 3) { e.name = 'Mínimo 3 caracteres'; ok = false }
    if (!form.specialty) { e.specialty = 'Selecciona una especialidad'; ok = false }
    if (!form.experience || Number(form.experience) < 0) { e.experience = 'Ingresa años válidos'; ok = false }
    if (!form.contact.trim()) { e.contact = 'El contacto es requerido'; ok = false }
    setErrors(e); return ok
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    if (editing) {
      await fetch(`/api/doctors/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, available: editing.available }) })
      setEditing(null)
    } else {
      await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setForm({ name: '', specialty: '', experience: '', contact: '' })
    setLoading(false); setShowForm(false); fetchDoctors()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este médico?')) return
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' })
    fetchDoctors()
  }

  async function toggleAvailable(doc: Doctor) {
    await fetch(`/api/doctors/${doc.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...doc, available: !doc.available }) })
    fetchDoctors()
  }

  function handleEdit(doctor: Doctor) {
    setEditing(doctor)
    setForm({ name: doctor.name, specialty: doctor.specialty, experience: String(doctor.experience), contact: doctor.contact })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditing(null); setForm({ name: '', specialty: '', experience: '', contact: '' })
    setErrors({ name: '', specialty: '', experience: '', contact: '' }); setShowForm(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login')
  }

  const filtered = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl overflow-hidden bg-white">
  <img src="/logos/horus.webp" alt="logo" className="w-full h-full object-contain" />
</div>            <div><span className="font-bold text-white">Horus Braslet</span><span className="text-zinc-500 text-sm ml-2">/ Médicos</span></div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard/appointments" className="text-sm text-zinc-400 hover:text-yellow-400 font-medium transition">Citas</a>
            <button onClick={handleLogout} className="btn-danger text-sm py-1.5 px-3">Cerrar sesión</button>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Médicos</h1>
            <p className="text-zinc-400 mt-1">{doctors.length} médico{doctors.length !== 1 ? 's' : ''} registrado{doctors.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { handleCancel(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <span className="text-lg">+</span> Nuevo Médico
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 border-blue-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? '✏️ Editar Médico' : '➕ Nuevo Médico'}</h2>
              <button onClick={handleCancel} className="text-zinc-500 hover:text-slate-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre completo</label>
                <input placeholder="Dr. Juan Pérez" className={`input-field ${errors.name ? 'input-error' : ''}`}
                  value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }} />
                {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Especialidad</label>
                <select className={`input-field ${errors.specialty ? 'input-error' : ''}`}
                  value={form.specialty} onChange={e => { setForm({ ...form, specialty: e.target.value }); setErrors({ ...errors, specialty: '' }) }}>
                  <option value="">Seleccionar especialidad</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.specialty && <p className="text-red-500 text-xs mt-1">⚠ {errors.specialty}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Años de experiencia</label>
                <input type="number" min="0" max="60" placeholder="5" className={`input-field ${errors.experience ? 'input-error' : ''}`}
                  value={form.experience} onChange={e => { setForm({ ...form, experience: e.target.value }); setErrors({ ...errors, experience: '' }) }} />
                {errors.experience && <p className="text-red-500 text-xs mt-1">⚠ {errors.experience}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contacto</label>
                <input placeholder="email@hospital.com o +57 300..." className={`input-field ${errors.contact ? 'input-error' : ''}`}
                  value={form.contact} onChange={e => { setForm({ ...form, contact: e.target.value }); setErrors({ ...errors, contact: '' }) }} />
                {errors.contact && <p className="text-red-500 text-xs mt-1">⚠ {errors.contact}</p>}
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Guardando...</>) : (editing ? 'Actualizar' : 'Crear Médico')}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-5">
          <input type="text" placeholder="🔍 Buscar por nombre o especialidad..." className="input-field max-w-md"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {fetchLoading ? (
          <div className="text-center py-20 text-zinc-500"><div className="text-4xl mb-3">⏳</div><p>Cargando médicos...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500"><div className="text-4xl mb-3">👨‍⚕️</div><p className="font-medium">No hay médicos registrados</p><p className="text-sm mt-1">Crea el primero arriba</p></div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">👨‍⚕️</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white">{doc.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {doc.available ? '● Disponible' : '● No disponible'}
                      </span>
                    </div>
                    <p className="text-yellow-400 font-medium text-sm mt-0.5">{doc.specialty}</p>
                    <div className="flex items-center gap-4 mt-1 text-zinc-500 text-sm">
                      <span>📅 {doc.experience} años</span><span>📞 {doc.contact}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button onClick={() => toggleAvailable(doc)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${doc.available ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                    {doc.available ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button onClick={() => handleEdit(doc)} className="text-xs px-3 py-1.5 rounded-lg border border-blue-300 text-yellow-400 hover:bg-zinc-800 font-medium transition">✏️ Editar</button>
                  <button onClick={() => handleDelete(doc.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium transition">🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



