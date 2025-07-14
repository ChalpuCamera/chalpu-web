import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthTokens } from "@/utils/nativeBridge";

interface AuthState {
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  clearTokens: () => void;
  isTokenExpired: () => boolean;
  getTokenExpiryTime: () => number | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      isLoggedIn: false,
      isLoading: true,

      setTokens: (tokens) => {
        set({
          tokens,
          isLoggedIn: tokens !== null,
          isLoading: false,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearTokens: () => {
        set({
          tokens: null,
          isLoggedIn: false,
          isLoading: false,
        });
      },

      isTokenExpired: () => {
        const state = get();
        if (!state.tokens) return true;

        const expiryTime = state.tokens.expiresIn * 1000;
        const tokenCreateTime = localStorage.getItem("auth-storage-timestamp");

        if (!tokenCreateTime) return true;

        const currentTime = Date.now();
        const tokenAge = currentTime - parseInt(tokenCreateTime);

        return tokenAge >= expiryTime;
      },

      getTokenExpiryTime: () => {
        const state = get();
        if (!state.tokens) return null;

        const tokenCreateTime = localStorage.getItem("auth-storage-timestamp");
        if (!tokenCreateTime) return null;

        return parseInt(tokenCreateTime) + state.tokens.expiresIn * 1000;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        tokens: state.tokens,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 토큰 만료 확인
          if (state.isTokenExpired()) {
            state.clearTokens();
          }
          state.setLoading(false);
        }
      },
    }
  )
);
