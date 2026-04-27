'use client'

//costumer side
import { useState } from 'react' //hook for the local manage, keep the form
import { useRouter } from 'next/navigation' //hook of next for the navigation betweent pages
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, LockClosedIcon, DevicePhoneMobileIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'


//this read the strong of the password and give a score for the password
function getStrength(p: string): number {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

//this had a access to the form and the states of the form, this is the main page for the register where we had all the inputs and styles for the register of the user, in this page we validate all the inputs and we had a password strong validator for the password, in the finally we send all the data to the api for create the user and redirect to the dashboard
const cfg = [
  { label: 'Muy débil', color: 'bg-red-9500', text: 'text-red-400', tip: 'Agrega más caracteres' },
  { label: 'Débil', color: 'bg-orange-500', text: 'text-orange-600', tip: 'Agrega números o símbolos' },
  { label: 'Regular', color: 'bg-yellow-500', text: 'text-yellow-600', tip: 'Agrega mayúsculas o símbolos' },
  { label: 'Buena', color: 'bg-blue-500', text: 'text-yellow-400', tip: 'Casi lista, agrega un símbolo' },
  { label: 'Fuerte', color: 'bg-green-9500', text: 'text-green-400', tip: '¡Contraseña segura!' },
  { label: 'Muy fuerte', color: 'bg-green-700', text: 'text-green-700', tip: '¡Excelente contraseña!' },
]

//status of the componets
export default function RegisterPage() {

  //role of thw form
  //errors
  //error who the API return
  //loading for the submit
  //show password for the input
  //score of the password for the validator
  //level of the password for the validator
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'PATIENT' })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '' })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getStrength(form.password)
  const info = cfg[Math.min(strength, 5)]


  //validate the inputs of the form
  function validate() {
    const e = { name: '', email: '', password: '', confirm: '' }
    let ok = true
    //delete spacens and validate the length of the name
    if (!form.name.trim() || form.name.trim().length < 3) { e.name = 'Mínimo 3 caracteres'; ok = false }
    if (!form.email) { e.email = 'El correo es requerido'; ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { e.email = 'Correo inválido'; ok = false }
    if (form.password.length < 8) { e.password = 'Mínimo 8 caracteres'; ok = false }
    //verificate the long of the password and the strong of the password for the password validator
    else if (strength < 3) { e.password = 'Contraseña muy débil. Agrega mayúsculas, números o símbolos.'; ok = false }

    //verificate if the form is not etmpy
    if (!form.confirm) { e.confirm = 'Confirma tu contraseña'; ok = false }
    else if (form.password !== form.confirm) { e.confirm = 'Las contraseñas no coinciden'; ok = false }
    setErrors(e)
    return ok
  }


  //calls the register and send the body with the information

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault() //no load
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', //make the petition to the register and send it in a json body
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      })
      const data = await res.json()
      //transform the http anwser and return the validation or the fail
      if (!res.ok) { setServerError(data.error ?? 'Error al crear cuenta'); return }

      //if the register is ok redirect about the roll
      router.push(data.role === 'ADMIN' ? '/dashboard/doctors' : '/dashboard/appointments')
    } catch { setServerError('Error de conexión. Intenta de nuevo.') }
    finally { setLoading(false) }
  }

  //the mold of the visual interview

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/logos/horus.webp" alt="MediCitas" className="w-full h-full object-cover" />
            </div>
          <span className="text-white font-bold text-xl">Horus Braslet</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Únete a la<br />plataforma médica</h2>
          <p className="text-blue-100 text-lg mb-10">Crea tu cuenta y comienza a gestionar citas médicas hoy mismo.</p>
          <div className="space-y-4">
            {[
  { icon: <CheckCircleIcon className="w-5 h-5 text-yellow-400" />, label: 'Registro gratuito y rápido' },
  { icon: <LockClosedIcon className="w-5 h-5 text-yellow-400" />, label: 'Datos siempre protegidos' },
  { icon: <DevicePhoneMobileIcon className="w-5 h-5 text-yellow-400" />, label: 'Accede desde cualquier dispositivo' },
].map(({ icon, label }) => (
  <div key={label} className="flex items-center gap-3">
    {icon}
    <span className="text-zinc-300 font-medium">{label}</span>
  </div>
))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© 2025 Horus Braslet. Todos los derechos reservados.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center">
          <img src="/logos/horus.webp" alt="Horus Braslet" className="w-full h-full object-contain" />
        </div>
  <span className="text-yellow-400 font-bold text-lg">Horus Braslet</span>
</div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
            <p className="text-zinc-400 mt-2">Completa el formulario para registrarte</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Soy</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'PATIENT', icon: '🧑‍⚕️', label: 'Paciente', desc: 'Agenda citas' }, { value: 'ADMIN', icon: '👨‍⚕️', label: 'Médico', desc: 'Gestiona agenda' }].map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex flex-col items-center py-4 px-3 rounded-xl border-2 transition ${form.role === r.value ? 'border-yellow-500 bg-zinc-800 text-yellow-400' : 'border-zinc-700 text-slate-600 hover:border-zinc-600 hover:bg-zinc-950'}`}>
                      <span className="text-2xl mb-1">{r.icon}</span>
                      <span className="font-semibold text-sm">{r.label}</span>
                      <span className="text-xs opacity-70 mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Nombre completo</label>
                <input type="text" placeholder="Juan Pérez" className={`input-field ${errors.name ? 'input-error' : ''}`}
                  value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }) }} />
                {errors.name && <p className="text-red-400 text-xs mt-1">⚠ {errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Correo electrónico</label>
                <input type="email" placeholder="ejemplo@correo.com" className={`input-field ${errors.email ? 'input-error' : ''}`}
                  value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }) }} />
                {errors.email && <p className="text-red-400 text-xs mt-1">⚠ {errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`}
                    value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }) }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-slate-600 transition text-lg">
                    {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">⚠ {errors.password}</p>}
                {form.password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5 mb-1.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? info.color : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className={`text-xs font-semibold ${info.text}`}>{info.label}</p>
                      <p className="text-xs text-zinc-500">{info.tip}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { ok: form.password.length >= 8, label: '8+ chars' },
                        { ok: /[A-Z]/.test(form.password), label: 'Mayúscula' },
                        { ok: /[0-9]/.test(form.password), label: 'Número' },
                        { ok: /[^A-Za-z0-9]/.test(form.password), label: 'Símbolo' },
                      ].map(req => (
                        <span key={req.label} className={`text-xs px-2 py-0.5 rounded-full border ${req.ok ? 'bg-green-950 text-green-700 border-green-800' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                          {req.ok ? '✓' : '○'} {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                    className={`input-field pr-12 ${errors.confirm ? 'input-error' : ''}`}
                    value={form.confirm} onChange={e => { setForm({ ...form, confirm: e.target.value }); if (errors.confirm) setErrors({ ...errors, confirm: '' }) }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-slate-600 transition text-lg">
                    {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-red-400 text-xs mt-1">⚠ {errors.confirm}</p>}
                {form.confirm && form.password === form.confirm && !errors.confirm && (
                  <p className="text-green-400 text-xs mt-1">✓ Las contraseñas coinciden</p>
                )}
              </div>
              {serverError && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-red-400">⚠️</span>
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
          <p className="text-center text-sm mt-6 text-zinc-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-yellow-400 font-semibold hover:underline">Inicia sesión aquí</a>
          </p>
        </div>
      </div>
    </div>
  )
}
