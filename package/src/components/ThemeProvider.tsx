import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProviderContext } from "./ThemeProviderContext";

// Allow arbitrary theme names while keeping a special "system" value
export type Theme = "system" | (string & {});

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableStorage?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "voice-ui-kit-theme",
  disableStorage = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage or fall back to defaultTheme
    if (typeof window !== "undefined" && !disableStorage) {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      return storedTheme || defaultTheme;
    }
    return defaultTheme;
  });
  const [mounted, setMounted] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track system theme only when using system mode
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const updateFromList = (list: MediaQueryList) => {
      setSystemPrefersDark(list.matches);
    };
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    // Initialize with current value
    updateFromList(mediaQueryList);

    // Subscribe to changes (with cross-browser support)
    if ("addEventListener" in mediaQueryList) {
      mediaQueryList.addEventListener("change", handleChange);
      return () => {
        mediaQueryList.removeEventListener("change", handleChange);
      };
    } else {
      // Fallback for older browsers
      // @ts-expect-error addListener is deprecated but still present in some environments
      mediaQueryList.addListener(handleChange);
      return () => {
        // @ts-expect-error removeListener is deprecated but still present in some environments
        mediaQueryList.removeListener(handleChange);
      };
    }
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted || disableStorage) return;

    // Only store in localStorage if theme is not system, otherwise remove it
    if (theme !== "system") {
      localStorage.setItem(storageKey, theme);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [mounted, storageKey, theme, disableStorage]);

  const resolvedTheme = useMemo<Theme>(
    () => (theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme),
    [theme, systemPrefersDark],
  );

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    // Track and remove previously applied theme class to avoid buildup
    const previousThemeClass = previousThemeRef.current;
    if (previousThemeClass) {
      root.classList.remove(previousThemeClass);
    }

    const appliedThemeClass = String(resolvedTheme);

    root.classList.add(appliedThemeClass);
    previousThemeRef.current = appliedThemeClass;
  }, [resolvedTheme, mounted]);

  // Update theme when defaultTheme changes (if needed)
  useEffect(() => {
    if (!mounted) return;
    // Check if localStorage has a value before updating from defaultTheme
    if (!disableStorage) {
      const storedTheme = localStorage.getItem(storageKey);
      if (!storedTheme && theme !== defaultTheme) {
        setTheme(defaultTheme);
      }
    } else if (theme !== defaultTheme) {
      // When storage is disabled, reflect defaultTheme changes immediately
      setTheme(defaultTheme);
    }
  }, [defaultTheme, mounted, storageKey, disableStorage, theme]);

  const previousThemeRef = useRef<string | null>(null);

  const setThemeStable = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeStable,
      resolvedTheme,
    }),
    [theme, setThemeStable, resolvedTheme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
