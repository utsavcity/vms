# Utsav City VMS — SaaS Business Plan

How to turn this working product into a recurring-revenue SaaS sold to building owners and housing societies, including how to take payments in India.

---

## 1. The opportunity

Every residential and commercial building in India runs visitor management on a paper register at the gate. It is slow, unsearchable, insecure, and gives residents zero control. We already have a working digital replacement: guards log visitors, residents approve from their phone, admins get an audit trail — installable as an app, no hardware required.

**Who pays:** the building's managing committee / chairman / society (the same people who already pay for security guards, lifts, and housekeeping). It is an operating expense they understand.

**Why it sells:** safer for residents, professional image for the building, and cheaper than the manual effort it replaces. The demo sells itself — show the chairman a visitor approval landing on a resident's phone in real time.

---

## 2. What we sell

A per-building subscription. One building = one isolated account ("tenant") with its own flats, guards, residents, and data. We onboard each building for them (see Section 6) — they never touch a database.

**Plans (illustrative, Indian market):**

| Plan | Best for | Price (per month) | Includes |
|---|---|---|---|
| **Starter** | Up to 50 flats | ₹1,499 | Visitor + delivery + exit, resident approvals, push notifications |
| **Standard** | 51–150 flats | ₹2,999 | Everything in Starter + WhatsApp/SMS alerts, pre-registration links |
| **Premium** | 150+ flats / multiple gates | ₹4,999+ | Everything + multi-gate, monthly reports, priority support |
| **Setup (one-time)** | All | ₹2,000–5,000 | White-glove onboarding: we load flats, guards, residents |

Billing is **annual or monthly**. Annual paid upfront (offer ~2 months free) improves cash flow and cuts churn. A typical 56-flat building like Utsav City sits on Standard ≈ **₹36,000/year**.

---

## 3. How payments work (India)

Use **Razorpay** — it is the standard for Indian businesses and supports UPI, cards, net-banking, and **UPI AutoPay** for recurring billing. (Use **Stripe** only if you later sell outside India.)

**Two ways to charge, simplest first:**

### Option A — Invoice + payment link (start here)
1. Create a free Razorpay account (needs PAN + bank account; a registered business/GST helps but a sole proprietor can start).
2. For each building, generate a **Razorpay Payment Link** or **Invoice** for the annual fee and send it on WhatsApp.
3. They pay by UPI/card in one tap. You get notified; you activate their account.
4. Renew once a year by sending a fresh link.

This needs **zero code** and is the right way to land your first 5–10 buildings.

### Option B — Razorpay Subscriptions (automate later)
1. In Razorpay, create **Plans** (Starter/Standard/Premium) with a monthly/annual cycle.
2. Customer authorises once via **UPI AutoPay** or card e-mandate; Razorpay auto-charges each cycle and handles RBI e-mandate rules and retries.
3. Integrate Razorpay's webhook so a successful charge automatically keeps the building's account `active` and a failed charge flips it to `past_due`.

Add Option B once you have ~10+ paying buildings and manual renewals become a chore.

> **Billing is separate from the app's logins.** Residents and guards never see a payment screen. Only you (the vendor) and the building's committee deal with money. This keeps the product simple and the RBI/recurring-payment complexity out of the resident experience.

---

## 4. What needs to change technically (single-building → multi-building)

The app today is hardcoded to one building (Utsav City). To serve many, add a tenant layer. This is a moderate, well-scoped effort:

1. **`buildings` table already exists** — make every record (flats, guards, users, visitors) carry a `building_id` (most already do). Nothing is shared across buildings.
2. **Row-Level Security by tenant:** extend Supabase RLS so a user can only read/write rows where `building_id` matches their own. This is the core of data isolation and mostly an extension of the policies already in place.
3. **A "super-admin" console** (just for you): create a building, generate its admin login, set its plan + subscription status. This is the one new screen to build.
4. **Subscription gate:** a building whose status is `past_due`/`cancelled` shows a "renew" notice to its admin and freezes new actions (reads still work). One middleware check.
5. **Subdomain/branding per building** (optional polish): `greenwood.utsavvms.app`, with the building's name/logo. The frontend already detects subdomains.

Everything else — the guard flow, resident approvals, push, QR, reports — is already built and reused as-is.

---

## 5. Running costs (stay near-zero early)

| Service | Free tier covers | Paid when |
|---|---|---|
| Vercel (frontend) | Plenty for dozens of buildings | High traffic only |
| Render (API) | 1 free service (sleeps when idle) | ~₹600/mo for always-on once you have paying clients |
| Supabase | 500MB DB, 50K monthly active users | ₹2,000/mo (Pro) past the free limits |
| Razorpay | No monthly fee | ~2% per transaction |
| Twilio (WhatsApp/SMS) | Pay-as-you-go | ~₹0.30–0.80 per message |

**Gross margin is very high.** Even on the Pro tiers, infrastructure for 20–30 buildings is a few thousand rupees a month against lakhs in subscription revenue. The main cost is your time on sales and onboarding.

---

## 6. Customer onboarding (the manual-user model is a feature, not a limitation)

You said user data is added manually — lean into it. Society committees **do not want** to manage a database; they want it done for them. Position this as **"white-glove setup"** and charge a one-time fee for it.

**Onboarding playbook per building:**
1. Collect a spreadsheet: flat list, resident name + phone per flat, guard names.
2. You (vendor) create the building in the super-admin console and bulk-import the flats.
3. Create guard and resident logins; send each person their credentials over WhatsApp.
4. Walk the head guard through the gate flow once (15 min).
5. Hand the chairman the admin dashboard login.

Later, build a simple **CSV import** screen in the admin panel so committees can add/remove residents themselves as people move in and out — but the done-for-you service stays a selling point and an upsell.

---

## 7. Go-to-market (Mumbai first)

1. **Reference site:** get Utsav City live and happy. One real building you can show beats any pitch deck.
2. **Direct outreach:** managing committees and society secretaries via local property managers, MyGate-fatigued buildings, and facility-management firms who can resell to their portfolio.
3. **The demo is the pitch:** open the app on two phones (guard + resident) in front of the committee. Real-time approval is the closer.
4. **Land-and-expand:** facility managers and builders run many buildings — sign one, then their whole portfolio.
5. **Pricing posture:** undercut hardware-heavy incumbents (boom barriers, intercom installs). Our edge is **zero hardware, installs in a day.**

---

## 8. Suggested roadmap

| Phase | Goal | Build |
|---|---|---|
| **Now** | Close Utsav City as reference | Polish + deploy (done) |
| **1** | First 5 paying buildings | Razorpay payment links, manual onboarding |
| **2** | Remove your manual work | Super-admin console, tenant RLS, CSV import |
| **3** | Scale to 25+ | Razorpay Subscriptions + webhooks, per-building branding |
| **4** | Differentiate | Monthly security reports, multi-gate, vehicle/parking log, staff (maid/driver) passes |

---

## 9. One-line summary

We have a finished product that solves a universal, daily pain for every building in India. The path to revenue is: **demo Utsav City → sell per-building annual plans → collect via Razorpay → onboard them ourselves → add a tenant layer once demand is proven.** Low cost, high margin, and the hardest part (a working product) is already done.
