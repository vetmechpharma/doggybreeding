# Google Sheets Setup Guide — Doggy Breeding App

Set up a Google Sheet that automatically receives every user registration and every evaluation done in your app. **No server. No OAuth keys. ~10 minutes total.**

---

## What you'll have when you finish

A Google Sheet titled "Doggy Breeding App Data" with two tabs:
- **Users** — one row per registered user (timestamp, name, mobile, email, category, hospital, state, etc.)
- **Evaluations** — one row per cytology/progesterone evaluation (timestamp, vet name, dog name, owner, breed, all measurements, **stage, recommendation, status, all dates**)

Data is **append-only** — even if a user uninstalls the app, your sheet keeps everything.

---

## STEP 1 — Create the Google Sheet (1 min)

1. Open https://sheets.google.com in your browser.
2. Sign in with the Google account you want to own the data (use your own ANIMitra / personal Gmail).
3. Click **+ Blank spreadsheet** (top-left, big rainbow plus).
4. At the top-left where it says "Untitled spreadsheet", click and rename to:
   ```
   Doggy Breeding App Data
   ```

You don't have to create the Users / Evaluations tabs — the Apps Script creates them automatically on first sync.

---

## STEP 2 — Open Apps Script (30 sec)

1. In the spreadsheet, click the **Extensions** menu in the top bar.
2. Click **Apps Script**.
3. A new tab opens showing a code editor with `Code.gs` and a default `myFunction() {}` block.

---

## STEP 3 — Paste the script (30 sec)

1. In the Apps Script editor, **select all** the placeholder code (`Ctrl+A` / `Cmd+A`) and delete it.
2. Open `/app/google-apps-script.gs` from your Emergent project (or grab it from your GitHub repo).
3. **Copy the entire file** and **paste it** into the empty Apps Script editor.
4. (Optional) Click the project name at the top-left ("Untitled project") and rename to **Doggy Breeding Sync**.
5. Click the **floppy-disk Save icon** (or `Ctrl+S` / `Cmd+S`).

---

## STEP 4 — Deploy as a Web App (3 min)

1. Top-right of the Apps Script editor, click the blue **Deploy** button.
2. Click **New deployment**.
3. Next to "Select type", click the small **⚙️ gear icon** → choose **Web app**.
4. Fill the deployment form:

   | Field | Value |
   |---|---|
   | Description | `Doggy Breeding App Sync v1` |
   | **Execute as** | **Me (your@gmail.com)** — important |
   | **Who has access** | **Anyone** — important; the phone app calls anonymously |

5. Click **Deploy**.

### 4a — First-time authorization prompts

Google will now ask you to authorize the script to write to your sheet.

1. A popup says "Authorize access". Click **Authorize access**.
2. Pick your Google account.
3. You'll see a **scary "Google hasn't verified this app"** warning. This is normal — the script is yours, not a third party.
4. Click **Advanced** (small link, bottom-left).
5. Click **Go to Doggy Breeding Sync (unsafe)**.
6. Click **Allow** to grant Sheets access.

### 4b — Copy the Web App URL

After authorizing you'll see a green panel with **Web app URL**:
```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
```

Click **Copy** next to that URL. Keep this URL safe — this is what your app POSTs to.

7. Click **Done**.

---

## STEP 5 — Test the Web App in your browser (30 sec)

1. Paste the URL you just copied into a new browser tab and press Enter.
2. You should see a JSON response like:
   ```json
   {"ok":true,"app":"Doggy Breeding App Sync","sheets":["Users","Evaluations"],"hint":"POST JSON: { type: 'user' | 'evaluation', payload: {...} }"}
   ```

