"use client";

import React from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError: React.FC<GlobalErrorProps> = ({ error, reset }) => {
  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                심각한 오류가 발생했습니다
              </h1>
              <p className="text-gray-600 mb-4">
                애플리케이션에 예상치 못한 문제가 발생했습니다.
                <br />
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>

              {/* 개발 환경에서는 에러 메시지 표시 */}
              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 text-left bg-gray-50 p-3 rounded text-sm border">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    에러 상세정보
                  </summary>
                  <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                    {error.message}
                    {error.digest && `\nDigest: ${error.digest}`}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                🔄 다시 시도하기
              </button>
              <button
                onClick={handleGoHome}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                🏠 홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
