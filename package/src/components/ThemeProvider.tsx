import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeProviderContext } from "./ThemeProviderContext";

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

  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const updateFromList = (list: MediaQueryList) => {
      setSystemPrefersDark(list.matches);
    };
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    updateFromList(mediaQueryList);
    if ("addEventListener" in mediaQueryList) {
      mediaQueryList.addEventListener("change", handleChange);
      return () => {
        mediaQueryList.removeEventListener("change", handleChange);
      };
    } else {
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
    const appliedTheme = String(resolvedTheme);

    if (appliedTheme === "light") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", appliedTheme);
    }
  }, [resolvedTheme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!disableStorage) {
      const storedTheme = localStorage.getItem(storageKey);
      if (!storedTheme && theme !== defaultTheme) {
        setTheme(defaultTheme);
      }
    } else if (theme !== defaultTheme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, mounted, storageKey, disableStorage, theme]);

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
