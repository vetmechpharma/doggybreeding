# Build Doggy Breeding App APK Locally — Full Guide

This guide takes you from "code on Emergent" → "APK on your phone" using your own computer, your own GitHub, and Expo's EAS Build service.

---

## What you'll need (one-time setup)

| Tool | Why | Where to get |
|---|---|---|
| Node.js 20 LTS | Runs Expo / EAS CLI | https://nodejs.org |
| Git | Clone the repo | https://git-scm.com |
| A GitHub account | Host your code | https://github.com |
| An Expo account (free) | Run EAS Build (cloud APK builder) | https://expo.dev/signup |
| (optional) Android Studio | Only if you want to build APK on your own laptop without using Expo's cloud. Most users don't need this. | https://developer.android.com/studio |

> **TL;DR — you do not need Android Studio.** EAS Build runs the build in Expo's cloud (free tier available) and gives you a downloadable APK. Your laptop only needs Node + Git.

---

## Step 1 — Push the code from Emergent to your GitHub

1. In the **Emergent UI (top right)** click **Save to GitHub** (or the GitHub icon).
2. Authorize Emergent to access your GitHub.
3. Choose a repo name, e.g. `doggy-breeding-app`. Make it **Private** if you don't want it public.
4. Click **Save**. After a minute the repo appears in your GitHub account with the full project.

If the menu doesn't show "Save to GitHub", ask the agent: *"Help me save this project to GitHub."*

---

## Step 2 — Clone the repo on your computer

Open a terminal:

```bash
# replace YOUR-USERNAME with your GitHub username
git clone https://github.com/YOUR-USERNAME/doggy-breeding-app.git
cd doggy-breeding-app
```

You should see the folders: `backend/`, `frontend/`, `app/`, etc.

---

## Step 3 — Install dependencies

```bash
cd frontend
yarn install        # the project uses yarn (per packageManager field)
```

This takes 2-5 minutes the first time.

---

## Step 4 — Create your Expo account & install EAS CLI

```bash
npm install -g eas-cli
eas login           # use the email + password you set on expo.dev
```

Verify you're logged in:
```bash
eas whoami
```

You should see your Expo username.

---

## Step 5 — Configure the project for EAS Build

Still inside `frontend/`:

```bash
eas init
```

This will:
- Ask you to pick the Expo account (yours)
- Create an **Expo project** under your account
- Add an `extra.eas.projectId` field to your `app.json`

When prompted "Would you like to automatically create an EAS project?" → **Yes**.

Then:

```bash
eas build:configure
```

This creates an `eas.json` file at `frontend/eas.json` with default build profiles. The default file already has the three profiles you'll want (`development`, `preview`, `production`).

If `eas.json` doesn't include an APK profile, edit it to look like this:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": { "production": {} }
}
```

- `preview` → produces an **APK** (best for testing on your own phone).
- `production` → produces an **AAB** (required for Google Play upload).

---

## Step 6 — Set environment variables for the build

The frontend reads `EXPO_PUBLIC_BACKEND_URL` from `.env`. Two options:

### Option A — point at your live Emergent backend (easiest)
Get the public URL of your Emergent backend (the one with `/api`). It looks like `https://canine-cycle.preview.emergentagent.com`. Create `frontend/.env`:

```bash
EXPO_PUBLIC_BACKEND_URL=https://canine-cycle.preview.emergentagent.com
```

