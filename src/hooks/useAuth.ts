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
    initializeFromLocalStorage,
  } = useAuthStore();

  // 토큰 초기화
  const initializeTokens = useCallback(() => {
    setLoading(true);

    try {
      // 로컬스토리지에서 accessToken 확인 및 자동 로그인
      initializeFromLocalStorage();
    } catch (error) {
      console.error("토큰 초기화 실패:", error);
      clearTokens();
    }
    
    // 초기화 실패 시 안전장치: 3초 후 강제로 로딩 해제
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, [
    setLoading,
    clearTokens,
    initializeFromLocalStorage,
  ]);

  // 토큰 갱신 (네이티브에서 처리하므로 단순히 로컬스토리지 재확인)
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      // 로컬스토리지에서 최신 accessToken 확인
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const tokenObject = {
          accessToken: accessToken,
          refreshToken: "",
          expiresIn: 3600,
          tokenType: "Bearer",
        };
        setTokens(tokenObject);
        localStorage.setItem("auth-storage-timestamp", Date.now().toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error("토큰 갱신 실패:", error);
      clearTokens();
      return false;
    }
  }, [setTokens, clearTokens]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      // 네이티브 브릿지가 있으면 네이티브 로그아웃 호출
      if (isAvailable) {
        await bridge.logout();
      }
    } catch (error) {
      console.warn("네이티브 로그아웃 실패:", error);
    } finally {
      // 웹뷰 로컬스토리지 정리
      clearTokens();

      // 사용자 정보 캐시 삭제
      queryClient.removeQueries({ queryKey: userKeys.all });

      // 모든 인증 관련 캐시 삭제
      queryClient.clear();
    }
  }, [bridge, isAvailable, clearTokens, queryClient]);

  // 유효한 액세스 토큰 가져오기
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) {
      // 토큰이 없으면 로컬스토리지에서 재확인
      const refreshSuccess = await refreshTokens();
      if (refreshSuccess) {
        const updatedTokens = useAuthStore.getState().tokens;
        return updatedTokens?.accessToken || null;
      }
      return null;
    }

    return tokens.accessToken;
  }, [tokens, refreshTokens]);

  // 컴포넌트 마운트 시 토큰 초기화
  useEffect(() => {
    initializeTokens();
  }, [initializeTokens]);


  return {
    tokens,
    isLoading,
    isLoggedIn,
    logout,
    refreshTokens,
    getValidAccessToken,
    initializeTokens,
    tokenExpiryTime: null,
  };
};
