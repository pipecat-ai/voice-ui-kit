import { create } from "zustand";

interface SandboxStore {
  code: string | null;
  setCode: (code: string) => void;
  clearCode: () => void;
}

export const useSandboxStore = create<SandboxStore>((set) => ({
  code: null,
  setCode: (code) => set({ code }),
  clearCode: () => set({ code: null }),
}));
