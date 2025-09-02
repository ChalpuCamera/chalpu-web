import { create } from "zustand";
import { AuthTokens } from "@/utils/nativeBridge";

interface AuthState {
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  clearTokens: () => void;
}

// Store 생성 (persist 미들웨어 제거)
export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: null,
  isLoggedIn: false,
  isLoading: true,
  isInitialized: false,

  // 초기화 메서드 (한 번만 실행)
  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) {
      console.log('🚀 [initialize] 이미 초기화됨, 스킵');
      return; // 중복 실행 방지
    }

    console.log('🚀 [initialize] 초기화 시작');
    
    try {
      const accessToken = localStorage.getItem("accessToken");
      console.log('🚀 [initialize] accessToken 존재:', !!accessToken);
      
      if (accessToken) {
        console.log('🚀 [initialize] 토큰 발견, 로그인 상태로 설정');
        const tokenObject: AuthTokens = {
          accessToken: accessToken,
          refreshToken: "",
          expiresIn: 3600,
          tokenType: "Bearer",
        };
        
        set({
          tokens: tokenObject,
          isLoggedIn: true,
          isLoading: false,
          isInitialized: true,
        });
        
        console.log('🚀 [initialize] 초기화 완료: 로그인됨');
      } else {
        console.log('🚀 [initialize] 토큰 없음, 로그아웃 상태로 설정');
        set({ 
          isLoading: false, 
          isLoggedIn: false,
          tokens: null,
          isInitialized: true 
        });
        console.log('🚀 [initialize] 초기화 완료: 로그아웃됨');
      }
    } catch (error) {
      console.error('🚀 [initialize] 초기화 실패:', error);
      set({ 
        isLoading: false, 
        isLoggedIn: false,
        tokens: null,
        isInitialized: true 
      });
    }
  },

  setTokens: (tokens) => {
    console.log('🚀 [setTokens] 토큰 설정:', !!tokens);
    
    if (tokens) {
      // localStorage에 저장
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("auth-storage-timestamp", Date.now().toString());
    } else {
      // localStorage에서 제거
      localStorage.removeItem("accessToken");
      localStorage.removeItem("auth-storage-timestamp");
    }
    
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
    console.log('🚀 [clearTokens] 토큰 제거');
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth-storage-timestamp");
    set({
      tokens: null,
      isLoggedIn: false,
      isLoading: false,
    });
  },
}));