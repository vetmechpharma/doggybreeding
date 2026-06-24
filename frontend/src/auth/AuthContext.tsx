import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<string>(USER_KEY, "");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as UserProfile;
          // refresh from server
          try {
            const fresh = await api.get<UserProfile>(`/users/${parsed.id}`);
            setUser(fresh);
            await storage.setItem(USER_KEY, JSON.stringify(fresh));
          } catch {
            setUser(parsed);
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (u: UserProfile) => {
    await storage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const register = useCallback(async (input: Partial<UserProfile>) => {
    const payload = {
      name: input.name || "",
      mobile: input.mobile || "",
      email: input.email || "",
      hospital: input.hospital || "",
      category: input.category || "Doctor",
      location: input.location || "",
      state: input.state || "",
      google_id: input.google_id || "",
      photo_url: input.photo_url || "",
    };
    const u = await api.post<UserProfile>("/users", payload);
    await persist(u);
    return u;
  }, [persist]);

  const loginGoogleStub = useCallback(async (profile: { google_id: string; name: string; email?: string; photo_url?: string }) => {
    const u = await api.post<UserProfile>("/auth/google", profile);
    await persist(u);
    return u;
  }, [persist]);

  const updateProfile = useCallback(async (input: Partial<UserProfile>) => {
    if (!user) throw new Error("Not logged in");
    const merged = { ...user, ...input };
    const payload = {
      name: merged.name,
      mobile: merged.mobile,
      email: merged.email,
      hospital: merged.hospital,
      category: merged.category,
      location: merged.location,
      state: merged.state,
      google_id: merged.google_id,
      photo_url: merged.photo_url,
    };
    const u = await api.put<UserProfile>(`/users/${user.id}`, payload);
    await persist(u);
    return u;
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
