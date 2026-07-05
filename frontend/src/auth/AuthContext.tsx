import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { sheetsSync } from "@/src/api/sheetsSync";

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email: string;
  hospital: string;
  category: string;
  location: string;
  state: string;
  google_id: string;
  photo_url: string;
  registration_date: string;
}

interface AuthCtx {
  user: UserProfile | null;
  loading: boolean;
  register: (input: Partial<UserProfile>) => Promise<UserProfile>;
  loginGoogleStub: (profile: { google_id: string; name: string; email?: string; photo_url?: string }) => Promise<UserProfile>;
  updateProfile: (input: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const USER_KEY = "current_user";

const uuid = () => {
  // RFC4122 v4-ish — good enough for a per-device user id
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<string>(USER_KEY, "");
      if (stored) {
        try {
          setUser(JSON.parse(stored) as UserProfile);
        } catch {
          // fallthrough to create anonymous
        }
      }
      // Auto-create anonymous local user if none exists — no sign-in required.
      const cur = stored ? (() => { try { return JSON.parse(stored) as UserProfile; } catch { return null; } })() : null;
      if (!cur) {
        const anon: UserProfile = {
          id: uuid(),
          name: "Veterinarian",
          mobile: "",
          email: "",
          hospital: "",
          category: "Doctor",
          location: "",
          state: "",
          google_id: "",
          photo_url: "",
          registration_date: new Date().toISOString(),
        };
        await storage.setItem(USER_KEY, JSON.stringify(anon));
        setUser(anon);
      }
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (u: UserProfile) => {
    await storage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const register = useCallback(async (input: Partial<UserProfile>) => {
    // Fully local — no backend dependency. Data lives on this phone + syncs to
    // Google Sheets (if EXPO_PUBLIC_SHEETS_WEBHOOK is configured).
    const existing = user;
    const u: UserProfile = {
      id: existing?.id || uuid(),
      name: input.name || existing?.name || "",
      mobile: input.mobile || existing?.mobile || "",
      email: input.email || existing?.email || "",
      hospital: input.hospital ?? existing?.hospital ?? "",
      category: input.category || existing?.category || "Doctor",
      location: input.location || existing?.location || "",
      state: input.state || existing?.state || "",
      google_id: input.google_id || existing?.google_id || "",
      photo_url: input.photo_url || existing?.photo_url || "",
      registration_date: existing?.registration_date || new Date().toISOString(),
    };
    await persist(u);
    sheetsSync.user({ ...u, app_version: "1.0.0" });
    return u;
  }, [user, persist]);

  const loginGoogleStub = useCallback(async (profile: { google_id: string; name: string; email?: string; photo_url?: string }) => {
    // Create or hydrate a local user record. No network call.
    const u: UserProfile = {
      id: uuid(),
      google_id: profile.google_id,
      name: profile.name,
      mobile: "",
      email: profile.email || "",
      hospital: "",
      category: "Doctor",
      location: "",
      state: "",
      photo_url: profile.photo_url || "",
      registration_date: new Date().toISOString(),
    };
    await persist(u);
    return u;
  }, [persist]);

  const updateProfile = useCallback(async (input: Partial<UserProfile>) => {
    if (!user) throw new Error("Not logged in");
    const merged: UserProfile = { ...user, ...input };
    await persist(merged);
    sheetsSync.user({ ...merged, app_version: "1.0.0" });
    return merged;
  }, [user, persist]);

  const logout = useCallback(async () => {
    await storage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, register, loginGoogleStub, updateProfile, logout }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
};
