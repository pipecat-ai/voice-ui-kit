import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";
import "./theme.css";

export const Provider: GlobalProvider = ({ children, globalState }) => {
  useEffect(() => {
    if (globalState.theme === "dark") {
      document.documentElement.classList.add("vkui:dark");
    } else {
      document.documentElement.classList.remove("vkui:dark");
    }
  }, [globalState.theme]);
  return children;
};