(Optional, only if you've created Google OAuth client IDs):
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

### Option B — host your own backend
Deploy `backend/` to a server (Render, Railway, Fly.io, your own VPS). Set `EXPO_PUBLIC_BACKEND_URL` to that URL. Make sure CORS is open (it already is in `server.py`).

> ⚠️ Don't commit `.env` to GitHub. Keep it local. EAS Build picks it up automatically because variables starting with `EXPO_PUBLIC_` are embedded into the JS bundle at build time.

---

## Step 7 — Confirm `app.json` looks right

Open `frontend/app.json` and verify:

```json
{
  "expo": {
    "name": "Doggy Breeding App",
    "slug": "doggy-breeding-app",
    "version": "1.0.0",
    "android": {
      "package": "com.animitra.doggybreeding",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.animitra.doggybreeding"
    }
  }
}
```

(I already set this in your Emergent project.)

**Important:** every time you push a new APK update, increment `android.versionCode` (1 → 2 → 3 …).

---

## Step 8 — Build the APK

```bash
# from inside frontend/
eas build --platform android --profile preview
```

What happens:
1. EAS uploads your project to Expo's cloud build servers.
2. First time only: it asks "Generate a new Android Keystore?" → **Yes**. Expo securely stores the keystore for you (you can also export it later).
3. It builds. The terminal shows a URL like `https://expo.dev/accounts/.../projects/.../builds/abcd1234` — click it to follow live logs in your browser.
4. Build time: **10–20 minutes** (free tier may queue for a few minutes first).

When done, the build page shows a **Download** button for the `.apk` file.

---

## Step 9 — Install the APK on your Android phone

### Easiest way (no cable):

1. On the build page, click **Download** to get the `.apk` to your computer.
2. Upload it to your Google Drive / send via WhatsApp/email to yourself.
3. On the phone, download the `.apk` and tap it.
4. Android will ask you to allow "Install from unknown sources" the first time — say yes, then install.
5. Open the app from the home screen.

### Via USB cable + ADB (developer way):

```bash
adb install ./doggy-breeding-app-preview.apk
```

(ADB ships with Android Studio's command-line tools, or `brew install --cask android-platform-tools` on macOS.)

---

## Step 10 — Iterating: making changes and rebuilding

```bash
# 1. edit code locally
# 2. bump versionCode in app.json (e.g. 1 → 2)
# 3. push to GitHub
git add .
git commit -m "v1.0.1 — bug fix"
git push

# 4. rebuild
eas build --platform android --profile preview
```

Pull new APK and reinstall on the phone (you don't have to uninstall; signed updates install over the previous version).

---

## Step 11 — Building for Google Play Store (AAB)

```bash
eas build --platform android --profile production
```

This produces an **`.aab`** instead of `.apk`. Upload it in [Google Play Console](https://play.google.com/console) → your app → Internal/Closed/Production track. First-time submission needs:
- Privacy policy URL
- Store listing (title, short description, full description)
- 2 screenshots minimum
- High-res app icon (512×512)
- Feature graphic (1024×500)
- Content rating questionnaire

---

## Step 12 — Submitting to Play Store with EAS (optional, fully CLI)

```bash
eas submit --platform android --latest
```

You'll be asked for:
- Google service account JSON (one-time setup — Play Console → API access → create service account → download JSON)
- The track (internal / alpha / beta / production)

EAS handles the upload for you.

---

## Common errors & fixes

| Error | Fix |
|---|---|
| `Configuration must contain "android.package"` | Already set, but verify `app.json` was committed to git before `eas build`. |
| `Invalid keystore` | Run `eas credentials` → Android → manage credentials → "Set up a new keystore". |
| App opens but blank white screen on phone | `EXPO_PUBLIC_BACKEND_URL` missing or wrong — rebuild after adding it to `.env`. |
| `Network request failed` inside app | Backend URL not reachable from phone — use a public HTTPS URL, not `localhost`. |
| `versionCode is not greater than previous` (Play Store) | Bump `android.versionCode` in `app.json`. |
| First build queues forever | Free tier has a wait queue at busy times. Either wait or upgrade Expo plan. |

---

## Quick command cheat-sheet

```bash
# one-time
npm install -g eas-cli
eas login

# in the project
cd doggy-breeding-app/frontend
yarn install
eas init
eas build:configure

# every build
eas build --platform android --profile preview     # APK
eas build --platform android --profile production  # AAB
eas build:list                                     # see all your builds
eas credentials                                    # manage keystore
eas submit --platform android --latest             # upload to Play Store
```

---

## Need help?

- **EAS docs:** https://docs.expo.dev/build/setup/
- **Expo Discord:** https://chat.expo.dev/
- **Ask the Emergent agent:** paste any build error in chat — I can debug `app.json`, `eas.json`, `package.json` or `.env` issues for you.

— Built for ANIMitra Software / VCRI Namakkal
