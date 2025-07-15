"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateFoodRequest, UpdateFoodRequest, Food } from "@/lib/api/types";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { usePhotosByFood } from "@/hooks/usePhoto";

interface MenuFormProps {
  mode: "create" | "edit";
  storeId: number;
  foodId?: number; // edit 모드에서만 사용
  initialData?: Food; // edit 모드에서만 사용
  onSubmit: (data: CreateFoodRequest | UpdateFoodRequest) => Promise<unknown>;
  isPending: boolean;
  submitText: string;
  pendingText: string;
}

const MenuForm: React.FC<MenuFormProps> = ({
  mode,
  storeId,
  foodId,
  initialData,
  onSubmit,
  isPending,
  submitText,
  pendingText,
}) => {
  const [formData, setFormData] = useState<
    CreateFoodRequest | UpdateFoodRequest
  >({
    foodName: "",
    description: "",
    ingredients: "",
    cookingMethod: "",
    price: 0,
    stock: 0,
    isActive: true,
  });

  // edit 모드에서만 사진 목록 조회
  const { data: photosData, refetch: refetchPhotos } = usePhotosByFood(
    foodId || 0,
    { page: 0, size: 50 }
  );

  const photos = photosData?.content || [];

  // 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        foodName: initialData.foodName,
        description: initialData.description,
        ingredients: initialData.ingredients,
        cookingMethod: initialData.cookingMethod,
        price: initialData.price,
        stock: 0, // API에서 stock 필드가 없으므로 기본값
        isActive: initialData.isActive,
      });
    }
  }, [mode, initialData]);

  const handlePhotoUploadSuccess = () => {
    // 사진 업로드 성공 시 사진 목록 새로고침 (edit 모드에서만)
    if (mode === "edit") {
      refetchPhotos();
    }
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
    field: keyof (CreateFoodRequest | UpdateFoodRequest)
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

    if (mode === "create" && !storeId) {
      alert("매장 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 메뉴 정보 저장
      const result = await onSubmit(formData);

      // 성공 메시지
      const successMessage =
        mode === "create"
          ? "메뉴가 성공적으로 등록되었습니다."
          : "메뉴가 성공적으로 수정되었습니다.";
      alert(successMessage);

      // 캐시 무효화가 완료될 때까지 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      return result;
    } catch (error) {
      console.error(`메뉴 ${mode === "create" ? "등록" : "수정"} 실패:`, error);

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
          alert(
            mode === "create"
              ? "매장을 찾을 수 없습니다."
              : "메뉴를 찾을 수 없습니다."
          );
        } else {
          alert(
            `메뉴 ${mode === "create" ? "등록" : "수정"}에 실패했습니다: ${
              error.message
            }`
          );
        }
      } else {
        alert(
          `메뉴 ${
            mode === "create" ? "등록" : "수정"
          }에 실패했습니다. 다시 시도해주세요.`
        );
      }
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">메뉴 사진</Label>
        <PhotoUpload
          storeId={storeId}
          foodItemId={foodId || 0}
          onUploadSuccess={handlePhotoUploadSuccess}
          onUploadError={handlePhotoUploadError}
        />
      </div>

      {/* Photo Gallery (edit 모드에서만) */}
      {mode === "edit" && photos.length > 0 && (
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
          onClick={() => window.history.back()}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          disabled={isPending}
        >
          {isPending ? pendingText : submitText}
        </Button>
      </div>
    </form>
  );
};

export default MenuForm;