If you see that, the script is live. ✅
If you see "Authorization required" or an error, redo Step 4a (the access scope wasn't approved).

---

## STEP 6 — Add the URL to your app's `.env` (30 sec)

1. In your Emergent project (or your local clone), open `/app/frontend/.env`.
2. Add this line (replace with YOUR actual URL):
   ```
   EXPO_PUBLIC_SHEETS_WEBHOOK=https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```
3. Save the file.

> ⚠️ The variable name **must** start with `EXPO_PUBLIC_` — that's how Expo embeds it into the built APK.

---

## STEP 7 — Rebuild the APK (10 min)

The URL is baked in at build time, so a rebuild is required.

### If you build via Emergent Publish:
1. Top-right of Emergent → **Publish** → Android → APK.
2. Wait for build → download → install on phone (uninstall the old version first if you want a clean slate).

### If you build with EAS CLI locally:
```bash
cd frontend
git pull                                            # if pulling from GitHub
eas build --platform android --profile preview
```
Download the new APK and install on your phone.

---

## STEP 8 — Verify the sync works (1 min)

1. Open the app on your phone.
2. Tap **Continue without Google** → fill the registration form (name, mobile, email, category, location, state) → **Save & Continue**.
3. Go back to your Google Sheet.
4. You'll see a new **"Users"** tab appear with a row containing your registration (timestamp, name, mobile, email, category, hospital, location, state, etc.).
5. In the app: do a quick cytology evaluation (any dog name, any owner, sum cells to 100) and submit.
6. The sheet now has an **"Evaluations"** tab too, with the dog details, the stage, confidence, interpretation, recommendation, and all the dates.

🎉 You're done. From now on every user registration and every evaluation auto-appends to this sheet.

---

## Quick reference — what gets written

### Users sheet — 13 columns
| Timestamp | User ID | Google ID | Name | Email | Mobile | Category | Hospital / Clinic / Lab | Location | State | Photo URL | Device ID | App Version |

### Evaluations sheet — 32 columns
| Timestamp | Evaluation ID | User ID | User Name | User Email | User Mobile | Dog Name | Owner Name | Owner Mobile | Breed | Age | Sex | No. of Whelpings | Previous Whelping Date | Onset of Proestrus Bleeding Date | Method | Cell PC | Cell IC | Cell SIC | Cell SC | Cell CC | Cornification Index (%) | Progesterone (ng/ml) | Result Stage | Confidence (%) | Interpretation | Recommendation | Breeding Status | Suggested Mating Date | Next Evaluation / Test Date | Expected Whelping Date | Ovulation Prediction |

All dates are stored as plain text (YYYY-MM-DD or full timestamps) so Excel / Sheets don't reformat them.

---

## Updating the script later

If you want to add new columns, change the headers, etc.:
1. Edit `/app/google-apps-script.gs` in your project.
2. Paste the new code into the same Apps Script editor.
3. **Deploy → Manage deployments → click the pencil icon next to the current deployment → Version: "New version" → Deploy.**
   - The URL stays the same — you don't need to update `.env` again.
   - If you create a brand-new deployment instead, you'll get a NEW URL and have to update `.env` + rebuild.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `{"ok":false,"error":"..."}` JSON when visiting the URL | Apps Script error | Open Apps Script → Executions tab → click latest red row → read the stack trace |
| Sheet stays empty after using the app | URL not embedded in APK, OR `.env` variable misspelled | Confirm `.env` contains `EXPO_PUBLIC_SHEETS_WEBHOOK=https://...` with NO quotes, then **rebuild** (env vars are baked into the build) |
| "Authorization required" page when visiting the URL | Deploy "Who has access" was set wrong | Apps Script → Deploy → Manage deployments → edit → set **Who has access: Anyone** → Deploy |
| Want to wipe and start over | — | Right-click the Users / Evaluations tab → Delete sheet → next sync recreates them |
| Want a separate sheet for testing vs production | — | Create another Spreadsheet → another Apps Script → another deployment URL → swap the URL in `.env` when you want to switch |

---

## What this setup does NOT do (read carefully)

- ❌ **Does not** authenticate users with real Google Sign-In — the app still uses "Continue without Google" and asks them to fill name/mobile/email manually. If you want their email to be auto-pulled from their Google account (no typing), you need **real Google Sign-In** which requires OAuth client IDs (separate setup, ~15 min). Tell me when you want that wired.
- ❌ **Does not** read data from the sheet back into the app — it's write-only. The app's History tab still reads from local phone storage. If a user uninstalls + reinstalls, their phone history is gone but **your master sheet keeps everything**.
- ❌ **Does not** require any monthly cost — Google Apps Script is free up to ~20,000 calls/day (you'll never hit this).

---

## Privacy note for users

The data being sent to your sheet is the same data the user enters in the app (name, mobile, email, dog details, evaluation results). You should:
- Tell users in your app's "About" / privacy section that registration + evaluation data is stored in a Google Sheet you control.
- Don't put any payment / sensitive financial info in there.
- Restrict edit access to the spreadsheet (Share → only your team).

---

That's the entire setup. After Step 6 + rebuild, you can forget this exists — every new user and every evaluation lands in your sheet automatically.

— ANIMitra Software · For VCRI Namakkal
