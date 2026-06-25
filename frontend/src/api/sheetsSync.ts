// Thin Google Sheets sync helper — fire-and-forget POSTs to the Apps Script web app.
// If the webhook URL is not set, calls become no-ops so the app keeps working offline.

const URL = process.env.EXPO_PUBLIC_SHEETS_WEBHOOK || "";

async function send(type: "user" | "evaluation", payload: Record<string, unknown>): Promise<void> {
  if (!URL) return; // not configured yet — silently skip
  try {
    await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
      body: JSON.stringify({ type, payload }),
    });
  } catch {
    // Sheet sync is best-effort. If the device is offline, ignore.
  }
}

export const sheetsSync = {
  user: (payload: Record<string, unknown>) => send("user", payload),
  evaluation: (payload: Record<string, unknown>) => send("evaluation", payload),
  enabled: () => Boolean(URL),
};
