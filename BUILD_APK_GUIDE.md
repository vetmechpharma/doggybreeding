# Doggy Breeding App — Android APK / AAB Build Guide

This app is an **Expo React Native** project. The fastest and recommended way to generate the Android APK / AAB is through the **Emergent Publish** flow (no Android Studio, no manual signing, no CLI gymnastics).

---

## OPTION A — Publish & Build via Emergent (RECOMMENDED)

This is the path you should use. It builds, signs, and gives you a downloadable APK / AAB ready for Play Store upload.

### Step 1 — Click "Publish" in Emergent
- In the Emergent web UI, look at the **top-right corner**.
- Click the **Publish** (or **Deploy / Build**) button.

### Step 2 — Choose the platform
- Select **Android** when prompted.
- You can pick:
  - **APK** — installable directly on a phone (best for testing on your own device, sharing for internal trials).
  - **AAB** (Android App Bundle) — the format required by Google Play Store.

### Step 3 — App details (auto-filled from `app.json`)
- Emergent reads these from `/app/frontend/app.json`:
  - **App name:** Doggy Breeding App
  - **Package / bundle identifier:** e.g. `com.animitra.doggybreeding` (set this once)
  - **Version code / version name:** e.g. `1.0.0`
- Verify these are correct. If you want a different package id, edit `app.json` first.

### Step 4 — Sign-in keys
- For first build, Emergent will create a new Android keystore for you and keep it associated with this project. Subsequent builds will reuse the same keystore (so updates are accepted by Play Store).
- **Save / back up** the keystore that Emergent shows you — you'll need it for all future updates of the same app.

### Step 5 — Build
- Hit **Build**. The build runs on Emergent's cloud (no local Android SDK needed).
- Typical build time: **8–20 minutes**.

### Step 6 — Download
- When the build finishes, you'll see a **Download APK** / **Download AAB** button.
- Download the file to your computer.

### Step 7 — Install on your phone (APK)
- Transfer the `.apk` to your Android phone (USB, email, Google Drive, WhatsApp).
- On the phone: open the file → "Allow installation from this source" → Install.
- Open **Doggy Breeding App** from your home screen.

### Step 8 — Submit to Google Play (AAB)
- Sign in to the [Google Play Console](https://play.google.com/console).
- Create a new app → upload the `.aab` to the Internal/Closed/Production track.
- Fill in store listing (description, screenshots, icon, privacy policy URL).
- Submit for review.

---

## OPTION B — EAS Build CLI (advanced, not needed unless Option A is unavailable)

Only use this if you specifically want to build outside Emergent.

```bash
# On your local machine (one-time setup)
npm install -g eas-cli
eas login                  # log in to your own Expo account
cd /path/to/app/frontend
eas build:configure        # creates eas.json
eas build -p android --profile production   # for AAB
eas build -p android --profile preview      # for APK
```
This requires your own Expo account, Expo project ID, and credentials configuration. Emergent already handles all of this in Option A.

---

## Pre-flight checklist before building

1. **`/app/frontend/app.json`**
   - `name`, `slug`, `version`, `android.package` are filled.
   - `android.permissions` includes anything you use (camera, etc.).
   - `icon`, `splash.image`, `adaptiveIcon.foregroundImage` point to real PNG assets.
2. **`/app/frontend/.env`** (if you've added Google OAuth client IDs)
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
3. **Backend URL** in `.env` (`EXPO_PUBLIC_BACKEND_URL`) is reachable from public internet — Emergent auto-deploys the backend together with the build, so this is normally automatic.
4. **App icon** (1024×1024 PNG) and **splash screen** look correct in the preview.

---

## Notes specific to this project

- **Print / Share / WhatsApp share** features require a real device build — they don't fully work inside the web preview (web doesn't expose the native share sheet or PDF print dialog). They will work once you install the APK on a real phone.
- **Google Sign-In** will not work until you add the three OAuth client IDs to `/app/frontend/.env` (the button is intentionally disabled in the UI until that's done).
- **Storage** is MongoDB on Emergent. Google Sheets / Drive sync is not built yet (deferred).

---

## Need help?

- **Build failed?** Click "Logs" on the build page in Emergent — share the error with us, we'll help debug.
- **App opens but crashes?** Check `EXPO_PUBLIC_BACKEND_URL` in the built `.env`, and look at backend logs via the Emergent deployment dashboard.

— Built by ANIMitra Software for VCRI Namakkal, Dept. of Veterinary Gynaecology and Obstetrics
