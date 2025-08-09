import { useEffect, useState } from "react";
import { ThemeProviderContext } from "./ThemeProviderContext";

export type Theme = "dark" | "light" | "system";

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "voice-ui-kit-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage or fall back to defaultTheme
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      return storedTheme || defaultTheme;
    }
    return defaultTheme;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Only store in localStorage if theme is not system, otherwise remove it
    if (theme !== "system") {
      localStorage.setItem(storageKey, theme);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [mounted, storageKey, theme]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("vkui:light", "vkui:dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "vkui:dark"
        : "vkui:light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(`vkui:${theme}`);
  }, [theme, mounted]);

  // Update theme when defaultTheme changes (if needed)
  useEffect(() => {
    if (!mounted) return;
    // Check if localStorage has a value before updating from defaultTheme
    const storedTheme = localStorage.getItem(storageKey);
    if (!storedTheme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, mounted, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    },
    resolvedTheme:
      theme === "system"
        ? typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
