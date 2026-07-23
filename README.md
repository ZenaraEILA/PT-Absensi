# PT Absensi — Sistem Absensi Perusahaan

Aplikasi absensi perusahaan berbasis web dengan fitur check-in/out berbasis lokasi, manajemen izin/cuti, approval berjenjang, dan dashboard interaktif. Dibangun dengan **Next.js 14**, **Prisma**, **MySQL/MariaDB**, dan **Three.js**.

🌐 **Live Demo:** [https://seraviel.my.id](https://seraviel.my.id)

> **Catatan:** Domain menggunakan Cloudflare proxy. Pastikan DNS Cloudflare mengarah ke IP publik server (114.10.46.189).

## Fitur

- **Absensi Harian** — Check-in & check-out dengan foto dan lokasi geospasial
- **Verifikasi Mandiri** — Karyawan dapat memverifikasi kejujuran absensi sendiri (AMAN / BERBOHONG)
- **Manajemen Cuti & Izin** — Pengajuan cuti, izin, dan PKL dengan lampiran
- **Approval Berjenjang** — Alur persetujuan Manager → HR
- **Dashboard** — Statistik real-time, grafik kehadiran, notifikasi
- **Manajemen Shift** — Atur jam masuk/pulang dan tolerasi per shift
- **Manajemen Departemen** — Kelola struktur organisasi
- **Laporan & Ekspor** — Cetak laporan absensi ke PDF/Excel
- **Autentikasi** — Login dengan nomor induk & password, session via NextAuth
- **Interactive Wave Background** — Halaman login dengan animasi shader Three.js reaktif terhadap gerakan kursor

## Tech Stack

| Teknologi | Versi |
|---|---|
| [Next.js](https://nextjs.org/) | 14.2.18 (App Router) |
| [Prisma](https://prisma.io/) | ^5.22.0 |
| [NextAuth](https://next-auth.js.org/) | ^4.24.10 |
| [Three.js](https://threejs.org/) | ^0.160.0 |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | ^8.15.12 |
| [@react-three/drei](https://github.com/pmndrs/drei) | ^9.92.7 |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.15 |
| [TanStack Query](https://tanstack.com/query) | ^5.60.0 |
| [Zustand](https://zustand.docs.pmnd.rs/) | ^5.0.0 |
| [Framer Motion](https://www.framer.com/motion/) | ^11.11.0 |
| [Recharts](https://recharts.org/) | ^2.13.0 |
| [MySQL](https://www.mysql.com/) / MariaDB | 10.6+ |

## Prasyarat

- **Node.js** 18+ (direkomendasikan 20.x LTS)
- **npm** 9+
- **MySQL** 8+ atau **MariaDB** 10.6+
- **Git**

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/ZenaraEILA/PT-Absensi.git
cd PT-Absensi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env` di root project:

```env
DATABASE_URL="mysql://username:password@localhost:3306/absensi"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Buat secret untuk `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Setup database

```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE absensi;"

# Jalankan migrasi Prisma
npx prisma migrate deploy

# (Opsional) Seed data awal
npx prisma db seed
```

### 5. Jalankan development server

```bash
npm run dev
```

Akses di **http://localhost:3000**

## Build & Production

```bash
npm run build
npm start
```

### Deployment dengan PM2 (Server Production)

```bash
npm run build
pm2 start npm --name "absensi-app" -- start
pm2 save
pm2 startup
```

## Struktur Database

### Models (Prisma)

- **users** — Data karyawan, admin, manager, HR
- **departments** — Departemen organisasi
- **shifts** — Shift jam kerja
- **locations** — Titik lokasi check-in (GPS + radius)
- **attendances** — Data absensi (check-in/out, foto, status verifikasi)
- **leave_requests** — Pengajuan cuti/izin/PKL
- **approvals** — Approval berjenjang (Manager → HR)
- **activity_logs** — Log aktivitas pengguna

### Diagram Relasi

```
User ──> Department
User ──> Shift
User ──> Attendance (check-in/out)
User ──> LeaveRequest
LeaveRequest ──> Approval (berjenjang)
Attendance ──> Verifikasi (mandiri)
```

## API Routes

| Route | Method | Deskripsi |
|---|---|---|
| `/api/auth/[...nextauth]` | POST | Autentikasi login |
| `/api/absensi/checkin` | POST | Check-in dengan foto & lokasi |
| `/api/absensi/checkout` | POST | Check-out |
| `/api/absensi/hari-ini` | GET | Absensi hari ini (user) |
| `/api/absensi/riwayat` | GET | Riwayat absensi user |
| `/api/absensi/semua` | GET | Semua absensi (admin) |
| `/api/absensi/:id/verifikasi` | PATCH | Verifikasi mandiri |
| `/api/cuti` | GET/POST | Manajemen cuti |
| `/api/cuti/:id` | GET/PUT/DELETE | Detail cuti |
| `/api/karyawan` | GET/POST | Manajemen karyawan |
| `/api/departemen` | GET/POST | Manajemen departemen |
| `/api/shift` | GET/POST | Manajemen shift |
| `/api/lokasi` | GET/POST | Manajemen lokasi |
| `/api/laporan` | GET | Laporan absensi |
| `/api/laporan/export` | GET | Ekspor laporan (PDF/Excel) |
| `/api/dashboard/stats` | GET | Statistik dashboard |
| `/api/dashboard/recent-attendance` | GET | Absensi terbaru |
| `/api/user/profile` | GET/PUT | Profil user |
| `/api/user/password` | PUT | Ubah password |
| `/api/upload` | POST | Upload file/lampiran |
| `/api/pkl-izin` | GET/POST | Manajemen PKL/izin |

## Screenshots

> *(Tambahkan screenshot aplikasi di sini)*

## Lisensi

Hak cipta © 2026 PT Absensi. Seluruh hak cipta dilindungi.

---

Dibangun dengan ❤️ oleh [ZenaraEILA](https://github.com/ZenaraEILA)
