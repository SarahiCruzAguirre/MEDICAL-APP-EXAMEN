# Horus Braslet — Medical Appointment System

A full-featured web application for managing medical appointments built with **Next.js 15**, **TypeScript**, **Prisma 5**, **Supabase**, and **Tailwind CSS**. Features a dark UI theme with gold accents, 3D Spline animations, Heroicons, interactive FullCalendar, PDF generation, and email notifications.

---

## Requirements

Before starting, make sure you have installed:

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **Git** (optional) → [git-scm.com](https://git-scm.com)
- A **Supabase** account → [supabase.com](https://supabase.com)
- A **Gmail** account with App Password enabled (for email notifications)

---

## Installation

### 1. Enter the project folder

```bash
cd medical-app
```

### 2. Install all dependencies

```bash
npm install
```

This installs:
- `next` — React framework
- `react`, `react-dom` — UI library
- `typescript` — Static typing
- `tailwindcss`, `autoprefixer`, `postcss` — Styling
- `prisma`, `@prisma/client` — ORM
- `@supabase/supabase-js` — Supabase client
- `jose` — JWT tokens
- `bcryptjs` — Password hashing
- `pdf-lib` — PDF generation
- `nodemailer` — Email sending
- `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction` — Interactive calendar
- `@heroicons/react` — Icon library
- `@splinetool/react-spline` — 3D animations

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase — Transaction mode (port 6543)
DATABASE_URL="postgresql://postgres.YOURPROJECT:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase — Direct connection (port 5432)
DIRECT_URL="postgresql://postgres.YOURPROJECT:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# JWT Secrets — use long random strings
JWT_ACCESS_SECRET="your_long_random_access_secret_here"
JWT_REFRESH_SECRET="your_long_random_refresh_secret_here"
JWT_ACCESS_EXPIRES="10m"
JWT_REFRESH_EXPIRES="7d"

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_gmail_app_password"
SMTP_FROM="your_email@gmail.com"
```

#### Where to find Supabase URLs
1. Go to [supabase.com](https://supabase.com) → your project
2. **Settings → Database → Connection string**
3. Copy **Transaction** (port 6543) → `DATABASE_URL`
4. Copy **Session** (port 5432) → `DIRECT_URL`

#### How to get a Gmail App Password
1. Go to your Google Account → **Security**
2. Enable **2-Step Verification**
3. Go to **App passwords**
4. Generate a new app password for "Mail"
5. Use that 16-character password as `SMTP_PASS`

### 4. Push the database schema to Supabase

```bash
npx prisma db push
```

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Verifying the Setup

```bash
# View all database tables visually
npx prisma studio

# Test registration
# http://localhost:3000/register

# Test login
# http://localhost:3000/login
```

---

## Project Structure

```
medical-app/
├── app/
│   ├── (auth)/
│   │   ├── login/             # Login with Spline 3D animation
│   │   └── register/          # Registration + password strength meter + role selector
│   ├── dashboard/
│   │   ├── doctors/           # Doctor CRUD dashboard
│   │   └── appointments/      # Calendar + appointments + PDF + email
│   └── api/
│       ├── auth/              # login, register, refresh, logout
│       ├── doctors/           # GET, POST, PUT, DELETE
│       └── appointments/      # GET, POST + PDF + email
├── lib/
│   ├── prisma.ts              # Prisma singleton client
│   ├── jwt.ts                 # JWT sign and verify
│   ├── logger.ts              # Console + database logging
│   ├── pdf.ts                 # PDF generation (dark theme)
│   └── mailer.ts              # Email sending with Nodemailer
├── public/
│   └── logos/                 # Logo and image assets
├── prisma/
│   └── schema.prisma          # Database models
├── middleware.ts               # Route protection
├── tailwind.config.ts         # Tailwind configuration
└── .env.example               # Environment variables template
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Sync schema to database
npm run db:studio    # Open Prisma Studio (visual DB viewer)
npm run db:generate  # Regenerate Prisma client
```

---

## Features

| Feature | Description |
|---|---|
| Authentication | JWT access + refresh tokens in httpOnly cookies |
| Roles | Patient and Doctor with route-based redirects |
| Password strength | Real-time meter with requirements checklist |
| 3D Animation | Spline scene on login page |
| Doctor CRUD | Create, edit, delete, enable/disable doctors |
| Calendar | FullCalendar with month/week/day views (dark theme) |
| Availability check | Prevents double-booking on same slot |
| PDF confirmation | Auto-downloaded on appointment creation |
| Email notification | PDF sent to patient email via Gmail SMTP |
| Logging | All actions saved to database Log table |
| Icons | Heroicons throughout the UI |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 | Framework + API Routes |
| TypeScript | 5 | Static typing |
| Tailwind CSS | 3 | Styling (dark theme) |
| Prisma | 5 | ORM |
| Supabase | — | PostgreSQL cloud database |
| Jose | 5 | JWT tokens |
| bcryptjs | 2 | Password hashing |
| pdf-lib | 1 | PDF generation |
| Nodemailer | 6 | Email sending |
| FullCalendar | 6 | Interactive calendar |
| Heroicons | 2 | Icon library |
| Spline | — | 3D animations |

---

## Database Models

| Model | Description |
|---|---|
| User | System users with role (PATIENT or ADMIN) |
| Doctor | Doctor profile with specialty and availability |
| Patient | Patient profile linked 1:1 to User |
| Appointment | Medical appointments linking Doctor and Patient |
| RefreshToken | Stored refresh tokens for session management |
| Log | Record of all user actions with IP and timestamp |

---

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWTs signed with **HS256** algorithm
- Cookies set as **httpOnly** + **sameSite: lax**
- Input validation on both frontend and backend
- Middleware blocks all protected routes automatically
- All user actions stored in database log

---

## Troubleshooting

**Port already in use**
```bash
# Kill all Next.js processes and restart
pkill -f next
npm run dev
```

**Database connection error**
- Check that `DATABASE_URL` and `DIRECT_URL` have the correct password
- Make sure the Supabase project is active

**Prisma client not found**
```bash
npx prisma generate
```

**Tailwind styles not applying**
```bash
rm -rf .next
npm run dev
```

---

*Horus Braslet — Academic project — RIWI 2025*