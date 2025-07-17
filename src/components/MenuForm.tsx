"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateFoodRequest, UpdateFoodRequest, Food, Photo } from "@/lib/api/types";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
// import { usePhotosByFood } from "@/hooks/usePhoto"; // 임시로 비활성화 - API 수정 후 재활성화"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface MenuFormProps {
  mode: "create" | "edit";
  storeId: number;
  foodId?: number; // edit 모드에서만 사용
  initialData?: Food; // edit 모드에서만 사용
  onSubmit: (data: CreateFoodRequest | UpdateFoodRequest) => void; // Promise 제거
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

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  // edit 모드에서만 사진 목록 조회 (임시로 비활성화)
  // const { data: photosData, refetch: refetchPhotos } = usePhotosByFood(
  //   foodId || 0,
  //   { page: 0, size: 50 }
  // );

  // const photos = photosData?.content || [];
  const photos: Photo[] = [];
  const refetchPhotos = () => {};

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

  const handlePlatformPhotoSave = (platform: string) => {
    setSelectedPlatform(platform);
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    // 플랫폼별 사진 저장 로직
    console.log(`${selectedPlatform} 사진 저장 시작`);
    
    // TODO: 실제 플랫폼별 사진 저장 API 호출 로직
    // 예: 해당 플랫폼에 사진을 업로드하는 로직
    
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
    setSelectedPlatform("");
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSelectedPlatform("");
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

    // 상위 컴포넌트의 handleSubmit 호출 (Alert 다이얼로그 처리)
    onSubmit(formData);
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

      {/* Save Photo Platform */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">사진 저장하기</Label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            type="button"
            onClick={() => handlePlatformPhotoSave("배달의 민족")}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            배달의 민족
          </button>
          <button 
            type="button"
            onClick={() => handlePlatformPhotoSave("쿠팡이츠")}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            쿠팡이츠
          </button>
          <button 
            type="button"
            onClick={() => handlePlatformPhotoSave("요기요")}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            요기요
          </button>
          <button 
            type="button"
            onClick={() => handlePlatformPhotoSave("네이버플레이스")}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            네이버플레이스
          </button>
        </div>
      </div>

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



      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 저장 확인</DialogTitle>
            <DialogDescription>
              {selectedPlatform}에 사진을 저장하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSave}>
              취소
            </Button>
            <Button onClick={handleConfirmSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장 완료</DialogTitle>
            <DialogDescription>
              {selectedPlatform}에 사진이 저장되었습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSuccessDialogClose}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  );
};

export default MenuForm;
