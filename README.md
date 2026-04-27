# 🏥 MediCitas — Sistema de Citas Médicas

Sistema web completo para gestión de citas médicas con **Next.js 15**, **TypeScript**, **Prisma 5**, **Supabase** y **Tailwind CSS**.

---

## 🚀 Características

- ✅ Login y Registro con validaciones completas
- 🔐 JWT Access Token (10min) + Refresh Token (7 días) en cookies httpOnly
- 👥 Roles: Paciente y Médico
- 🔒 Medidor de fortaleza de contraseña en tiempo real
- 👨‍⚕️ CRUD completo de médicos con búsqueda
- 📅 Calendario interactivo con FullCalendar
- 🔍 Validación de disponibilidad de horarios
- 📄 Comprobante de cita en PDF automático
- 📊 Logs de todas las acciones en la base de datos
- 🛡️ Middleware de protección de rutas

---

## ⚙️ Instalación

### 1. Descomprime el ZIP y entra a la carpeta

```bash
cd medical-app
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus datos de Supabase:

```env
DATABASE_URL="postgresql://postgres.TUPROYECTO:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.TUPROYECTO:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
JWT_ACCESS_SECRET="string_largo_y_aleatorio"
JWT_REFRESH_SECRET="otro_string_largo_diferente"
JWT_ACCESS_EXPIRES="10m"
JWT_REFRESH_EXPIRES="7d"
NEXT_PUBLIC_SUPABASE_URL="https://TUPROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
```

> **¿Dónde encuentro las URLs?** Supabase → Settings → Database → Connection string
> - Puerto **6543** (Transaction) → DATABASE_URL
> - Puerto **5432** (Session) → DIRECT_URL

### 4. Crea las tablas en Supabase

```bash
npx prisma db push
```

### 5. (Opcional) Genera el cliente Prisma

```bash
npx prisma generate
```

### 6. Inicia el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🧪 Verificar que funciona

```bash
# Ver las tablas en la BD
npx prisma studio

# Probar registro
# → http://localhost:3000/register

# Probar login
# → http://localhost:3000/login
```

---

## 📁 Estructura

```
medical-app/
├── app/
│   ├── (auth)/login/         # Login con validaciones
│   ├── (auth)/register/      # Registro + medidor contraseña + selector rol
│   ├── (dashboard)/doctors/  # CRUD médicos
│   ├── (dashboard)/appointments/ # Calendario + citas + PDF
│   └── api/                  # API Routes
├── lib/
│   ├── prisma.ts             # Cliente Prisma singleton
│   ├── jwt.ts                # Sign/verify JWT
│   ├── logger.ts             # Logs consola + DB
│   └── pdf.ts                # Generación PDF
├── prisma/schema.prisma      # Modelos de BD
├── middleware.ts             # Protección de rutas
└── .env.example              # Variables de entorno
```

---

## 📦 Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run db:push      # Sincronizar BD
npm run db:studio    # Ver BD visual
```

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt** (10 rounds)
- JWT firmados con **HS256**
- Cookies **httpOnly** + **sameSite: lax**
- Validación en frontend y backend
- Middleware bloquea rutas protegidas
- Logs de todas las acciones en BD

---

*Desarrollado como proyecto académico — RIWI 2025*
