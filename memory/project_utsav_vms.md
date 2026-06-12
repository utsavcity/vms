---
name: project-utsav-vms
description: Utsav City VMS — full project context, tech stack, structure, and build status
metadata:
  type: project
---

Building a production-ready Visitor Management System for Utsav City, a single commercial building in Mumbai (7 floors, 56 flats).

**Why:** User wants a complete, deployable VMS — not a prototype. Every layer must be properly structured.

**How to apply:** When asked to extend or fix this project, know the structure is already scaffolded. Refer to the README for setup steps.

## Tech Stack
- Backend: Node.js + Express REST API at `backend/`
- Mobile: React Native + Expo at `mobile/` (guard + resident apps)
- Web: React + Vite at `web/` (visitor form + admin dashboard)
- DB: PostgreSQL via Supabase
- Auth: Supabase Auth with role-based metadata (`guard`, `family_head`, `member`, `admin`, `chairman`)
- Storage: Supabase Storage (`visitor-photos` bucket, 500KB max)
- Notifications: Twilio WhatsApp + SMS
- Real-time: Supabase postgres_changes subscriptions

## Build Status (completed 2026-06-12)
All files scaffolded and production-ready:
- database/schema.sql + seed.sql (56 flats seeded)
- backend/src/app.js + all 8 modules (visitors, residents, guards, flats, preregistrations, delivery, notifications, admin)
- backend/src/jobs/overstayMonitor.js (cron every 15 min)
- mobile: all screens for guard (Home, NewVisitor, VisitorDetail, LogDelivery, MarkExit, Residents) + resident (Home, Approval, InviteVisitor, FamilyManagement, NotificationSettings) + hooks (useRealtime, useNotifications, useImageUpload)
- web: visitor form flow (VisitorFormPage, ConfirmationPage) + admin dashboard (Dashboard, Guards, Flats, RemovalLogs)

## Next Steps for User
1. Create Supabase project → run schema.sql + seed.sql
2. Create visitor-photos storage bucket (500KB limit, public read)
3. Set up Twilio for WhatsApp + SMS
4. Fill .env files in backend/, mobile/, web/
5. npm install + start each layer
