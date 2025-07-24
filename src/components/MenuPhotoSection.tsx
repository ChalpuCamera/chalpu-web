"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Photo } from "@/lib/api/types";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import Image from "next/image";

interface MenuPhotoSectionProps {
  mode: "create" | "edit";
  storeId: number;
  foodId?: number;
  photos: Photo[];
  hasExistingPhotos: boolean;
  fromNativeCamera: boolean;
  nativePhotoPath: string | null;
  onFileSelect: (file: File) => void;
  onPhotoUploadError: (error: string) => void;
  onPhotoDelete: () => void;
  onFeaturedChange: () => void;
  onTakeNewPhoto: () => void;
}

const MenuPhotoSection: React.FC<MenuPhotoSectionProps> = ({
  mode,
  storeId,
  foodId,
  photos,
  hasExistingPhotos,
  fromNativeCamera,
  nativePhotoPath,
  onFileSelect,
  onPhotoUploadError,
  onPhotoDelete,
  onFeaturedChange,
  onTakeNewPhoto,
}) => {
  if (mode === "create") {
    // 1. 사진 없이 생성하는 경우 & 2. 네이티브에서 사진촬영 후 생성하는 경우
    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium">메뉴 사진 (선택사항)</Label>

        {fromNativeCamera && nativePhotoPath ? (
          // 네이티브에서 촬영된 사진이 있는 경우
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={nativePhotoPath}
                alt="촬영된 사진 미리보기"
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onTakeNewPhoto}
              className="w-full"
            >
              새로 찍기
            </Button>
          </div>
        ) : (
          // 일반적인 사진 업로드 (미리보기만)
          <PhotoUpload
            storeId={storeId}
            foodItemId={0} // create 모드에서는 0
            onFileSelect={onFileSelect}
            onUploadError={onPhotoUploadError}
            mode="create"
            maxPhotos={10}
            previewOnly={true} // 미리보기만, 등록 버튼 클릭 시 업로드
          />
        )}
      </div>
    );
  } else {
    // edit 모드
    if (hasExistingPhotos) {
      // 4. 기존에 사진이 있는 메뉴를 수정하는 경우
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium">메뉴 사진</Label>

          {/* 새로 찍기 + 갤러리 선택 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onTakeNewPhoto}
              className="flex flex-col items-center py-6"
            >
              <span className="text-2xl mb-2">📷</span>
              <span>새로 찍기</span>
            </Button>

            <PhotoUpload
              storeId={storeId}
              foodItemId={foodId || 0}
              onFileSelect={onFileSelect}
              onUploadError={onPhotoUploadError}
              mode="gallery-only"
              showGalleryButton={true}
              showCameraButton={false}
              maxPhotos={10}
              previewOnly={true} // 미리보기만, 수정 버튼 클릭 시 업로드
            />
          </div>

          {/* 등록된 사진들 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">등록된 사진들</Label>
            <PhotoGallery
              photos={photos}
              onPhotoDelete={onPhotoDelete}
              onFeaturedChange={onFeaturedChange}
              showDeleteButton={true}
              showFeaturedButton={true}
              showMultiSelect={true}
              maxPhotos={10}
            />
          </div>
        </div>
      );
    } else {
      // 3. 사진 없이 생성한 메뉴를 수정하는 경우 - create 모드와 동일한 UI 사용
      return (
        <div className="space-y-4">
          <Label className="text-sm font-medium">메뉴 사진 (선택사항)</Label>

          <PhotoUpload
            storeId={storeId}
            foodItemId={foodId || 0}
            onFileSelect={onFileSelect}
            onUploadError={onPhotoUploadError}
            mode="create" // edit 모드지만 create UI 사용
            maxPhotos={10}
            previewOnly={true} // 미리보기만, 수정 버튼 클릭 시 업로드
          />
        </div>
      );
    }
  }
};

export default MenuPhotoSection;
