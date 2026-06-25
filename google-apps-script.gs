/**
 * Doggy Breeding App — Google Apps Script web app
 * =================================================
 * Receives JSON POSTs from the mobile app and appends rows to a Google Sheet.
 * No server, no auth keys, no account approval required.
 *
 * SETUP (one-time, ~5 minutes):
 * 1. Open https://sheets.google.com → create a new Spreadsheet, name it
 *    "Doggy Breeding App Data".
 * 2. Copy its URL — you'll only need the long ID between /d/ and /edit.
 *    (You don't actually need to paste the ID here — the script opens the
 *    spreadsheet bound to itself.)
 * 3. In that Spreadsheet: Extensions → Apps Script.
 * 4. Delete the placeholder Code.gs content and paste THIS file's contents.
 * 5. Click Deploy → New deployment → Type "Web app".
 *    - Description: Doggy Breeding App Sync
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone   (the app calls this URL anonymously)
 * 6. Authorize when prompted. Copy the resulting Web App URL — looks like
 *    https://script.google.com/macros/s/AKfycb..../exec
 * 7. Paste that URL into the mobile app's `.env` as:
 *    EXPO_PUBLIC_SHEETS_WEBHOOK=https://script.google.com/macros/s/.../exec
 * 8. Rebuild the APK. Done.
 *
 * Sheet tabs created automatically on first use:
 *   • Users         — one row per registered user
 *   • Evaluations   — one row per cytology / progesterone evaluation
 */

const USERS_SHEET = "Users";
const EVALS_SHEET = "Evaluations";

const USER_HEADERS = [
  "Timestamp", "User ID", "Google ID", "Name", "Email", "Mobile",
  "Category", "Hospital / Clinic / Lab", "Location", "State",
  "Photo URL", "Device ID", "App Version"
];

const EVAL_HEADERS = [
  "Timestamp", "Evaluation ID", "User ID", "User Name", "User Email", "User Mobile",
  "Dog Name", "Owner Name", "Owner Mobile", "Breed", "Age", "Sex", "No. of Whelpings",
  "Previous Whelping Date", "Onset of Proestrus Bleeding Date",
  "Method", "Cell PC", "Cell IC", "Cell SIC", "Cell SC", "Cell CC",
  "Cornification Index (%)", "Progesterone (ng/ml)",
  "Result Stage", "Confidence (%)", "Interpretation", "Recommendation",
  "Breeding Status", "Suggested Mating Date", "Next Evaluation / Test Date",
  "Expected Whelping Date", "Ovulation Prediction"
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const type = body.type;

    if (type === "user") return _appendUser(body.payload);
    if (type === "evaluation") return _appendEvaluation(body.payload);
    return _json({ ok: false, error: "Unknown type: " + type });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Health-check + simple instructions
  return _json({
    ok: true,
    app: "Doggy Breeding App Sync",
    sheets: [USERS_SHEET, EVALS_SHEET],
    hint: "POST JSON: { type: 'user' | 'evaluation', payload: {...} }",
  });
}

function _appendUser(p) {
  const sheet = _getOrCreateSheet(USERS_SHEET, USER_HEADERS);
  sheet.appendRow([
    _now(),
    p.id || "",
    p.google_id || "",
    p.name || "",
    p.email || "",
    p.mobile || "",
    p.category || "",
    p.hospital || "",
    p.location || "",
    p.state || "",
    p.photo_url || "",
    p.device_id || "",
    p.app_version || ""
  ]);
  return _json({ ok: true });
}

function _appendEvaluation(p) {
  const sheet = _getOrCreateSheet(EVALS_SHEET, EVAL_HEADERS);
  const r = p.result || {};
  const i = p.inputs || {};
  sheet.appendRow([
    _now(),
    p.id || "",
    p.user_id || "",
    p.user_name || "",
    p.user_email || "",
    p.user_mobile || "",
    p.dog_name || "",
    p.owner_name || "",
    p.owner_mobile || "",
    p.breed || "",
    p.age || "",
    p.sex || "Female",
    p.whelping_count || "",
    p.previous_whelping_date || "",
    p.proestrus_bleeding_date || "",
    p.type || "",
    i.pc !== undefined ? i.pc : "",
    i.ic !== undefined ? i.ic : "",
    i.sic !== undefined ? i.sic : "",
    i.sc !== undefined ? i.sc : "",
    i.cc !== undefined ? i.cc : "",
    r.cornification_index !== undefined ? r.cornification_index : "",
    i.value !== undefined ? i.value : "",
    r.stage || "",
    r.confidence || "",
    r.interpretation || "",
    r.recommendation || "",
    r.breeding_status || "",
    r.suggested_mating_date || "",
    r.next_evaluation_date || r.next_test_date || "",
    r.expected_whelping_date || "",
    r.ovulation_prediction || ""
  ]);
  return _json({ ok: true });
}

function _getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1E3A8A").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function _now() {
  // Human-friendly: "YYYY-MM-DD HH:MM:SS" in spreadsheet timezone
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
