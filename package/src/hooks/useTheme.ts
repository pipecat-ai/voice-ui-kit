import { useContext } from "react";
import type { Theme } from "../components/ThemeProvider";
import { ThemeProviderContext } from "../components/ThemeProviderContext";

export type { Theme };

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
