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
  initializeFromLocalStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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


      // 로컬스토리지에서 accessToken 확인 및 자동 로그인
      initializeFromLocalStorage: () => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          const tokenObject = {
            accessToken: accessToken,
            refreshToken: "",
            expiresIn: 3600,
            tokenType: "Bearer",
          };
          set({
            tokens: tokenObject,
            isLoggedIn: true,
            isLoading: false,
          });
          // 토큰 생성 시간이 없으면 현재 시간으로 설정
          if (!localStorage.getItem("auth-storage-timestamp")) {
            localStorage.setItem(
              "auth-storage-timestamp",
              Date.now().toString()
            );
          }
        } else {
          set({ isLoading: false });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearTokens: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("auth-storage-timestamp");
        set({
          tokens: null,
          isLoggedIn: false,
          isLoading: false,
        });
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
          state.setLoading(false);
        }
      },
    }
  )
);
