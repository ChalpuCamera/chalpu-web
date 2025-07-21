"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faHome,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const NotFoundPage: React.FC = () => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-6xl text-orange-500 mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              페이지를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              요청하신 페이지가 존재하지 않거나
              <br />
              이동되었을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              홈으로 가기
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              이전 페이지로
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;
