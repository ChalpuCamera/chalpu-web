"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateFoodRequest, UpdateFoodRequest, Food } from "@/lib/api/types";
import MenuPhotoSection from "@/components/MenuPhotoSection";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useSearchParams, usePathname } from "next/navigation";
import { uploadPhoto } from "@/utils/photoUpload";
import { usePhotosByFood } from "@/hooks/usePhoto";

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
  initialImageUrl?: string; // 홈화면에서 촬영한 이미지 URL
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
  initialImageUrl,
}) => {
  const searchParams = useSearchParams();
  const { bridge, isAvailable } = useNativeBridge();
  const pathname = usePathname();

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

  // 현재 표시할 이미지 URL (홈화면에서 촬영하거나 새로 촬영한 이미지)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  // 기존 사진이 삭제되었는지 추적
  const [isPhotoDeleted, setIsPhotoDeleted] = useState(false);

  // 음식별 사진 정보 조회 (edit 모드일 때만)
  const { data: photoData } = usePhotosByFood(
    mode === "edit" && foodId ? foodId : 0,
    {
      page: 0,
      size: 1,
    }
  );

  const originalPhoto = photoData?.result?.content?.[0];

  // 음식별 사진은 하나씩만 저장되므로 단순화
  const hasExistingPhotos = !!(mode === "edit" && initialData?.thumbnailUrl);

  // 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("initialData:", initialData);
      setFormData({
        foodName: initialData.foodName,
        description: initialData.description,
        price: initialData.price,
        isActive: initialData.isActive,
        thumbnailUrl: initialData.thumbnailUrl,
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

  // 홈화면에서 촬영한 이미지 처리
  useEffect(() => {
    if (initialImageUrl) {
      console.log("홈화면에서 촬영된 이미지:", initialImageUrl);
      setCurrentImageUrl(initialImageUrl);
      // 이미지 URL을 파일로 변환하여 처리
      fetch(initialImageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], "home-camera-photo.jpg", {
            type: "image/jpeg",
          });
          handleFileSelect(file);
        })
        .catch((error) => {
          console.error("홈화면 이미지 로드 실패:", error);
        });
    }
  }, [initialImageUrl]);

  const handlePhotoUploadError = (error: string) => {
    alert(`사진 업로드 실패: ${error}`);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    // 파일 선택 시 상태에 저장 (실제 업로드는 onSubmit에서 처리)
    console.log("파일 선택됨:", file.name);
    setSelectedFile(file);
    // 새 파일이 선택되면 삭제 상태 해제
    setIsPhotoDeleted(false);
  };

  const handlePhotoDelete = () => {
    // 사진 삭제 시 현재 이미지 URL 초기화
    setCurrentImageUrl(null);
    setSelectedFile(null);
    // 기존 사진이 삭제되었음을 표시
    setIsPhotoDeleted(true);
  };

  const handleFileRemove = () => {
    // 파일 제거 시 선택된 파일 초기화
    setSelectedFile(null);
    setIsPhotoDeleted(true);
  };

  const handleFeaturedChange = () => {
    // 대표 사진 변경 시 현재 이미지 URL 업데이트
    if (initialData?.thumbnailUrl) {
      setCurrentImageUrl(initialData.thumbnailUrl);
    }
  };

  const handleTakeNewPhoto = () => {
    if (isAvailable) {
      bridge.openCamera(pathname, (result) => {
        if (result.success && result.tempFileURL) {
          // 새로 찍은 사진 처리
          console.log("새로 찍은 사진:", result.tempFileURL);
          const fullImageUrl = originalPhoto
            ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${result.tempFileURL}?s=${originalPhoto.imageWidth}x${originalPhoto.imageHeight}&t=crop&q=70`
            : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${result.tempFileURL}?q=70`;

          // 현재 표시할 이미지 URL 업데이트
          setCurrentImageUrl(fullImageUrl);

          // 새로 촬영한 이미지를 파일로 변환하여 처리
          fetch(fullImageUrl)
            .then((response) => response.blob())
            .then((blob) => {
              const file = new File([blob], "new-camera-photo.jpg", {
                type: "image/jpeg",
              });
              handleFileSelect(file);
            })
            .catch((error) => {
              console.error("새로 촬영한 이미지 로드 실패:", error);
              alert("이미지를 불러오는데 실패했습니다.");
            });
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
    console.log("handleSubmit");
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
      let result;
      // edit 모드에서 기존 사진이 삭제된 경우 thumbnailUrl을 ""로 설정
      console.log("isPhotoDeleted:", isPhotoDeleted);
      console.log("mode:", mode);
      console.log("selectedFile:", selectedFile);
      if (mode === "edit" && isPhotoDeleted) {
        const updatedFormData = {
          ...formData,
          thumbnailUrl: "",
        };
        result = await onSubmit(updatedFormData);
        console.log("메뉴 저장 완료 (사진 삭제):", result);
      } else {
        // 먼저 메뉴 정보를 저장 (foodId 생성)
        result = await onSubmit(formData);
        console.log("메뉴 저장 완료:", result);
      }

      // 메뉴 저장 후 사진이 있는 경우 업로드
      if (selectedFile) {
        console.log("사진 업로드 시작...");
        try {
          // edit 모드에서는 foodId가 이미 있음, create 모드에서는 result에서 가져옴
          const targetFoodId =
            mode === "edit" ? foodId : result?.result?.foodItemId;
          if (targetFoodId) {
            const uploadResult = await uploadPhoto(
              selectedFile,
              storeId,
              targetFoodId
            );
            console.log("사진 업로드 완료:", uploadResult);
          } else {
            console.error("foodId를 찾을 수 없어 사진 업로드를 건너뜁니다.");
          }
        } catch (error) {
          console.error("사진 업로드 실패:", error);
          // 사진 업로드 실패해도 메뉴는 저장되었으므로 경고만 표시
          alert("메뉴는 저장되었지만 사진 업로드에 실패했습니다.");
        }
      }
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
        photos={[]}
        hasExistingPhotos={hasExistingPhotos}
        fromNativeCamera={fromNativeCamera}
        nativePhotoPath={nativePhotoPath}
        onFileSelect={handleFileSelect}
        onPhotoUploadError={handlePhotoUploadError}
        onPhotoDelete={handlePhotoDelete}
        onFeaturedChange={handleFeaturedChange}
        onTakeNewPhoto={handleTakeNewPhoto}
        onFileRemove={handleFileRemove}
        initialImageUrl={currentImageUrl || initialData?.thumbnailUrl}
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
      <div className="flex gap-4 py-8">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-lg"
          onClick={() => window.history.back()}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          disabled={isPending}
        >
          {isPending ? pendingText : submitText}
        </Button>
      </div>
    </form>
  );
};

export default MenuForm;
