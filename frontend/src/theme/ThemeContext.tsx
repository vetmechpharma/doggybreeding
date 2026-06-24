import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, ThemeShape } from "./index";
import { storage } from "@/src/utils/storage";

type Mode = "system" | "light" | "dark";

interface ThemeCtx {
  theme: ThemeShape;
  mode: Mode;
  setMode: (m: Mode) => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    storage.getItem<string>("theme_mode", "system").then((v) => {
      if (v === "light" || v === "dark" || v === "system") setModeState(v);
    });
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    storage.setItem("theme_mode", m);
  };

  const resolved = mode === "system" ? system ?? "light" : mode;
  const theme = resolved === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({ theme, mode, setMode, isDark: resolved === "dark" }),
    [theme, mode, resolved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
};
