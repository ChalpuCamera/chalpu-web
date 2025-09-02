"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useMyStores } from "@/hooks/useStore";
import { useActivities, useActivityCache } from "@/hooks/useActivity";
import { usePathname } from "next/navigation";

// 분리된 컴포넌트들
import { LoginGuardLoadingScreen } from "./LoginGuardLoadingScreen";
import { LoginGuardRequiredScreen } from "./LoginGuardRequiredScreen";
import { LoginGuardDevPanel } from "./LoginGuardDevPanel";
import { useDevModeHandlers } from "./LoginGuardDevHandlers";
import { LoginGuardProps } from "./LoginGuardTypes";

export function LoginGuard({ children }: LoginGuardProps) {
  // 훅 호출
  const { tokens, setTokens, clearTokens, isLoggedIn, isLoading, isInitialized } = useAuthStore();
  const { isAvailable } = useNativeBridge();
  const {
    data: userInfo,
    isLoading: userInfoLoading,
    error: userInfoError,
  } = useUserInfo();
  const { getCacheInfo, forceRefresh } = useActivityCache();
  const { data: activities } = useActivities(5);
  const { data: storesData } = useMyStores({ page: 0, size: 10 });
  const pathname = usePathname();
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  
  // 개발 모드 핸들러
  const devHandlers = useDevModeHandlers(setTokens, pathname);

  // 자동 새로고침 및 수동 버튼 타이머
  useEffect(() => {
    let autoRefreshTimer: NodeJS.Timeout;
    let refreshButtonTimer: NodeJS.Timeout;
    
    // userInfo 로딩 중일 때 타이머 시작
    if (userInfoLoading && isLoggedIn && tokens) {
      // 3초 후 자동 새로고침
      autoRefreshTimer = setTimeout(() => {
        console.log("🔄 [LoginGuard] userInfo 로딩 타임아웃 - 자동 새로고침");
        window.location.reload();
      }, 3000);
      
      // 5초 후 수동 새로고침 버튼 표시 (자동 새로고침이 실패한 경우 대비)
      refreshButtonTimer = setTimeout(() => {
        setShowRefreshButton(true);
      }, 5000);
    } else {
      setShowRefreshButton(false);
    }
    
    return () => {
      if (autoRefreshTimer) clearTimeout(autoRefreshTimer);
      if (refreshButtonTimer) clearTimeout(refreshButtonTimer);
    };
  }, [userInfoLoading, isLoggedIn, tokens]);

  // 개발 모드 설정
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // 디버깅용 로그 (개발 모드에서만)
  if (isDevelopment) {
    console.log("🛡️ [LoginGuard] 렌더링, 상태:", {
      tokens: !!tokens,
      isLoggedIn,
      isLoading,
      userInfoLoading,
      userInfo: !!userInfo,
      userInfoError: !!userInfoError,
      isAvailable,
    });
  }

  // Early return 패턴으로 간결하게 처리
  // 0. 초기화 완료 대기
  if (!isInitialized) {
    if (isDevelopment) {
      console.log("🛡️ [LoginGuard] 앱 초기화 대기 중");
    }
    return <LoginGuardLoadingScreen 
      message="앱 초기화 중..."
      showNavBar={true}
    />;
  }
  
  // 1. 인증 초기화 중
  if (isLoading) {
    if (isDevelopment) {
      console.log("🛡️ [LoginGuard] 인증 초기화 로딩 화면 표시");
    }
    return <LoginGuardLoadingScreen 
      message="인증 확인 중..."
      showNavBar={true}
    />;
  }

  // 2. 사용자 정보 로딩 중
  if (userInfoLoading && isLoggedIn && tokens) {
    if (isDevelopment) {
      console.log("🛡️ [LoginGuard] 사용자 정보 로딩 화면 표시");
    }
    return <LoginGuardLoadingScreen 
      message="사용자 정보를 불러오는 중..."
      showRefreshButton={showRefreshButton} 
    />;
  }

  // 3. 로그인 필요
  if (!isLoggedIn || !tokens) {
    if (isDevelopment) {
      console.log("🛡️ [LoginGuard] 로그인 필요 화면 표시:", {
        isLoggedIn,
        hasTokens: !!tokens,
        isLoading,
      });
    }
    return (
      <LoginGuardRequiredScreen
        isAvailable={isAvailable}
        userInfo={userInfo}
        userInfoError={userInfoError}
        devHandlers={devHandlers}
        clearTokens={clearTokens}
      />
    );
  }

  // 4. 사용자 정보 없음 (인증 실패)
  if (!userInfo && !userInfoLoading) {
    return (
      <LoginGuardRequiredScreen
        isAvailable={isAvailable}
        userInfo={userInfo}
        userInfoError={userInfoError}
        devHandlers={devHandlers}
        clearTokens={clearTokens}
      />
    );
  }

  // 5. 인증 성공 - 개발 모드 데이터 준비
  const cacheInfo = getCacheInfo();
  const tokenExpiryTime = tokens?.expiresIn;
  const stores = storesData?.content || [];

  // 인증 성공 시 렌더링
  return (
    <>
      {/* 개발 모드 패널 */}
      {isDevelopment && pathname === "/" && (
        <LoginGuardDevPanel
          cacheInfo={cacheInfo}
          forceRefresh={forceRefresh}
          isLoggedIn={isLoggedIn}
          tokens={tokens}
          tokenExpiryTime={tokenExpiryTime}
          userInfoLoading={userInfoLoading}
          userInfoError={userInfoError}
          userInfo={userInfo}
          clearTokens={clearTokens}
          stores={stores}
          activities={activities}
          storesData={storesData}
          isAvailable={isAvailable}
          devHandlers={devHandlers}
        />
      )}
      {children}
    </>
  );
}