"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faTrash,
  faImage,
  faFolder,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { uploadPhoto } from "@/utils/photoUpload";
import { useNativeBridge } from "@/utils/nativeBridge";
import { usePhotosByFood } from "@/hooks/usePhoto";

interface PhotoUploadProps {
  storeId: number;
  foodItemId: number;
  onUploadSuccess?: (photoId: number, imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  className?: string;
  mode?: "create" | "gallery-only";
  showCameraButton?: boolean;
  showGalleryButton?: boolean;
  description?: string;
  maxPhotos?: number;
  previewOnly?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  storeId,
  foodItemId,
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  onFileRemove,
  className = "",
  mode = "create",
  showCameraButton = true,
  showGalleryButton = true,
  description,
  maxPhotos = 10,
  previewOnly = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { bridge, isAvailable } = useNativeBridge();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // CDN에 저장된 사진 조회 (1개만) - edit 모드에서만 사용
  const { data: cdnPhotoData } = usePhotosByFood(foodItemId, {
    page: 0,
    size: 1,
  });

  // 현재 음식의 사진들 조회 (edit 모드에서)
  const { data: currentFoodPhotosData } = usePhotosByFood(foodItemId, {
    page: 0,
    size: 10,
  });

  const cdnPhoto = cdnPhotoData?.result?.content?.[0] || null;
  const currentFoodPhotos = currentFoodPhotosData?.result?.content || [];
  const currentPhotoCount = mode === "create" ? 0 : currentFoodPhotos.length;
  const isAtMaxLimit = currentPhotoCount >= maxPhotos;

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      // 사진 개수 제한 확인
      if (isAtMaxLimit) {
        onUploadError?.(`최대 ${maxPhotos}개까지만 사진을 등록할 수 있습니다.`);
        return;
      }

      // 파일 크기 제한 (10MB)
      const maxFileSize = 10 * 1024 * 1024;
      if (file.size > maxFileSize) {
        onUploadError?.("파일 크기는 10MB 이하여야 합니다.");
        return;
      }

      // 파일 형식 확인
      if (!file.type.startsWith("image/")) {
        onUploadError?.("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      let currentPreviewUrl: string | null = null;

      try {
        // previewOnly가 true이면 업로드하지 않고 미리보기만
        if (previewOnly) {
          // 파일을 복사해서 안정성 확보
          const fileCopy = new File([file], file.name, { type: file.type });

          // Blob URL 생성 시 오류 방지를 위해 try-catch 추가
          try {
            currentPreviewUrl = URL.createObjectURL(fileCopy);
            setPreviewUrl(currentPreviewUrl);
          } catch (blobError) {
            console.error("Blob URL 생성 실패:", blobError);
            // Blob URL 생성 실패해도 파일은 전달
            setPreviewUrl(null);
          }

          onFileSelect?.(fileCopy);
          return;
        }

        // previewOnly가 false인 경우에만 실제 업로드 수행
        const fileCopy = new File([file], file.name, { type: file.type });
        currentPreviewUrl = URL.createObjectURL(fileCopy);
        setPreviewUrl(currentPreviewUrl);

        setIsUploading(true);

        // 파일 복사본으로 업로드
        const result = await uploadPhoto(fileCopy, storeId, foodItemId);

        // 첫 번째 사진인 경우 대표 사진으로 자동 설정은 API에서 처리됨
        onUploadSuccess?.(result.photoId, result.imageUrl);

        // 업로드 성공 후 미리보기 URL 정리
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        setPreviewUrl(null);
      } catch (error) {
        console.error("사진 업로드 실패:", error);
        onUploadError?.(
          error instanceof Error ? error.message : "사진 업로드에 실패했습니다."
        );
        // 에러 발생 시에도 미리보기 URL 정리
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [
      storeId,
      foodItemId,
      onUploadSuccess,
      onUploadError,
      onFileSelect,
      isAtMaxLimit,
      maxPhotos,
      previewOnly,
    ]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("파일 input change 이벤트 발생");
    const file = e.target.files?.[0];
    if (file) {
      console.log("선택된 파일:", file.name, file.size);
      handleFileSelect(file);
    } else {
      console.log("파일이 선택되지 않았습니다");
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.error("Blob URL 해제 실패:", error);
      }
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileRemove?.();
  };

  const handleSelectFromCdnGallery = () => {
    if (isAtMaxLimit) {
      onUploadError?.(`최대 ${maxPhotos}개까지만 사진을 등록할 수 있습니다.`);
      return;
    }

    if (cdnPhoto) {
      // CDN에 저장된 사진을 현재 음식에 연결하는 로직 필요
      // 현재는 단순히 미리보기만 표시
      setPreviewUrl(cdnPhoto.imageUrl);
      onUploadSuccess?.(cdnPhoto.photoId, cdnPhoto.imageUrl);
    } else {
      onUploadError?.("저장된 사진이 없습니다.");
    }
  };

  const handleTakePhoto = () => {
    if (isAtMaxLimit) {
      onUploadError?.(`최대 ${maxPhotos}개까지만 사진을 등록할 수 있습니다.`);
      return;
    }

    if (isAvailable) {
      bridge.openCamera("uploaded_photo", (result) => {
        console.log("카메라 콜백 결과:", result);

        if (result.success) {
          console.log("카메라 촬영 성공");
          if (result.tempFileURL) {
            console.log("카메라 촬영 성공:", result.tempFileURL);

            if (previewOnly) {
              // previewOnly 모드일 때는 미리보기만 설정
              setPreviewUrl(result.tempFileURL); // 네이티브에서 받은 경로를 미리보기로 사용
              // TODO: 실제 파일 객체를 생성해서 onFileSelect에 전달
              onFileSelect?.(
                new File([], "camera-photo.jpg", { type: "image/jpeg" })
              );
            } else {
              // TODO: 네이티브에서 실제 파일 데이터를 받아서 처리
              // 현재는 임시로 빈 파일 객체 생성
              const file = new File([], "camera-photo.jpg", {
                type: "image/jpeg",
              });
              handleFileSelect(file);
            }
          } else {
            console.log("카메라 요청 수락됨 (실제 촬영 결과 대기 중)");
          }
        } else if (result.success === false && result.error) {
          // 실제 오류가 발생한 경우
          console.error("카메라 촬영 실패:", result.error);
          onUploadError?.(result.error);
        } else {
          // 사용자가 촬영을 취소한 경우 (오류 아님)
          console.log("사용자가 카메라 촬영을 취소했습니다.");
        }
      });
    } else {
      console.log("네이티브 앱에서만 사용 가능합니다.");
      onUploadError?.("네이티브 앱에서만 카메라 기능을 사용할 수 있습니다.");
    }
  };

  const renderButtons = () => {
    const buttons = [];

    if (showCameraButton && mode !== "gallery-only") {
      buttons.push(
        <div
          key="camera"
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isAtMaxLimit
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={isAtMaxLimit ? undefined : handleTakePhoto}
        >
          <div className="space-y-2">
            <FontAwesomeIcon
              icon={faCamera}
              className={`text-4xl mx-auto ${
                isAtMaxLimit ? "text-gray-300" : "text-gray-400"
              }`}
            />
            <div>
              <p
                className={`text-base font-medium ${
                  isAtMaxLimit ? "text-gray-400" : "text-gray-700"
                }`}
              >
                촬영
              </p>
              <p
                className={`text-sm mt-1 ${
                  isAtMaxLimit ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {isAtMaxLimit ? "최대 개수 초과" : "카메라로 사진 촬영"}
              </p>
            </div>
          </div>
        </div>
      );
    }
    const handleGalleryClick = () => {
      if (isAtMaxLimit) {
        onUploadError?.(`최대 ${maxPhotos}개까지만 사진을 등록할 수 있습니다.`);
        return;
      }

      // 웹뷰에서 더 안정적인 방식으로 파일 선택 창 열기
      if (fileInputRef.current) {
        fileInputRef.current.click();

        // 일부 Android 웹뷰에서는 focus가 필요할 수 있음
        fileInputRef.current.focus();
      }
    };

    if (showGalleryButton) {
      buttons.push(
        <div
          key="gallery"
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isAtMaxLimit
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={handleGalleryClick} // label 대신 div + onClick 사용
        >
          <div className="space-y-2">
            <FontAwesomeIcon
              icon={faImage}
              className={`text-4xl mx-auto ${
                isAtMaxLimit ? "text-gray-300" : "text-gray-400"
              }`}
            />
            <div>
              <p
                className={`text-base font-medium ${
                  isAtMaxLimit ? "text-gray-400" : "text-gray-700"
                }`}
              >
                파일에서 선택
              </p>
              <p
                className={`text-sm mt-1 ${
                  isAtMaxLimit ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {isAtMaxLimit ? "최대 개수 초과" : "파일에서 사진 선택"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // CDN 갤러리 버튼 (edit 모드이고 CDN에 사진이 있을 때만)
    if (mode !== "create" && cdnPhoto) {
      buttons.push(
        <div
          key="cdn-gallery"
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isAtMaxLimit
              ? "border-blue-200 bg-blue-25 cursor-not-allowed opacity-50"
              : "border-blue-300 hover:border-blue-400"
          }`}
          onClick={isAtMaxLimit ? undefined : handleSelectFromCdnGallery}
        >
          <div className="space-y-2">
            <FontAwesomeIcon
              icon={faFolder}
              className={`text-4xl mx-auto ${
                isAtMaxLimit ? "text-blue-300" : "text-blue-400"
              }`}
            />
            <div>
              <p
                className={`text-base font-medium ${
                  isAtMaxLimit ? "text-blue-400" : "text-blue-700"
                }`}
              >
                저장된 사진
              </p>
              <p
                className={`text-sm mt-1 ${
                  isAtMaxLimit ? "text-blue-300" : "text-blue-500"
                }`}
              >
                {isAtMaxLimit ? "최대 개수 초과" : "저장된 사진 사용"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return buttons;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        id="gallery-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        disabled={isAtMaxLimit}
        className="hidden"
      />

      {description && <p className="text-sm text-gray-600">{description}</p>}

      {/* 사진 개수 제한 안내 */}
      {mode !== "create" && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            현재 {currentPhotoCount}개 / 최대 {maxPhotos}개
          </span>
          {isAtMaxLimit && (
            <span className="flex items-center gap-1 text-orange-600">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-xs"
              />
              최대 개수에 도달했습니다
            </span>
          )}
          {currentPhotoCount === 1 && (
            <span className="text-sm text-blue-600">
              첫 번째 사진이 자동으로 대표 사진으로 설정됩니다
            </span>
          )}
        </div>
      )}

      {!previewUrl ? (
        <div
          className={`grid gap-4 ${
            renderButtons().length === 1
              ? "grid-cols-1"
              : renderButtons().length === 2
              ? "grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {renderButtons()}
        </div>
      ) : (
        <div className="relative">
          <Image
            src={previewUrl}
            alt="미리보기"
            width={400}
            height={192}
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading}
              className="bg-red-500/90 hover:bg-red-500"
            >
              <FontAwesomeIcon icon={faTrash} className="text-base" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-base">업로드 중...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
