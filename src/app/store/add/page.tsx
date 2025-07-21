"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateStore } from "@/hooks/useStore";
import { CreateStoreRequest } from "@/lib/api/types";
import NavBar from "@/components/ui/navbar";
import StoreForm from "@/components/StoreForm";
import { useAlertDialog } from "@/components/ui/alert-dialog";

const AddStorePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo"); // 돌아갈 페이지 확인
  const createStoreMutation = useCreateStore();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  const handleCancel = () => {
    // returnTo가 있으면 해당 페이지로, 없으면 마이페이지로
    router.push(returnTo || "/mypage");
  };

  const handleSubmit = async (data: CreateStoreRequest) => {
    try {
      await createStoreMutation.mutateAsync(data);

      // 캐시 무효화가 완료될 때까지 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      showAlert({
        title: "등록 완료",
        message: "매장이 성공적으로 등록되었습니다.",
        type: "success",
        onConfirm: () => {
          // returnTo가 있으면 해당 페이지로, 없으면 마이페이지로
          router.push(returnTo || "/mypage");
        },
      });
    } catch (error) {
      console.error("매장 등록 실패:", error);

      // 에러 메시지에 따라 다른 알림 표시
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
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
          error.message.includes("중복")
        ) {
          showAlert({
            title: "중복 등록",
            message: "이미 등록된 매장입니다.",
            type: "error",
          });
        } else {
          showAlert({
            title: "등록 실패",
            message: `매장 등록에 실패했습니다: ${error.message}`,
            type: "error",
          });
        }
      } else {
        showAlert({
          title: "등록 실패",
          message: "매장 등록에 실패했습니다. 다시 시도해주세요.",
          type: "error",
        });
      }
    }
  };

  return (
    <div className="bg-white">
      <NavBar title="매장 등록" />
      {/* Main Content */}
      <div className="space-y-12 px-4">
        <StoreForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createStoreMutation.isPending}
        />
      </div>
      {AlertDialogComponent}
    </div>
  );
};

export default AddStorePage;
