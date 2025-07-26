"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useMyStores } from "@/hooks/useStore";
import { useActivities, useActivityCache } from "@/hooks/useActivity";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation";

interface LoginGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoginGuard({ children }: LoginGuardProps) {
  const { tokens, setTokens, clearTokens, isLoggedIn } = useAuthStore();
  const { bridge, isAvailable } = useNativeBridge();
  const {
    data: userInfo,
    isLoading: userInfoLoading,
    error: userInfoError,
  } = useUserInfo();
  const { getCacheInfo, forceRefresh } = useActivityCache();
  const { data: activities } = useActivities(5);
  const { data: storesData } = useMyStores({ page: 0, size: 10 });
  const pathname = usePathname();

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

  // 페이지 새로고침으로 인증 재시도
  const handleRetryAuth = () => {
    window.location.reload();
  };

  // 유저 정보 로딩 중
  if (userInfoLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 개발 환경에서 캐시 정보 표시를 위한 데이터
  const cacheInfo = getCacheInfo();
  const tokenExpiryTime = tokens?.expiresIn;
  const showDevInfo = process.env.NODE_ENV === "development";
  const stores = storesData?.content || [];

  // 개발 모드 디버깅 함수들
  const handleTestAlert = () => {
    if (isAvailable) {
      bridge.showAlert("이것은 네이티브 Alert 테스트입니다!", "알림");
    } else {
      alert("웹 브라우저에서는 일반 alert이 표시됩니다.");
    }
  };

  const handleTestBridge = () => {
    console.log("=== 네이티브 브릿지 테스트 ===");
    console.log("isAvailable:", isAvailable);
    console.log("window.Android:", !!window.Android);
    console.log("window.webkit:", !!window.webkit);
    console.log("User Agent:", navigator.userAgent);

    if (window.Android) {
      console.log(
        "Android.postMessage:",
        typeof (window.Android as Record<string, unknown>).postMessage
      );
    }
    if (window.webkit?.messageHandlers?.chalpu) {
      console.log(
        "iOS chalpu handler:",
        typeof window.webkit.messageHandlers.chalpu.postMessage
      );
    }

    // 단순한 테스트 메시지 전송
    bridge.postMessage("TEST_MESSAGE", {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  };

  const handleTestResponse = () => {
    console.log("앱 응답 테스트 - receiveNativeMessage 함수 확인");

    // receiveNativeMessage 함수가 있는지 확인
    if (typeof window.receiveNativeMessage === "function") {
      console.log("✅ receiveNativeMessage 함수 존재");

      // 직접 호출해서 테스트
      window.receiveNativeMessage("test_callback", {
        success: true,
        message: "테스트 응답",
      });
    } else {
      console.log("❌ receiveNativeMessage 함수가 없습니다");
    }

    // Android 객체 상세 확인
    if (window.Android) {
      console.log(
        "Android 객체 메서드들:",
        Object.getOwnPropertyNames(window.Android)
      );
    }
  };

  const handleDiagnose = () => {
    console.log("=== 🔍 Android 웹뷰 진단 ===");
    console.log("window.NativeBridge 존재:", !!window.NativeBridge);
    console.log("window.Android 존재:", !!window.Android);

    if (window.NativeBridge) {
      console.log("✅ NativeBridge 발견!");
      console.log(
        "postMessage 메서드:",
        typeof window.NativeBridge.postMessage
      );
    }

    if (window.Android) {
      console.log("✅ Android 발견!");
      console.log("메서드들:", Object.getOwnPropertyNames(window.Android));
    }

    console.log("User Agent:", navigator.userAgent);
  };

  const handleTestToast = () => {
    console.log("기존 showToast 메서드로 테스트");

    if (window.Android) {
      const androidObj = window.Android as Record<string, unknown>;
      if (typeof androidObj.showToast === "function") {
        try {
          (androidObj.showToast as (message: string) => void)(
            "웹에서 호출한 토스트 메시지!"
          );
          console.log("✅ showToast 호출 성공!");
        } catch (error) {
          console.log("❌ showToast 호출 실패:", error);
        }
      } else {
        console.log("❌ showToast 메서드를 찾을 수 없음");
      }
    }
  };

  const handleTestExistingMethods = () => {
    console.log("=== 기존 Android 메서드들 테스트 ===");

    if (!window.Android) {
      console.log("❌ Android 객체가 없습니다");
      return;
    }

    const android = window.Android as Record<string, unknown>;

    // showToast 테스트
    if (typeof android.showToast === "function") {
      try {
        (android.showToast as (message: string) => void)(
          "웹에서 보낸 토스트 메시지입니다!"
        );
        console.log("✅ showToast 성공");
      } catch (error) {
        console.log("❌ showToast 실패:", error);
      }
    }

    // getDeviceInfo 테스트
    if (typeof android.getDeviceInfo === "function") {
      try {
        const deviceInfo = (android.getDeviceInfo as () => unknown)();
        console.log("✅ getDeviceInfo 성공:", deviceInfo);
      } catch (error) {
        console.log("❌ getDeviceInfo 실패:", error);
      }
    }

    // getAuthTokens 테스트
    if (typeof android.getAuthTokens === "function") {
      try {
        const tokens = (android.getAuthTokens as () => unknown)();
        console.log("✅ getAuthTokens 성공:", tokens);
      } catch (error) {
        console.log("❌ getAuthTokens 실패:", error);
      }
    }
  };

  const handleTestCameraSimple = () => {
    console.log("🎯 [handleTestCameraSimple] 카메라 테스트 시작");
    if (isAvailable) {
      bridge.openCamera(pathname, (result) => {
        console.log("🎯 [handleTestCameraSimple] 콜백 함수 실행됨");
        console.log("🎯 [handleTestCameraSimple] 결과:", result);

        if (result.success) {
          console.log("🎯 [handleTestCameraSimple] 카메라 촬영 성공");
          if (result.tempFileURL) {
            console.log(
              "🎯 [handleTestCameraSimple] 파일 URL:",
              result.tempFileURL
            );
          } else {
            console.log(
              "🎯 [handleTestCameraSimple] 파일 URL 없음 (요청만 수락됨)"
            );
          }
          bridge.showAlert("카메라 촬영 성공!", "테스트");
        } else {
          console.error(
            "🎯 [handleTestCameraSimple] 카메라 촬영 실패:",
            result.error
          );
          bridge.showAlert("카메라 촬영 실패", "테스트");
        }
      });
    } else {
      console.log(
        "🎯 [handleTestCameraSimple] 네이티브 앱에서만 사용 가능합니다."
      );
    }
  };

  const handleTestGallery = () => {
    console.log("갤러리 테스트 시작");
    if (isAvailable) {
      bridge.openGallery((result) => {
        console.log("갤러리 결과:", result);
        if (result.success) {
          bridge.showAlert(
            `갤러리에서 파일을 선택했습니다: ${result.tempFileURL}`,
            "성공"
          );
        } else {
          console.error("갤러리 테스트 실패:", result.error);
          bridge.showAlert("갤러리 테스트 실패", "오류");
        }
      });
    }
  };

  // 유저 정보 로드 성공 시 - 개발 모드 정보와 함께 자식 컴포넌트 렌더링
  if (userInfo && !userInfoError) {
    return (
      <>
        {/* Development Cache Info */}
        {showDevInfo && pathname === "/" && (
          <div className="bg-gray-100 p-2 text-sm text-gray-600 border-b">
            <div className="max-w-[400px] mx-auto">
              <div className="flex justify-between items-center mb-1">
                <span>
                  캐시: {cacheInfo.count}개 |
                  {cacheInfo.isValid ? " 유효" : " 무효"} |
                  {cacheInfo.lastUpdate
                    ? ` ${cacheInfo.lastUpdate.toLocaleTimeString()}`
                    : " 없음"}
                </span>
                <button
                  onClick={forceRefresh}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                >
                  새로고침
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  인증:{" "}
                  {userInfoLoading
                    ? "로딩..."
                    : isLoggedIn
                    ? "로그인됨"
                    : "로그아웃됨"}{" "}
                  | 토큰: {tokens ? "있음" : "없음"} | 만료:{" "}
                  {tokenExpiryTime
                    ? new Date(tokenExpiryTime).toLocaleTimeString()
                    : "없음"}
                </span>
                {isLoggedIn && (
                  <button
                    onClick={clearTokens}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    로그아웃
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>
                  사용자:{" "}
                  {userInfoLoading
                    ? "로딩..."
                    : userInfoError
                    ? "에러"
                    : userInfo?.name || "없음"}{" "}
                  | 제공자: {userInfo?.provider || "없음"} | 이메일:{" "}
                  {userInfo?.email || "없음"}
                </span>
              </div>
              <div>
                <span className="text-xs">네이티브 기능 테스트:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button
                    onClick={handleTestBridge}
                    className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    브릿지
                  </button>
                  <button
                    onClick={handleTestAlert}
                    className="bg-purple-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    Alert
                  </button>
                  <button
                    onClick={handleTestCameraSimple}
                    className="bg-green-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    카메라
                  </button>
                  <button
                    onClick={handleTestGallery}
                    className="bg-orange-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    갤러리
                  </button>
                  <button
                    onClick={handleTestResponse}
                    className="bg-red-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    응답
                  </button>
                  <button
                    onClick={handleDiagnose}
                    className="bg-yellow-500 text-white px-1 py-0.5 rounded text-xs"
                  >
                    진단
                  </button>
                  <button
                    onClick={handleTestToast}
                    className="bg-purple-700 text-white px-1 py-0.5 rounded text-xs"
                  >
                    Toast
                  </button>
                  <button
                    onClick={handleTestExistingMethods}
                    className="bg-blue-700 text-white px-1 py-0.5 rounded text-xs"
                  >
                    기존메서드
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  매장: {stores.length ? `${stores.length}개` : "로딩..."} |
                  활동: {activities?.length || 0}개 | 총:{" "}
                  {storesData?.totalElements || 0}개
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  브릿지 상태: {isAvailable ? "✅ 연결됨" : "❌ 미연결"} |
                  NativeBridge:{" "}
                  {typeof window !== "undefined" && window.NativeBridge
                    ? "✅"
                    : "❌"}{" "}
                  | iOS:{" "}
                  {typeof window !== "undefined" &&
                  window.webkit?.messageHandlers?.chalpu
                    ? "✅"
                    : "❌"}
                </span>
              </div>
            </div>
          </div>
        )}
        {children}
      </>
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
              : "Chalpu 앱에서 로그인 후 이용해주세요"}
          </p>
        </div>

        {/* 인증 에러 표시 */}
        {userInfoError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-800">
              로그인 정보 확인 실패:{" "}
              {userInfoError.message || "알 수 없는 오류"}
            </p>
            <Button
              onClick={handleRetryAuth}
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
                : "📱 Chalpu 앱을 다운로드하여 로그인해주세요"}
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
                  <span>유저 정보:</span>
                  <span
                    className={
                      userInfoError
                        ? "text-red-600"
                        : userInfo
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {userInfoError
                      ? "❌ 실패"
                      : userInfo
                      ? "✅ 성공"
                      : "⏳ 로딩중"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>에러:</span>
                  <span
                    className={
                      userInfoError ? "text-red-600" : "text-green-600"
                    }
                  >
                    {userInfoError ? "❌ 있음" : "✅ 없음"}
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
                  onClick={handleRetryAuth}
                  variant="outline"
                  className="w-full text-xs"
                  size="sm"
                >
                  인증 재시도
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              앱에서 로그인 후 웹뷰로 이동하면 유저 정보가 자동으로 로드됩니다
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
