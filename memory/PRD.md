# Doggy Breeding App — Product Requirements Document

## Overview
A professional veterinary mobile application (Expo React Native + FastAPI + MongoDB) for canine reproductive evaluation and breeding management. Built for Veterinary College and Research Institute, Namakkal — Department of Veterinary Gynaecology and Obstetrics. Developed by ANIMitra Software.

Tagline: **Breed • Track • Care**

## Users
- Veterinarians, Students, Breeders, Laboratories, Clinics

## Tech Stack
- Frontend: Expo React Native (SDK 54), expo-router, react-native-svg, expo-print, expo-sharing, expo-image-picker, expo-linear-gradient, expo-blur
- Backend: FastAPI + Motor (MongoDB)
- Auth: Standalone Google Sign-In stub (real `expo-auth-session` flow ready, requires client IDs in `.env`)
- Storage: MongoDB (local volume). Apps Script/Sheets sync deferred per user.

## Features (v1.0)
1. **Splash** — 3s animated gradient (blue→purple→pink) glassmorphism card with logo, institution, faculty, developer, version, loading bar
2. **Login** — Google Sign-In (disabled until client IDs added) + Continue without Google
3. **Registration** — Name*, Mobile*, Email, Hospital, Category (Doctor/Student/Breeder/Laboratory/Clinic), Location, State
4. **Dashboard** — Greeting, stats grid (Total/Estrus/Anestrus/Diestrus), donut chart, quick access tiles
5. **New Evaluation** — Dog Info (Name, Owner, Mobile, Breed, Age, Weight, Whelping count, Previous whelping date, Onset of Proestrus Bleeding*, Photo)
6. **Evaluation Type** — Three colorful cards (Cytology, Progesterone, Vaginoscope—future)
7. **Cytology Calculator** — PC/IC/SIC/SC/CC inputs with live total, donut chart, Cornification Index (SC+CC), validation total=100
8. **Progesterone Calculator** — ng/ml input with live classification preview, full reference table
9. **Result Screen** — Stage-colored banner, recommendation, heat cycle timeline (Anestrus→Diestrus), breeding schedule (mating/next test/whelping dates), cell counts breakdown, patient summary, PDF/WhatsApp/Share/Delete actions
10. **History** — Search by owner/dog/mobile/breed/result, list past evaluations with stage chip
11. **Learning Module** — About Dog Mating, Cytology with detail pages for each cell type (PC/IC/SIC/SC/CC), Progesterone primer
12. **Feedback** — Star rating + comments
13. **Settings** — Profile editor, Dark Mode toggle (system/light/dark), Sync/Backup placeholders, About, Logout
14. **About** — Institution, Faculty, Developer, Disclaimer

## Decision Logic
### Cytology (priority order)
- SC+CC ≥ 80 → **ESTRUS** (confidence 92)
- SC+CC ≥ 60 → Late Proestrus
- SC+CC ≥ 30 → Mid Proestrus
- SC+CC ≥ 10 → Early Proestrus
- PC ≥ 80 & IC ≤ 20 → Anestrus
- PC < 80 & IC > 20 → Diestrus

### Progesterone (ng/ml)
- <0.5 Anestrus, 0.5–1.0 Early Proestrus, 1.1–1.9 Late Proestrus, 2.0–4.0 Estrus, 4.1–18 Estrus/Ovulation, >18 Diestrus

### Breeding Schedule
- Anchored on Proestrus Bleeding Onset Date
- Suggested mating ≈ +10 days from onset, Expected whelping ≈ mating + 63 days

## Stage Colors
- Anestrus #3B82F6, Early Proestrus #A855F7, Mid Proestrus #F97316, Late Proestrus #EAB308, Estrus #22C55E, Diestrus #EF4444

## API Endpoints (all under `/api`)
- `POST /auth/google` — upsert user from Google profile (stub-compatible)
- `POST /users`, `GET /users/{id}`, `PUT /users/{id}`
- `POST /dogs`, `GET /dogs?user_id=`, `GET /dogs/{id}`
- `POST /calc/cytology`, `POST /calc/progesterone`, `POST /calc/combined`
- `POST /evaluations`, `GET /evaluations?user_id=&q=`, `GET /evaluations/{id}`, `DELETE /evaluations/{id}`
- `GET /stats/{user_id}`
- `POST /feedback`

## Pending / Future
- Google Apps Script / Sheets / Drive cloud sync (deferred per user)
- Vaginoscope module (future)
- Tamil language strings
- Real Google ID token verification (requires server-side Google client secret)
- APK/AAB build via Emergent Publish
