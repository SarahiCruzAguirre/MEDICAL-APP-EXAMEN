'use client'

//* costumer side

import Spline from '@splinetool/react-spline'
import { useState } from 'react' //hook for the local manage, keep the form
import { useRouter } from 'next/navigation' //hook of next for the navigation betweent pages

//login form
export default function LoginPage() {
  const router = useRouter()

  //keep all inputs and states of the form
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)


  //validation of the form 
  function validate() {
    const e = { email: '', password: '' }
    let ok = true
    if (!form.email) { e.email = 'El correo es requerido'; ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { e.email = 'Correo invalido'; ok = false }
    if (!form.password) { e.password = 'La contrasena es requerida'; ok = false }
    setErrors(e)
    return ok
  }

  //when the user make submit call the api and validate to connect with the back

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault() //no load
    if (!validate()) return //if we had error dont make fecht
    setLoading(true)
    setServerError('')
    try {

      //make the petition and send it in json form 
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      //if the fuction fails show the error
      if (!res.ok) { setServerError(data.error ?? 'Error al iniciar sesion'); return }

      //if the login is om redirect to the dashboard
      router.push(data.role === 'ADMIN' ? '/dashboard/doctors' : '/dashboard/appointments')
    } catch { setServerError('Error de conexion.') }
    finally { setLoading(false) }
  }

  //this is the main mold to the login where we had the inputs and styles of the aplication
  //in the finally this form redirect to the register when is necesary and we had a animation with spline for the design of the page
  return (
    <div className="min-h-screen flex bg-zinc-950">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex-col justify-between p-12 border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white"><img src="/logos/horus.webp" alt="logo" className="w-full h-full object-contain" /></div>
          <span className="text-yellow-400 font-bold text-xl">Horus Braslet</span>
        </div>
        <div className="relative z-10">
          <div className="w-72 h-72 mb-6 mx-auto">
            <Spline scene="https://prod.spline.design/KD73xAxrvGjYuqD1/scene.splinecode" />
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Tu salud, nuestra prioridad</h2>
          <p className="text-zinc-400 text-lg mb-10">Gestiona tus citas medicas de forma simple y segura.</p>
        </div>
        <p className="text-zinc-600 text-sm">2025 Horus Braslet.</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Bienvenido de nuevo</h1>
            <p className="text-zinc-400 mt-2">Ingresa tus credenciales para continuar</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Correo electronico</label>
                <input type="email" placeholder="ejemplo@correo.com"
                  className={"input-field " + (errors.email ? 'input-error' : '')}
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }) }}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">Contrasena</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Tu contrasena"
                    className={"input-field pr-12 " + (errors.password ? 'input-error' : '')}
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }) }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition">
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              {serverError && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4">
                  <p className="text-red-300 text-sm">{serverError}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              </button>
            </form>
          </div>
          <p className="text-center text-sm mt-6 text-zinc-500">
            No tienes cuenta? <a href="/register" className="text-yellow-400 font-semibold hover:underline">Registrate aqui</a>
          </p>
        </div>
      </div>
    </div>
  )
}
