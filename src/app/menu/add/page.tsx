"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useCreateFood } from "@/hooks/useFood";
import { CreateFoodRequest, UpdateFoodRequest } from "@/lib/api/types";
import MenuForm from "@/components/MenuForm";

const AddMenuPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = parseInt(searchParams.get("storeId") || "0");
  const createFoodMutation = useCreateFood();

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (data: CreateFoodRequest) => {
    const result = await createFoodMutation.mutateAsync({
      storeId,
      data,
    });

    // 성공 후 메뉴 페이지로 이동
    router.push("/menu");
    return result;
  };

  return (
    <div className="bg-white">
      {/* Nav Bar */}
      <div className="w-full bg-white border-b mb-6">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="cursor-pointer">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-xl text-gray-600"
            />
          </button>
          <h1 className="text-lg font-medium">메뉴 등록</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12 px-4">
        <MenuForm
          mode="create"
          storeId={storeId}
          onSubmit={
            handleSubmit as (
              data: CreateFoodRequest | UpdateFoodRequest
            ) => Promise<unknown>
          }
          isPending={createFoodMutation.isPending}
          submitText="등록"
          pendingText="등록 중..."
        />
      </div>
    </div>
  );
};

export default AddMenuPage;
