import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";

import "./styles.css";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  useEffect(() => {
    if (globalState.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [globalState.theme]);
  return children;
};
