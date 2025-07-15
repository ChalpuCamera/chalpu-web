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

      // 네이티브가 로컬스토리지에 주입한 accessToken 확인
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        console.log("네이티브에서 주입한 accessToken 발견");
        const tokenObject = {
          accessToken: accessToken,
          refreshToken: "", // 빈 문자열로 설정
          expiresIn: 3600, // 기본값 1시간
          tokenType: "Bearer",
        };
        setTokens(tokenObject);
        // 토큰 생성 시간이 없으면 현재 시간으로 설정
        if (!localStorage.getItem("auth-storage-timestamp")) {
          localStorage.setItem("auth-storage-timestamp", Date.now().toString());
        }
        console.log("네이티브에서 주입한 accessToken으로 로그인 성공");
      } else {
        // accessToken을 찾지 못했으면 로그아웃 상태
        console.log(
          "로컬스토리지에서 accessToken을 찾을 수 없습니다. 로그아웃 상태로 설정합니다."
        );
        clearTokens();
      }
    } catch (error) {
      console.error("토큰 초기화 실패:", error);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, [tokens, setTokens, setLoading, clearTokens, isTokenExpired]);

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
      localStorage.removeItem("auth-storage-timestamp");

      // 사용자 정보 캐시 삭제
      queryClient.removeQueries({ queryKey: userKeys.all });

      // 모든 인증 관련 캐시 삭제
      queryClient.clear();
    }
  }, [bridge, isAvailable, clearTokens, queryClient]);

  // 유효한 액세스 토큰 가져오기 (네이티브에서 갱신 처리)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;

    // 토큰이 만료되지 않았으면 그대로 반환
    if (!isTokenExpired()) {
      return tokens.accessToken;
    }

    // 토큰이 만료되었으면 로컬스토리지에서 재확인
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

  // 토큰 만료 시간 자동 확인 (5분마다, 네이티브에서 갱신 처리)
  useEffect(() => {
    if (!isLoggedIn || !tokens) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired()) {
        // 토큰이 만료되었으면 로컬스토리지에서 재확인
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
