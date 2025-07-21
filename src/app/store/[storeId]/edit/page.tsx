"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faHome,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useStore, useUpdateStore } from "@/hooks/useStore";
import { UpdateStoreRequest } from "@/lib/api/types";
import NavBar from "@/components/ui/navbar";
import StoreForm from "@/components/StoreForm";
import { useAlertDialog } from "@/components/ui/alert-dialog";

const EditStorePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const storeId = parseInt(params.storeId as string);

  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const updateStoreMutation = useUpdateStore();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  const handleCancel = () => {
    router.push("/mypage");
  };

  const handleSubmit = async (data: UpdateStoreRequest) => {
    try {
      await updateStoreMutation.mutateAsync({ id: storeId, data });
      showAlert({
        title: "수정 완료",
        message: "매장 정보가 성공적으로 수정되었습니다.",
        type: "success",
        onConfirm: () => {
          router.push("/mypage");
        },
      });
    } catch (error) {
      console.error("매장 수정 실패:", error);

      // 에러 메시지에 따라 다른 알림 표시
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
          showAlert({
            title: "인증 오류",
            message: "인증이 만료되었습니다. 다시 로그인해주세요.",
            type: "error",
          });
        } else if (
          error.message.includes("403") ||
          error.message.includes("권한")
        ) {
          showAlert({
            title: "권한 오류",
            message: "매장을 수정할 권한이 없습니다.",
            type: "error",
          });
        } else if (error.message.includes("404")) {
          showAlert({
            title: "매장 없음",
            message: "매장을 찾을 수 없습니다.",
            type: "error",
          });
        } else if (
          error.message.includes("400") ||
          error.message.includes("잘못된")
        ) {
          showAlert({
            title: "입력 오류",
            message: "입력 정보를 확인해주세요.",
            type: "error",
          });
        } else {
          showAlert({
            title: "수정 실패",
            message: `매장 수정에 실패했습니다: ${error.message}`,
            type: "error",
          });
        }
      } else {
        showAlert({
          title: "수정 실패",
          message: "매장 수정에 실패했습니다. 다시 시도해주세요.",
          type: "error",
        });
      }
    }
  };

  if (storeLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">매장 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-white min-h-screen">
        <NavBar title="매장을 찾을 수 없습니다" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <Card className="p-8 text-center max-w-md w-full">
            <div className="mb-6">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-6xl text-orange-500 mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                매장 정보를 찾을 수 없습니다
              </h2>
              <p className="text-gray-600 mb-6">
                요청하신 매장이 존재하지 않거나
                <br />
                접근 권한이 없을 수 있습니다.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FontAwesomeIcon icon={faHome} className="mr-2" />
                홈으로 가기
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                이전 페이지로
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <NavBar title="매장 수정" />
      {/* Main Content */}
      <div className="space-y-12 px-4">
        <StoreForm
          mode="edit"
          initialData={store}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateStoreMutation.isPending}
        />
      </div>
      {AlertDialogComponent}
    </div>
  );
};

export default EditStorePage;
