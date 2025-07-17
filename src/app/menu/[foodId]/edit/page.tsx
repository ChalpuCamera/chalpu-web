"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useFood, useUpdateFood } from "@/hooks/useFood";
import { UpdateFoodRequest } from "@/lib/api/types";
import MenuForm from "@/components/MenuForm";
import NavBar from "@/components/ui/navbar";

const EditMenuPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const foodId = parseInt(params.foodId as string);
  const updateFoodMutation = useUpdateFood();

  // 음식 정보 조회
  const {
    data: foodData,
    isLoading: foodLoading,
    isError: foodError,
  } = useFood(foodId);

  const food = foodData?.result;

  const handleSubmit = async (data: UpdateFoodRequest) => {
    const result = await updateFoodMutation.mutateAsync({
      foodId,
      data,
    });

    // 성공 후 메뉴 페이지로 이동
    router.push("/menu");
    return result;
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
          onSubmit={handleSubmit}
          isPending={updateFoodMutation.isPending}
          submitText="수정"
          pendingText="수정 중..."
        />
      </div>
    </div>
  );
};

export default EditMenuPage;
