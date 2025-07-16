"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faTrash, faImage } from "@fortawesome/free-solid-svg-icons";
import { uploadPhoto } from "@/utils/photoUpload";
import { useNativeBridge } from "@/utils/nativeBridge";

interface PhotoUploadProps {
  storeId: number;
  foodItemId: number;
  onUploadSuccess: (photoId: number, imageUrl: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  storeId,
  foodItemId,
  onUploadSuccess,
  onUploadError,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { bridge, isAvailable } = useNativeBridge();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      try {
        setIsUploading(true);
        setPreviewUrl(URL.createObjectURL(file));

        const result = await uploadPhoto(file, storeId, foodItemId);
        onUploadSuccess(result.photoId, result.imageUrl);
      } catch (error) {
        console.error("사진 업로드 실패:", error);
        onUploadError(
          error instanceof Error ? error.message : "사진 업로드에 실패했습니다."
        );
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [storeId, foodItemId, onUploadSuccess, onUploadError]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    if (isAvailable) {
      try {
        const result = await bridge.openCamera({
          quality: 80,
          allowEdit: false,
          encodingType: "JPEG",
          mediaType: "PHOTO",
        });

        if (result.success && result.imageData) {
          console.log("카메라 촬영 성공:", result.filePath);
          // Base64 이미지 데이터를 File 객체로 변환
          const byteString = atob(result.imageData.split(",")[1]);
          const mimeString = result.imageData
            .split(",")[0]
            .split(":")[1]
            .split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const file = new File([ab], "camera-photo.jpg", { type: mimeString });
          handleFileSelect(file);
        } else {
          console.error("카메라 촬영 실패:", result.error);
          onUploadError(result.error || "사진 촬영에 실패했습니다.");
        }
      } catch (error) {
        console.error("카메라 호출 실패:", error);
        onUploadError("카메라를 사용할 수 없습니다.");
      }
    } else {
      console.log("네이티브 앱에서만 사용 가능합니다.");
      onUploadError("네이티브 앱에서만 카메라 기능을 사용할 수 있습니다.");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!previewUrl ? (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
            onClick={handleTakePhoto}
          >
            <div className="space-y-2">
              <FontAwesomeIcon
                icon={faCamera}
                className="text-4xl text-gray-400 mx-auto"
              />
              <div>
                <p className="text-base font-medium text-gray-700">촬영</p>
                <p className="text-sm text-gray-500 mt-1">카메라로 사진 촬영</p>
              </div>
            </div>
          </div>

          <div
            className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
            onClick={handleSelectFromGallery}
          >
            <div className="space-y-2">
              <FontAwesomeIcon
                icon={faImage}
                className="text-4xl text-gray-400 mx-auto"
              />
              <div>
                <p className="text-base font-medium text-gray-700">
                  앨범에서 선택
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  갤러리에서 사진 선택
                </p>
              </div>
            </div>
          </div>
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
