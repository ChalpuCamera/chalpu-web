"use client";

import React, { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthTokens } from "@/utils/nativeBridge";

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
