"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useFood, useUpdateFood } from "@/hooks/useFood";
import { UpdateFoodRequest } from "@/lib/api/types";
import MenuForm from "@/components/MenuForm";
import NavBar from "@/components/ui/navbar";
import { useAlertDialog } from "@/components/ui/alert-dialog";

const EditMenuPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const foodId = parseInt(params.foodId as string);
  const updateFoodMutation = useUpdateFood();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  // 음식 정보 조회
  const {
    data: foodData,
    isLoading: foodLoading,
    isError: foodError,
  } = useFood(foodId);

  const food = foodData?.result;

  const handleSubmit = async (data: UpdateFoodRequest) => {
    // 삭제 기능처럼 먼저 확인 다이얼로그 표시
    showAlert({
      title: "메뉴 수정 확인",
      message: "메뉴를 수정하시겠습니까?",
      type: "info",
      confirmText: "수정",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await updateFoodMutation.mutateAsync({
            foodId,
            data,
          });
          
          showAlert({
            title: "수정 완료",
            message: "메뉴가 성공적으로 수정되었습니다.",
            type: "success",
            onConfirm: () => {
              router.push("/menu");
            }
          });
        } catch (error) {
          console.error("메뉴 수정 실패:", error);
          
          if (error instanceof Error) {
            if (error.message.includes("401") || error.message.includes("인증")) {
              showAlert({
                title: "인증 오류",
                message: "인증이 만료되었습니다. 다시 로그인해주세요.",
                type: "error"
              });
            } else if (error.message.includes("403") || error.message.includes("권한")) {
              showAlert({
                title: "권한 오류",
                message: "메뉴를 수정할 권한이 없습니다.",
                type: "error"
              });
            } else if (error.message.includes("404")) {
              showAlert({
                title: "메뉴 없음",
                message: "메뉴를 찾을 수 없습니다.",
                type: "error"
              });
            } else {
              showAlert({
                title: "수정 실패",
                message: `메뉴 수정에 실패했습니다: ${error.message}`,
                type: "error"
              });
            }
          } else {
            showAlert({
              title: "수정 실패",
              message: "메뉴 수정에 실패했습니다. 다시 시도해주세요.",
              type: "error"
            });
          }
        }
      },
      onCancel: () => {
        // 취소 시 아무것도 하지 않음
      }
    });
  };

  if (foodLoading) {
    return (
      <div className="bg-white">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (foodError || !food) {
    return (
      <div className="bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">메뉴를 찾을 수 없습니다.</p>
            <button
              onClick={() => router.push("/menu")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              메뉴 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <NavBar title="메뉴 수정" />
      {/* Main Content */}
      <div className="space-y-12 px-4">
        <MenuForm
          mode="edit"
          storeId={food.storeId}
          foodId={foodId}
          initialData={food}
          onSubmit={handleSubmit as (data: UpdateFoodRequest) => void}
          isPending={updateFoodMutation.isPending}
          submitText="수정"
          pendingText="수정 중..."
        />
        {AlertDialogComponent}
      </div>
    </div>
  );
};

export default EditMenuPage;
