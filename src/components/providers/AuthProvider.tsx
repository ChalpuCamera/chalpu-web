"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthTokens } from "@/utils/nativeBridge";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthContextType {
  tokens: AuthTokens | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  getValidAccessToken: () => Promise<string | null>;
  initializeTokens: () => void;
  tokenExpiryTime: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authValue = useAuth();
  const { initialize, setTokens } = useAuthStore();

  // 초기화 (한 번만 실행)
  useEffect(() => {
    console.log('🔄 [AuthProvider] 초기화 호출');
    initialize();
  }, [initialize]);

  // storage 이벤트 리스너 (다른 탭/창에서 변경 감지)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('🔄 [AuthProvider] storage 이벤트 감지:', e.key);
      
      if (e.key === 'accessToken') {
        if (e.newValue) {
          console.log('🔄 [AuthProvider] 새 토큰 감지, 업데이트');
          const tokenObject: AuthTokens = {
            accessToken: e.newValue,
            refreshToken: "",
            expiresIn: 3600,
            tokenType: "Bearer",
          };
          setTokens(tokenObject);
        } else {
          console.log('🔄 [AuthProvider] 토큰 제거 감지, 로그아웃');
          setTokens(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    console.log('🔄 [AuthProvider] storage 이벤트 리스너 등록');
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      console.log('🔄 [AuthProvider] storage 이벤트 리스너 제거');
    };
  }, [setTokens]);

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// zustand 스토어를 직접 사용하는 방법도 제공
export { useAuthStore } from "@/store/useAuthStore";
