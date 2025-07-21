"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  faHome,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import NavBar from "@/components/ui/navbar";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, reset }) => {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="bg-white min-h-screen">
      <NavBar title="오류가 발생했습니다" />

      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="text-6xl text-red-500 mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              오류가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-4">
              일시적인 문제가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>

            {/* 개발 환경에서는 에러 메시지 표시 */}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left bg-gray-50 p-3 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  에러 상세정보
                </summary>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FontAwesomeIcon icon={faRefresh} className="mr-2" />
              다시 시도하기
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              홈으로 가기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ErrorPage;
