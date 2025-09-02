"use client";

import React from "react";
import { DevModeHandlers, CacheInfo } from "./LoginGuardTypes";
import { AuthTokens } from "@/utils/nativeBridge";
import { User } from "@/lib/api";

interface LoginGuardDevPanelProps {
  cacheInfo: CacheInfo;
  forceRefresh: () => void;
  isLoggedIn: boolean;
  tokens: AuthTokens | null;
  tokenExpiryTime: number | undefined;
  userInfoLoading: boolean;
  userInfoError: Error | null;
  userInfo: User | undefined;
  clearTokens: () => void;
  stores: any[];
  activities: any[] | undefined;
  storesData: any;
  isAvailable: boolean;
  devHandlers: DevModeHandlers;
}

export function LoginGuardDevPanel({
  cacheInfo,
  forceRefresh,
  isLoggedIn,
  tokens,
  tokenExpiryTime,
  userInfoLoading,
  userInfoError,
  userInfo,
  clearTokens,
  stores,
  activities,
  storesData,
  isAvailable,
  devHandlers,
}: LoginGuardDevPanelProps) {
  return (
    <div className="bg-gray-100 p-2 text-sm text-gray-600 border-b">
      <div className="max-w-[400px] mx-auto">
        {/* 캐시 정보 */}
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

        {/* 인증 정보 */}
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

        {/* 사용자 정보 */}
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

        {/* 네이티브 기능 테스트 버튼들 */}
        <div>
          <span className="text-xs">네이티브 기능 테스트:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            <button
              onClick={devHandlers.handleTestBridge}
              className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs"
            >
              브릿지
            </button>
            <button
              onClick={devHandlers.handleTestAlert}
              className="bg-purple-500 text-white px-1 py-0.5 rounded text-xs"
            >
              Alert
            </button>
            <button
              onClick={devHandlers.handleTestCameraSimple}
              className="bg-green-500 text-white px-1 py-0.5 rounded text-xs"
            >
              카메라
            </button>
            <button
              onClick={devHandlers.handleTestGallery}
              className="bg-orange-500 text-white px-1 py-0.5 rounded text-xs"
            >
              갤러리
            </button>
            <button
              onClick={devHandlers.handleTestResponse}
              className="bg-red-500 text-white px-1 py-0.5 rounded text-xs"
            >
              응답
            </button>
            <button
              onClick={devHandlers.handleDiagnose}
              className="bg-yellow-500 text-white px-1 py-0.5 rounded text-xs"
            >
              진단
            </button>
            <button
              onClick={devHandlers.handleTestToast}
              className="bg-purple-700 text-white px-1 py-0.5 rounded text-xs"
            >
              Toast
            </button>
            <button
              onClick={devHandlers.handleTestExistingMethods}
              className="bg-blue-700 text-white px-1 py-0.5 rounded text-xs"
            >
              기존메서드
            </button>
          </div>
        </div>

        {/* 매장 및 활동 정보 */}
        <div className="flex justify-between items-center">
          <span>
            매장: {stores.length ? `${stores.length}개` : "로딩..."} |
            활동: {activities?.length || 0}개 | 총:{" "}
            {storesData?.totalElements || 0}개
          </span>
        </div>

        {/* 브릿지 상태 */}
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
  );
}