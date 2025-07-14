"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useNativeBridge } from "@/utils/nativeBridge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";

interface LoginGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoginGuard({ children, fallback }: LoginGuardProps) {
  const { isLoggedIn, isLoading, setTokens, clearTokens } = useAuthStore();
  const { bridge, isAvailable } = useNativeBridge();

  const handleNativeLogin = async () => {
    if (isAvailable) {
      try {
        // 네이티브 로그인 화면 호출
        await bridge.showLogin();
      } catch (error) {
        console.error("네이티브 로그인 화면 호출 실패:", error);
      }
    } else {
      console.log("네이티브 앱에서만 로그인 가능합니다.");
    }
  };

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

  // 로그인된 상태
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // 커스텀 fallback이 있으면 사용
  if (fallback) {
    return <>{fallback}</>;
  }

  // 로그아웃 상태 - 기본 로그인 안내 화면
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
            ChalPu 서비스를 이용하려면 로그인해주세요
          </p>
        </div>

        <div className="space-y-4">
          {isAvailable ? (
            <Button
              onClick={handleNativeLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              로그인하기
            </Button>
          ) : (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ 네이티브 앱에서만 로그인이 가능합니다
              </p>
            </div>
          )}
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
              실제 앱에서는 네이티브 로그인이 자동으로 처리됩니다
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
