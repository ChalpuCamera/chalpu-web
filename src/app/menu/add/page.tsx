"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateFood } from "@/hooks/useFood";
import { CreateFoodRequest, UpdateFoodRequest } from "@/lib/api/types";
import MenuForm from "@/components/MenuForm";
import NavBar from "@/components/ui/navbar";

const AddMenuPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = parseInt(searchParams.get("storeId") || "0");
  const createFoodMutation = useCreateFood();

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
      <NavBar title="메뉴 등록" />
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
