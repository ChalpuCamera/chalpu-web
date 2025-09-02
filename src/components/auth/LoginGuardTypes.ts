import { ReactNode } from "react";
import { AuthTokens } from "@/utils/nativeBridge";
import { User } from "@/lib/api";

export interface LoginGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface AuthState {
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => void;
  setTokens: (tokens: AuthTokens | null) => void;
  clearTokens: () => void;
}

export interface UserState {
  data: User | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface DevModeHandlers {
  handleTestAlert: () => void;
  handleTestBridge: () => void;
  handleTestResponse: () => void;
  handleDiagnose: () => void;
  handleTestToast: () => void;
  handleTestExistingMethods: () => void;
  handleTestCameraSimple: () => void;
  handleTestGallery: () => void;
  handleDevLogin: () => void;
  handleRetryAuth: () => void;
}

export interface CacheInfo {
  count: number;
  isValid: boolean;
  lastUpdate: Date | null;
}