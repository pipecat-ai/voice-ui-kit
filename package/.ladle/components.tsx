import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";
import "./theme.css";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  useEffect(() => {
    if (globalState.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [globalState.theme]);
  return children;
};
