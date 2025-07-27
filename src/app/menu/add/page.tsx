"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateFood } from "@/hooks/useFood";
import { CreateFoodRequest, UpdateFoodRequest, Food } from "@/lib/api/types";
import MenuForm from "@/components/MenuForm";
import NavBar from "@/components/ui/navbar";
import { useAlertDialog } from "@/components/ui/alert-dialog";

const AddMenuPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // URL 파라미터에서 storeId 추출 (홈화면에서 전달받거나 기존 방식)
  const storeId = parseInt(searchParams.get("storeId") || "0");
  const imageUrl = searchParams.get("imageUrl");
  const createFoodMutation = useCreateFood();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  const handleSubmit = async (data: CreateFoodRequest) => {
    return new Promise<{ result: Food }>((resolve, reject) => {
      // 삭제 기능처럼 먼저 확인 다이얼로그 표시
      showAlert({
        title: "메뉴 등록 확인",
        message: "메뉴를 등록하시겠습니까?",
        type: "info",
        confirmText: "등록",
        cancelText: "취소",
        onConfirm: async () => {
          try {
            const result = await createFoodMutation.mutateAsync({
              storeId,
              data,
            });

            showAlert({
              title: "등록 완료",
              message: "메뉴가 성공적으로 등록되었습니다.",
              type: "success",
              onConfirm: () => {
                router.push("/menu");
              },
            });
            
            resolve(result);
          } catch (error) {
            console.error("메뉴 등록 실패:", error);

            if (error instanceof Error) {
              if (
                error.message.includes("401") ||
                error.message.includes("인증")
              ) {
                showAlert({
                  title: "인증 오류",
                  message: "인증이 만료되었습니다. 다시 로그인해주세요.",
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
              } else if (
                error.message.includes("409") ||
                error.message.includes("이미")
              ) {
                showAlert({
                  title: "등록 실패",
                  message: "이미 등록된 메뉴입니다.",
                  type: "error",
                });
              } else {
                showAlert({
                  title: "등록 실패",
                  message: `메뉴 등록에 실패했습니다: ${error.message}`,
                  type: "error",
                });
              }
            } else {
              showAlert({
                title: "등록 실패",
                message: "메뉴 등록에 실패했습니다. 다시 시도해주세요.",
                type: "error",
              });
            }
            
            reject(error);
          }
        },
        onCancel: () => {
          // 취소 시 reject
          reject(new Error("사용자가 취소했습니다"));
        },
      });
    });
  };

  return (
    <div className="bg-white">
      <NavBar title="메뉴 등록" />
      {/* Main Content */}
      <div className="space-y-12 px-4">
        <MenuForm
          mode="create"
          storeId={storeId}
          onSubmit={
            handleSubmit as (
              data: CreateFoodRequest | UpdateFoodRequest
            ) => void
          }
          isPending={createFoodMutation.isPending}
          submitText="등록"
          pendingText="등록 중..."
          initialImageUrl={imageUrl ? `https://cdn.chalpu.com/${imageUrl}` : undefined}
        />
        {AlertDialogComponent}
      </div>
    </div>
  );
};

export default AddMenuPage;
