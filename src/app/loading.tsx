import React from "react";
import NavBar from "@/components/ui/navbar";

const LoadingPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <NavBar title="로딩 중..." />
      
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center">
          {/* 스피너 애니메이션 */}
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            로딩 중입니다
          </h2>
          <p className="text-gray-500">
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage; 