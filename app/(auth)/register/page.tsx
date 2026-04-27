'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function getStrength(p: string): number {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

const cfg = [
  { label: 'Muy débil', color: 'bg-red-500', text: 'text-red-600', tip: 'Agrega más caracteres' },
  { label: 'Débil', color: 'bg-orange-500', text: 'text-orange-600', tip: 'Agrega números o símbolos' },
  { label: 'Regular', color: 'bg-yellow-500', text: 'text-yellow-600', tip: 'Agrega mayúsculas o símbolos' },
  { label: 'Buena', color: 'bg-blue-500', text: 'text-blue-600', tip: 'Casi lista, agrega un símbolo' },
  { label: 'Fuerte', color: 'bg-green-500', text: 'text-green-600', tip: '¡Contraseña segura!' },
  { label: 'Muy fuerte', color: 'bg-green-700', text: 'text-green-700', tip: '¡Excelente contraseña!' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'PATIENT' })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '' })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getStrength(form.password)
  const info = cfg[Math.min(strength, 5)]

  function validate() {
    const e = { name: '', email: '', password: '', confirm: '' }
    let ok = true
    if (!form.name.trim() || form.name.trim().length < 3) { e.name = 'Mínimo 3 caracteres'; ok = false }
    if (!form.email) { e.email = 'El correo es requerido'; ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { e.email = 'Correo inválido'; ok = false }
    if (form.password.length < 8) { e.password = 'Mínimo 8 caracteres'; ok = false }
    else if (strength < 3) { e.password = 'Contraseña muy débil. Agrega mayúsculas, números o símbolos.'; ok = false }
    if (!form.confirm) { e.confirm = 'Confirma tu contraseña'; ok = false }
    else if (form.password !== form.confirm) { e.confirm = 'Las contraseñas no coinciden'; ok = false }
    setErrors(e)
    return ok
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error ?? 'Error al crear cuenta'); return }
      router.push(data.role === 'ADMIN' ? '/dashboard/doctors' : '/dashboard/appointments')
    } catch { setServerError('Error de conexión. Intenta de nuevo.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏥</div>
          <span className="text-white font-bold text-xl">MediCitas</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Únete a la<br />plataforma médica</h2>
          <p className="text-blue-100 text-lg mb-10">Crea tu cuenta y comienza a gestionar citas médicas hoy mismo.</p>
          <div className="space-y-4">
            {[['✅','Registro gratuito y rápido'],['🔐','Datos siempre protegidos'],['📱','Accede desde cualquier dispositivo']].map(([icon,label]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-blue-100 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© 2025 MediCitas. Todos los derechos reservados.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg">🏥</div>
            <span className="text-blue-700 font-bold text-lg">MediCitas</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Crear cuenta</h1>
            <p className="text-slate-500 mt-2">Completa el formulario para registrarte</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Soy</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'PATIENT', icon: '🧑‍⚕️', label: 'Paciente', desc: 'Agenda citas' }, { value: 'ADMIN', icon: '👨‍⚕️', label: 'Médico', desc: 'Gestiona agenda' }].map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex flex-col items-center py-4 px-3 rounded-xl border-2 transition ${form.role === r.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                      <span className="text-2xl mb-1">{r.icon}</span>
                      <span className="font-semibold text-sm">{r.label}</span>
                      <span className="text-xs opacity-70 mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre completo</label>
                <input type="text" placeholder="Juan Pérez" className={`input-field ${errors.name ? 'input-error' : ''}`}
                  value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }) }} />
                {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo electrónico</label>
                <input type="email" placeholder="ejemplo@correo.com" className={`input-field ${errors.email ? 'input-error' : ''}`}
                  value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }) }} />
                {errors.email && <p className="text-red-500 text-xs mt-1">⚠ {errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`}
                    value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }) }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-lg">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">⚠ {errors.password}</p>}
                {form.password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5 mb-1.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? info.color : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className={`text-xs font-semibold ${info.text}`}>{info.label}</p>
                      <p className="text-xs text-slate-400">{info.tip}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { ok: form.password.length >= 8, label: '8+ chars' },
                        { ok: /[A-Z]/.test(form.password), label: 'Mayúscula' },
                        { ok: /[0-9]/.test(form.password), label: 'Número' },
                        { ok: /[^A-Za-z0-9]/.test(form.password), label: 'Símbolo' },
                      ].map(req => (
                        <span key={req.label} className={`text-xs px-2 py-0.5 rounded-full border ${req.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {req.ok ? '✓' : '○'} {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                    className={`input-field pr-12 ${errors.confirm ? 'input-error' : ''}`}
                    value={form.confirm} onChange={e => { setForm({ ...form, confirm: e.target.value }); if (errors.confirm) setErrors({ ...errors, confirm: '' }) }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-lg">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirm && <p className="text-red-500 text-xs mt-1">⚠ {errors.confirm}</p>}
                {form.confirm && form.password === form.confirm && !errors.confirm && (
                  <p className="text-green-600 text-xs mt-1">✓ Las contraseñas coinciden</p>
                )}
              </div>
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{serverError}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Creando cuenta...</>
                ) : 'Crear Cuenta'}
              </button>
            </form>
          </div>
          <p className="text-center text-sm mt-6 text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">Inicia sesión aquí</a>
          </p>
        </div>
      </div>
    </div>
  )
}
