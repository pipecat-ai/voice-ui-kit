import { createContext } from "react";
import type { Theme } from "./ThemeProvider";

type ThemeProviderState = {
  resolvedTheme: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  resolvedTheme: "light",
  theme: "system",
  setTheme: () => null,
};

export const ThemeProviderContext =
  createContext<ThemeProviderState>(initialState);
