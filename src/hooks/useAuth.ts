import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useAuthStore } from "@/store/useAuthStore";
import { userKeys } from "@/hooks/useUserInfo";

export const useAuth = () => {
  const { bridge, isAvailable } = useNativeBridge();
  const queryClient = useQueryClient();
  const {
    tokens,
    isLoggedIn,
    isLoading,
    setTokens,
    setLoading,
    clearTokens,
    isTokenExpired,
    getTokenExpiryTime,
  } = useAuthStore();

  // 토큰 초기화
  const initializeTokens = useCallback(async () => {
    setLoading(true);

    try {
      // 현재 토큰이 유효한지 확인
      if (tokens && !isTokenExpired()) {
        setLoading(false);
        return;
      }

      // 토큰이 만료되었거나 없으면 네이티브에서 새로 가져오기
      if (isAvailable) {
        if (tokens?.refreshToken) {
          // 리프레시 토큰이 있으면 갱신 시도
          try {
            const newTokens = await bridge.refreshAuthToken(
              tokens.refreshToken
            );
            setTokens(newTokens);
            // 토큰 생성 시간 저장
            localStorage.setItem(
              "auth-storage-timestamp",
              Date.now().toString()
            );
          } catch (error) {
            console.warn("토큰 갱신 실패:", error);
            // 갱신 실패 시 네이티브에서 새로 가져오기
            try {
              const nativeTokens = await bridge.getAuthTokens();
              setTokens(nativeTokens);
              localStorage.setItem(
                "auth-storage-timestamp",
                Date.now().toString()
              );
            } catch (nativeError) {
              console.warn("네이티브 토큰 가져오기 실패:", nativeError);
              clearTokens();
            }
          }
        } else {
          // 네이티브에서 토큰 가져오기
          try {
            const nativeTokens = await bridge.getAuthTokens();
            setTokens(nativeTokens);
            localStorage.setItem(
              "auth-storage-timestamp",
              Date.now().toString()
            );
          } catch (error) {
            console.warn("네이티브 토큰 가져오기 실패:", error);
            clearTokens();
          }
        }
      } else {
        // 네이티브 브릿지가 없으면 로그아웃 상태
        clearTokens();
      }
    } catch (error) {
      console.error("토큰 초기화 실패:", error);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, [
    bridge,
    isAvailable,
    tokens,
    setTokens,
    setLoading,
    clearTokens,
    isTokenExpired,
  ]);

  // 토큰 갱신
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !tokens?.refreshToken) {
      return false;
    }

    try {
      const newTokens = await bridge.refreshAuthToken(tokens.refreshToken);
      setTokens(newTokens);
      localStorage.setItem("auth-storage-timestamp", Date.now().toString());
      return true;
    } catch (error) {
      console.error("토큰 갱신 실패:", error);
      clearTokens();
      return false;
    }
  }, [bridge, isAvailable, tokens?.refreshToken, setTokens, clearTokens]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      if (isAvailable) {
        await bridge.logout();
      }
    } catch (error) {
      console.warn("네이티브 로그아웃 실패:", error);
    } finally {
      clearTokens();
      localStorage.removeItem("auth-storage-timestamp");

      // 사용자 정보 캐시 삭제
      queryClient.removeQueries({ queryKey: userKeys.all });

      // 모든 인증 관련 캐시 삭제
      queryClient.clear();
    }
  }, [bridge, isAvailable, clearTokens, queryClient]);

  // 유효한 액세스 토큰 가져오기 (자동 갱신 포함)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;

    // 토큰이 만료되지 않았으면 그대로 반환
    if (!isTokenExpired()) {
      return tokens.accessToken;
    }

    // 토큰이 만료되었으면 갱신 시도
    const refreshSuccess = await refreshTokens();
    if (refreshSuccess) {
      const updatedTokens = useAuthStore.getState().tokens;
      return updatedTokens?.accessToken || null;
    }

    return null;
  }, [tokens, isTokenExpired, refreshTokens]);

  // 컴포넌트 마운트 시 토큰 초기화
  useEffect(() => {
    initializeTokens();
  }, [initializeTokens]);

  // 토큰 만료 시간 자동 확인 (5분마다)
  useEffect(() => {
    if (!isLoggedIn || !tokens) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired()) {
        refreshTokens();
      }
    };

    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // 5분마다 확인
    return () => clearInterval(interval);
  }, [isLoggedIn, tokens, isTokenExpired, refreshTokens]);

  return {
    tokens,
    isLoading,
    isLoggedIn,
    logout,
    refreshTokens,
    getValidAccessToken,
    initializeTokens,
    tokenExpiryTime: getTokenExpiryTime(),
  };
};
