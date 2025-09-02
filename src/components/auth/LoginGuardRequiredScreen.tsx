"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { DevModeHandlers } from "./LoginGuardTypes";
import { User } from "@/lib/api";

interface LoginGuardRequiredScreenProps {
  isAvailable: boolean;
  userInfo: User | undefined;
  userInfoError: Error | null;
  devHandlers: DevModeHandlers;
  clearTokens: () => void;
}

export function LoginGuardRequiredScreen({
  isAvailable,
  userInfo,
  userInfoError,
  devHandlers,
  clearTokens,
}: LoginGuardRequiredScreenProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon
              icon={faUser}
              className="text-2xl text-blue-600"
            />
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
              onClick={devHandlers.handleRetryAuth}
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

        {/* 개발 모드 섹션 */}
        {isDevelopment && (
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
                onClick={devHandlers.handleDevLogin}
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
                  onClick={devHandlers.handleRetryAuth}
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