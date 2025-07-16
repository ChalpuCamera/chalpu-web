"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthTokens, useNativeBridge } from "@/utils/nativeBridge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

interface LoginGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoginGuard({ children }: LoginGuardProps) {
  const { isLoggedIn, isLoading, setTokens, clearTokens } = useAuthStore();
  const { bridge, isAvailable } = useNativeBridge();
  
  // 토큰 로드 시도 상태 관리
  const [tokenLoadAttempted, setTokenLoadAttempted] = React.useState(false);
  const [tokenLoadError, setTokenLoadError] = React.useState<string | null>(null);

  // 웹뷰 환경에서 네이티브 앱으로부터 토큰 받아오기
  React.useEffect(() => {
    if (isAvailable && !isLoggedIn && !isLoading && !tokenLoadAttempted) {
      setTokenLoadAttempted(true);
      
      const loadTokenFromNative = async () => {
        try {
          console.log('네이티브 앱에서 토큰 가져오기 시도');
          const tokens = localStorage.getItem("accessToken");
          
          if (tokens) {
            setTokens(tokens as unknown as AuthTokens);
            console.log('네이티브 앱에서 토큰 로드 성공');
          } else {
            throw new Error('앱에서 토큰을 받아올 수 없습니다');
          }
        } catch (error) {
          console.error("네이티브 앱 토큰 로드 실패:", error);
          setTokenLoadError(error instanceof Error ? error.message : '알 수 없는 에러');
        }
      };
      
      loadTokenFromNative();
    }
  }, [bridge, isAvailable, isLoggedIn, isLoading, tokenLoadAttempted, setTokens]);

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

  // 토큰 로드 재시도
  const handleRetryTokenLoad = () => {
    setTokenLoadAttempted(false);
    setTokenLoadError(null);
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

  // 로그인 성공 시 - 자식 컴포넌트 렌더링
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // 웹뷰 환경에서 토큰 로드 중
  if (isAvailable && !tokenLoadAttempted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">앱에서 로그인 정보를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  // 웹뷰 환경에서 토큰 로드 실패 또는 웹 브라우저
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
            {isAvailable 
              ? "앱에서 로그인 후 다시 시도해주세요"
              : "Chalpu 앱에서 로그인 후 이용해주세요"
            }
          </p>
        </div>

        {/* 토큰 로드 에러 표시 */}
        {tokenLoadError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-800">
              로그인 정보 로드 실패: {tokenLoadError}
            </p>
            <Button
              onClick={handleRetryTokenLoad}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {isAvailable 
                ? "📱 앱에서 로그인을 완료한 후 웹뷰로 이동해주세요"
                : "📱 Chalpu 앱을 다운로드하여 로그인해주세요"
              }
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">개발 모드</p>

            {/* 환경 정보 섹션 */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">
                🔍 환경 정보
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>플랫폼:</span>
                  <span
                    className={
                      isAvailable
                        ? "text-green-600 font-medium"
                        : "text-blue-600 font-medium"
                    }
                  >
                    {isAvailable ? "📱 네이티브 앱" : "🌐 웹 브라우저"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>토큰 로드 시도:</span>
                  <span className={tokenLoadAttempted ? "text-green-600" : "text-yellow-600"}>
                    {tokenLoadAttempted ? "✅ 시도됨" : "⏳ 대기중"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>로그인 상태:</span>
                  <span
                    className={
                      isLoggedIn
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {isLoggedIn ? "✅ 로그인됨" : "❌ 로그아웃됨"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>에러:</span>
                  <span className={tokenLoadError ? "text-red-600" : "text-green-600"}>
                    {tokenLoadError ? "❌ 있음" : "✅ 없음"}
                  </span>
                </div>
              </div>
            </div>

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
              {isAvailable && (
                <Button
                  onClick={handleRetryTokenLoad}
                  variant="outline"
                  className="w-full text-xs"
                  size="sm"
                >
                  토큰 로드 재시도
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              앱에서 로그인 후 웹뷰로 이동하면 토큰이 자동으로 로드됩니다
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
