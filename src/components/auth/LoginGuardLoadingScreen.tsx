"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/ui/navbar";

interface LoginGuardLoadingScreenProps {
  showRefreshButton?: boolean;
  message?: string;
  showNavBar?: boolean;
}

export function LoginGuardLoadingScreen({ 
  showRefreshButton = false,
  message = "로딩 중...",
  showNavBar = false
}: LoginGuardLoadingScreenProps) {
  return (
    <div className="bg-white min-h-screen">
      {showNavBar && <NavBar title="로딩 중..." />}
      
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        
          {/* 5초 후 수동 새로고침 버튼 표시 (자동 새로고침 실패 대비) */}
          {showRefreshButton && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">
                로딩이 오래 걸리고 있습니다
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                새로고침
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}