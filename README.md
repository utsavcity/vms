# Utsav City — Visitor Management System

Production-ready VMS for Utsav City, Mumbai. 7 floors, 56 flats.
Single PWA serves guards, residents, visitors, and admins.

## Project Structure

```
utsav-vms/
├── backend/          Node.js + Express API
├── web/              React + Vite PWA — guard app, resident app, visitor form, admin dashboard
└── database/         PostgreSQL schema + seed + migrations
```

## Tech Stack

| Layer | Technology |
|---|---|
| App (all roles) | React + Vite PWA (installable, offline shell, Web Push) |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (role in user_metadata) |
| Storage | Supabase Storage (`visitor-photos`, 500KB max) |
| Notifications | Twilio (WhatsApp + SMS) + Web Push (VAPID) |
| Real-time | Supabase postgres_changes subscriptions |
| QR / Camera | jsQR + getUserMedia |

## Setup

### 1. Database (Supabase SQL editor)
1. Run `database/schema.sql`
2. Run `database/seed.sql` (building + 56 flats)
3. Run `database/migrations/002_push_subscriptions.sql`
4. Storage → create public bucket `visitor-photos` (500KB limit)

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill Supabase + Twilio + VAPID keys
npx web-push generate-vapid-keys   # → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
npm install
npm run dev            # http://localhost:3000
```

### 3. Web PWA
```bash
cd web
cp .env.example .env   # fill Supabase anon key + VITE_VAPID_PUBLIC_KEY
npm install
npm run dev            # http://localhost:5173
```

## Routing

| URL | Who |
|---|---|
| `/login` | Guard + resident sign-in (phone + password) |
| `/guard/*` | Guard app (mobile layout, bottom nav) |
| `/resident/*` | Resident app (mobile layout, bottom nav) |
| `/visitor/form/:token` (alias `/visit/form/:token`) | Public visitor form |
| `/admin/*` | Admin dashboard (desktop layout), `/admin/login` |

Subdomains map to the same trees when configured:
`guard.` → /guard, `app.` → /resident, `admin.` → /admin, `visit.` → /visit.

Role guards redirect cross-role access to the caller's own area.

## User Roles

| Role | Access |
|---|---|
| `guard` | Visitor entry/exit, QR scan, delivery logging, tenant removal |
| `family_head` | Approve/deny visitors, invites, family management |
| `member` | Approve/deny visitors, invites, notification settings |
| `admin` / `chairman` | Dashboard stats, guards, flats, audit logs |

## Key Flows

1. **Walk-in visitor**: Guard enters phone → resident notified (in-app push + WhatsApp/SMS) → approve/deny → entry logged
2. **Returning visitor**: Phone lookup shows photo → re-notify resident → entry logged
3. **Pre-registration**: Resident sends link → visitor fills form + selfie → guard sees expected visitor
4. **Delivery**: Guard logs → resident notified → no visitor record
5. **Exit**: QR scan (jsQR) or name search → exit logged → overstay resolved
6. **Overstay**: cron every 15 min → alert at 4-hour mark
7. **Tenant removal**: guard removes → admins notified instantly → audit log

## PWA

- Installable (manifest + icons in `web/public/`); replace placeholder icons with the real logo before launch
- Auto-updating service worker (`web/src/sw.js`): offline shell, network-first for Supabase + API
- Web Push via VAPID; subscriptions stored in `push_subscriptions`, delivered with `web-push`
