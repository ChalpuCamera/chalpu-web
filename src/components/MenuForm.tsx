"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateFoodRequest, UpdateFoodRequest, Food } from "@/lib/api/types";
import MenuPhotoSection from "@/components/MenuPhotoSection";
import { usePhotosByFood } from "@/hooks/usePhoto";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useSearchParams } from "next/navigation";

interface MenuFormProps {
  mode: "create" | "edit";
  storeId: number;
  foodId?: number; // edit 모드에서만 사용
  initialData?: Food; // edit 모드에서만 사용
  onSubmit: (
    data: CreateFoodRequest | UpdateFoodRequest
  ) => Promise<{ result: Food }> | void;
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
  const searchParams = useSearchParams();
  const { bridge, isAvailable } = useNativeBridge();

  // 네이티브에서 전달받은 사진 경로 확인
  const nativePhotoPath = searchParams.get("photoPath");
  const fromNativeCamera = searchParams.get("fromCamera") === "true";

  // 단순화된 폼 데이터 (이름, 설명, 가격만)
  const [formData, setFormData] = useState<
    CreateFoodRequest | UpdateFoodRequest
  >({
    foodName: "",
    description: "",
    price: 0,
    isActive: true,
  });

  // 선택된 이미지 파일들 (미리보기용)

  // 음식별 사진 목록 조회 (edit 모드에서만)
  const { data: photosData, refetch: refetchPhotos } = usePhotosByFood(
    foodId || 0,
    { page: 0, size: 10 }
  );

  const photos = photosData?.result?.content || [];
  const hasExistingPhotos = photos.length > 0;

  // 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        foodName: initialData.foodName,
        description: initialData.description,
        price: initialData.price,
        isActive: initialData.isActive,
      });
    }
  }, [mode, initialData, storeId]);

  // 네이티브에서 사진 촬영 후 진입한 경우 처리
  useEffect(() => {
    if (fromNativeCamera && nativePhotoPath) {
      // TODO: 네이티브에서 전달받은 사진 파일 처리
      console.log("네이티브에서 촬영된 사진:", nativePhotoPath);
    }
  }, [fromNativeCamera, nativePhotoPath]);

  const handlePhotoUploadError = (error: string) => {
    alert(`사진 업로드 실패: ${error}`);
  };

  const handleFileSelect = (file: File) => {
    // 파일 선택 시 바로 업로드 처리
    console.log("파일 선택됨:", file.name);
  };

  const handlePhotoDelete = () => {
    // 사진 삭제 후 목록 새로고침
    refetchPhotos();
  };

  const handleFeaturedChange = () => {
    // 대표 사진 변경 후 목록 새로고침
    refetchPhotos();
  };

  const handleTakeNewPhoto = () => {
    if (isAvailable) {
      bridge.openCameraWithCallback((result) => {
        if (result.success && result.filePath) {
          // 새로 찍은 사진 처리
          console.log("새로 찍은 사진:", result.filePath);
        } else {
          console.error("카메라 호출 실패:", result.error);
          alert("카메라를 사용할 수 없습니다.");
        }
      });
    } else {
      alert("네이티브 앱에서만 카메라 기능을 사용할 수 있습니다.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof (CreateFoodRequest | UpdateFoodRequest)
  ) => {
    const value =
      field === "price" ? parseInt(e.target.value) || 0 : e.target.value;

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
      // 메뉴 정보를 저장
      await onSubmit(formData);
    } catch (error) {
      console.error("메뉴 저장 실패:", error);
      throw error; // 상위 컴포넌트에서 에러 처리할 수 있도록 re-throw
    }
  };

  // 렌더링 조건 판별

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Section */}
      <MenuPhotoSection
        mode={mode}
        storeId={storeId}
        foodId={foodId}
        photos={photos}
        hasExistingPhotos={hasExistingPhotos}
        fromNativeCamera={fromNativeCamera}
        nativePhotoPath={nativePhotoPath}
        onFileSelect={handleFileSelect}
        onPhotoUploadError={handlePhotoUploadError}
        onPhotoDelete={handlePhotoDelete}
        onFeaturedChange={handleFeaturedChange}
        onTakeNewPhoto={handleTakeNewPhoto}
      />

      {/* 단순화된 폼: 이름, 설명, 가격만 */}

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
