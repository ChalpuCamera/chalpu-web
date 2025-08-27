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

// Store 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // 초기화 함수 정의
      const initializeFromLocalStorage = () => {
        console.log('🚀 [initializeFromLocalStorage] 시작');
        
        try {
          const accessToken = localStorage.getItem("accessToken");
          console.log('🚀 [initializeFromLocalStorage] accessToken:', !!accessToken);
          
          if (accessToken) {
            console.log('🚀 [initializeFromLocalStorage] 토큰 발견, 로그인 상태로 설정');
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
            console.log('🚀 [initializeFromLocalStorage] 완료: 로그인됨');
          } else {
            console.log('🚀 [initializeFromLocalStorage] 토큰 없음, 로그아웃 상태로 설정');
            set({ isLoading: false, isLoggedIn: false, tokens: null });
            console.log('🚀 [initializeFromLocalStorage] 완료: 로그아웃됨');
          }
        } catch (error) {
          console.error('🚀 [initializeFromLocalStorage] 에러:', error);
          set({ isLoading: false, isLoggedIn: false, tokens: null });
        }
      };

      // 즉시 초기화 시도 (브라우저 환경에서만)
      if (typeof window !== 'undefined') {
        console.log('🏗️ [Store] 브라우저 환경 감지, 즉시 초기화 시도');
        setTimeout(() => initializeFromLocalStorage(), 50);
      }

      return {
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


        // 로컬스토리지에서 accessToken 확인 및 자동 로그인 (외부에서 호출 가능)
        initializeFromLocalStorage,

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
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        tokens: state.tokens,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state, error) => {
        console.log('🔄 [Zustand] onRehydrateStorage 호출됨', { state: !!state, error });
        
        if (error) {
          console.error('🔄 [Zustand] 복원 에러:', error);
        }
        
        if (state) {
          console.log('🔄 [Zustand] 상태 복원 성공, 토큰 초기화 실행');
          state.initializeFromLocalStorage();
        } else {
          console.log('🔄 [Zustand] 상태 없음 - 새 설치로 간주');
          // 새 설치인 경우 직접 초기화
          setTimeout(() => {
            const currentState = useAuthStore.getState();
            currentState.initializeFromLocalStorage();
          }, 100);
        }
      },
    }
  )
);
