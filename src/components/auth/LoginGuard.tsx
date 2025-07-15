"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useNativeBridge } from "@/utils/nativeBridge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

interface LoginGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoginGuard({ children, fallback }: LoginGuardProps) {
  const { isLoggedIn, isLoading, setTokens, clearTokens } = useAuthStore();
  const { isAvailable } = useNativeBridge();

  // 개발 모드에서 임시 로그인 (테스트용)
  const handleDevLogin = () => {
    const mockTokens = {
      accessToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwiZW1haWwiOiJhZG1pbjU0OTRAZGF1bS5uZXQiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUxNDQ3NDgxLCJleHAiOjE3ODI5ODM0ODF9.VF9xEz9kOLaQm9p633V6IrW87qI2dB1PNc3kHZRQlW0",
      refreshToken: "dev-refresh-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    };
    setTokens(mockTokens);
    localStorage.setItem("auth-storage-timestamp", Date.now().toString());
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 네이티브 앱에서는 LoginGuard 비활성화 (네이티브에서 로그인 처리)
  if (isAvailable) {
    return <>{children}</>;
  }

  // 로그인된 상태
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // 커스텀 fallback이 있으면 사용
  if (fallback) {
    return <>{fallback}</>;
  }

  // 로그아웃 상태 - 기본 로그인 안내 화면 (웹 브라우저에서만 표시)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faUser} className="text-2xl text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600">
            Chalpu 서비스를 이용하려면 앱에서 로그인해주세요
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📱 앱에서 로그인 후 웹뷰로 이동해주세요
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">개발 모드</p>
            <div className="space-y-2">
              <Button
                onClick={handleDevLogin}
                variant="outline"
                className="w-full text-xs"
                size="sm"
              >
                임시 로그인 (테스트용)
              </Button>
              <Button
                onClick={clearTokens}
                variant="outline"
                className="w-full text-xs"
                size="sm"
              >
                로그아웃 (테스트용)
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              실제 앱에서는 네이티브에서 로그인 후 토큰이 자동으로 주입됩니다
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
