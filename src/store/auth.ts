import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "realtron-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Migrate users from old key automatically on first load
      onRehydrateStorage: () => (state) => {
        if (state) return;
        try {
          const old = localStorage.getItem("pakprop-auth");
          if (old) {
            localStorage.setItem("realtron-auth", old);
            localStorage.removeItem("pakprop-auth");
          }
        } catch { /* ignore storage errors */ }
      },
    }
  )
);
