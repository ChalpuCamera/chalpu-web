"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useFood, useUpdateFood } from "@/hooks/useFood";
import { UpdateFoodRequest } from "@/lib/api/types";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { usePhotosByFood } from "@/hooks/usePhoto";

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

  // 음식별 사진 목록 조회
  const { data: photosData, refetch: refetchPhotos } = usePhotosByFood(foodId, {
    page: 0,
    size: 50,
  });

  const photos = photosData?.content || [];

  const [formData, setFormData] = useState<UpdateFoodRequest>({
    foodName: "",
    description: "",
    ingredients: "",
    cookingMethod: "",
    price: 0,
    stock: 0,
    isActive: true,
  });

  // 음식 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (food) {
      setFormData({
        foodName: food.foodName,
        description: food.description,
        ingredients: food.ingredients,
        cookingMethod: food.cookingMethod,
        price: food.price,
        stock: 0, // API에서 stock 필드가 없으므로 기본값
        isActive: food.isActive,
      });
    }
  }, [food]);

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    router.push("/menu");
  };

  const handlePhotoUploadSuccess = () => {
    // 사진 업로드 성공 시 사진 목록 새로고침
    refetchPhotos();
  };

  const handlePhotoUploadError = (error: string) => {
    alert(`사진 업로드 실패: ${error}`);
  };

  const handlePhotoDelete = () => {
    // 사진 삭제 후 목록 새로고침
    refetchPhotos();
  };

  const handleFeaturedChange = () => {
    // 대표 사진 변경 후 목록 새로고침
    refetchPhotos();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof UpdateFoodRequest
  ) => {
    const value =
      field === "price" || field === "stock"
        ? parseInt(e.target.value) || 0
        : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.foodName?.trim()) {
      alert("음식명을 입력해주세요.");
      return;
    }

    try {
      await updateFoodMutation.mutateAsync({
        foodId,
        data: formData,
      });
      alert("메뉴가 성공적으로 수정되었습니다.");

      // 캐시 무효화가 완료될 때까지 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/menu");
    } catch (error) {
      console.error("메뉴 수정 실패:", error);

      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (
          error.message.includes("400") ||
          error.message.includes("잘못된")
        ) {
          alert("입력 정보를 확인해주세요.");
        } else if (
          error.message.includes("404") ||
          error.message.includes("찾을 수 없음")
        ) {
          alert("메뉴를 찾을 수 없습니다.");
        } else {
          alert(`메뉴 수정에 실패했습니다: ${error.message}`);
        }
      } else {
        alert("메뉴 수정에 실패했습니다. 다시 시도해주세요.");
      }
    }
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
            <Button onClick={() => router.push("/menu")}>
              메뉴 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-medium">메뉴 수정</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">메뉴 사진</Label>
            <PhotoUpload
              storeId={food?.storeId || 0}
              foodItemId={foodId}
              onUploadSuccess={handlePhotoUploadSuccess}
              onUploadError={handlePhotoUploadError}
            />
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">등록된 사진들</Label>
              <PhotoGallery
                photos={photos}
                onPhotoDelete={handlePhotoDelete}
                onFeaturedChange={handleFeaturedChange}
                showDeleteButton={true}
                showFeaturedButton={true}
              />
            </div>
          )}

          {/* Food Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              음식명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="음식명을 입력해주세요"
              value={formData.foodName || ""}
              onChange={(e) => handleInputChange(e, "foodName")}
              className="w-full border-gray-200 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">음식 설명</Label>
            <Textarea
              placeholder="음식에 대한 설명을 입력해주세요"
              value={formData.description || ""}
              onChange={(e) => handleInputChange(e, "description")}
              className="w-full border-gray-200 focus:border-blue-500 min-h-[80px]"
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">재료</Label>
            <Textarea
              placeholder="사용되는 재료들을 입력해주세요 (예: 김치, 돼지고기, 두부, 대파)"
              value={formData.ingredients || ""}
              onChange={(e) => handleInputChange(e, "ingredients")}
              className="w-full border-gray-200 focus:border-blue-500 min-h-[80px]"
            />
          </div>

          {/* Cooking Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">조리법</Label>
            <Textarea
              placeholder="조리 방법을 입력해주세요 (예: 김치를 볶아 우린 후 끓인다)"
              value={formData.cookingMethod || ""}
              onChange={(e) => handleInputChange(e, "cookingMethod")}
              className="w-full border-gray-200 focus:border-blue-500 min-h-[80px]"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">가격</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.price || 0}
              onChange={(e) => handleInputChange(e, "price")}
              className="w-full border-gray-200 focus:border-blue-500"
              min="0"
            />
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">재고</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.stock || 0}
              onChange={(e) => handleInputChange(e, "stock")}
              className="w-full border-gray-200 focus:border-blue-500"
              min="0"
            />
          </div>

          {/* Bottom Buttons */}
          <div className="flex gap-4 pt-8 pb-8">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 rounded-lg"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              disabled={updateFoodMutation.isPending}
            >
              {updateFoodMutation.isPending ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuPage;
