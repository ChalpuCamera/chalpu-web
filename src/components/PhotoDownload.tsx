"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { usePhotosByFood } from "@/hooks/usePhoto";

interface Platform {
  name: string;
  ratio: string;
  aspectRatio: number; // width / height
  color: string;
  bgColor: string;
}

const platforms: Platform[] = [
  {
    name: "배달의 민족",
    ratio: "4:3",
    aspectRatio: 4 / 3,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  {
    name: "쿠팡이츠",
    ratio: "18:11",
    aspectRatio: 18 / 11,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  {
    name: "요기요",
    ratio: "16:9",
    aspectRatio: 16 / 9,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
  {
    name: "네이버플레이스",
    ratio: "1:1",
    aspectRatio: 1,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
];

interface PhotoDownloadProps {
  foodName: string;
  thumbnailUrl?: string;
  foodItemId: number;
  onClose: () => void;
}

const PhotoDownload: React.FC<PhotoDownloadProps> = ({
  foodName,
  thumbnailUrl,
  foodItemId,
  onClose,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // 음식별 사진 정보 조회
  const { data: photoData } = usePhotosByFood(foodItemId, {
    page: 0,
    size: 1,
  });

  const originalPhoto = photoData?.result?.content?.[0];

  const handlePlatformSelect = async (platform: Platform) => {
    if (!thumbnailUrl || !originalPhoto) {
      alert("다운로드할 사진이 없습니다.");
      return;
    }

    setSelectedPlatform(platform);
    setIsDownloading(true);

    try {
      // 이미지 크롭 및 다운로드 처리
      const croppedUrl = await cropAndDownloadImage(
        thumbnailUrl,
        platform.aspectRatio,
        platform.name,
        foodName,
        originalPhoto.imageHeight,
        originalPhoto.imageWidth
      );
      setCroppedImageUrl(croppedUrl);
    } catch (error) {
      console.error("이미지 다운로드 실패:", error);
      alert("이미지 다운로드에 실패했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const cropAndDownloadImage = async (
    imageUrl: string,
    targetAspectRatio: number,
    platformName: string,
    fileName: string,
    imageHeight: number,
    imageWidth: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      // 원본 크기를 최대한 유지하면서 타겟 비율에 맞춤
      // 이미지는 항상 가로가 세로보다 크다고 가정
      const originalAspectRatio = imageWidth / imageHeight;
      let outputWidth: number;
      let outputHeight: number;

      if (targetAspectRatio > originalAspectRatio) {
        // 타겟 비율이 원본보다 더 가로로 긴 경우 (더 와이드한 경우)
        // 가로를 기준으로 맞추고 위아래를 자름
        outputWidth = imageWidth;
        outputHeight = Math.round(imageWidth / targetAspectRatio);
      } else {
        // 타겟 비율이 원본보다 덜 가로로 긴 경우 (더 스퀘어한 경우)
        // 세로를 기준으로 맞추고 좌우를 자름
        outputHeight = imageHeight;
        outputWidth = Math.round(imageHeight * targetAspectRatio);
      }

      // CDN 리사이징 API 사용 - crop 타입으로 정확한 크기로 자르기
      const croppedImageUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}/${imageUrl}?s=${outputWidth}x${outputHeight}&t=crop&q=100`;
      console.log("croppedImageUrl", croppedImageUrl);
      // HTTP URL 직접 다운로드 (안드로이드가 감지할 수 있도록)
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const downloadFileName = `${fileName}_${platformName}_${timestamp}.jpg`;

      const link = document.createElement("a");
      link.href = croppedImageUrl; // HTTP URL 직접 사용
      link.download = downloadFileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("link", link);

      resolve(croppedImageUrl);
    });
  };

  const handleClose = () => {
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">사진 다운로드</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>

        {/* 메뉴 정보 */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {thumbnailUrl ? (
              <Image
                src={
                  thumbnailUrl && originalPhoto
                    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${thumbnailUrl}?s=${originalPhoto.imageWidth}x${originalPhoto.imageHeight}&t=crop&q=70`
                    : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${thumbnailUrl}?s=60x60&t=crop&q=70`
                }
                alt={foodName}
                width={60}
                height={60}
                className="w-15 h-15 rounded-lg object-cover"
              />
            ) : (
              <div className="w-15 h-15 rounded-lg bg-gray-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faDownload} className="text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-medium">{foodName}</h4>
              <p className="text-sm text-gray-500">
                플랫폼에 맞는 비율로 크롭하여 다운로드
              </p>
            </div>
          </div>
        </div>

        {/* 플랫폼 선택 */}
        <div className="p-4">
          <h5 className="text-sm font-medium mb-3">플랫폼을 선택하세요</h5>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformSelect(platform)}
                disabled={isDownloading || !thumbnailUrl}
                className={`w-full p-3 rounded-lg border transition-colors text-left ${
                  platform.bgColor
                } ${
                  !thumbnailUrl
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium ${platform.color}`}>
                      {platform.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      비율: {platform.ratio}
                    </p>
                  </div>
                  {isDownloading && selectedPlatform === platform && (
                    <div className="text-sm text-gray-500">다운로드 중...</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {!thumbnailUrl && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              이 메뉴에는 다운로드할 사진이 없습니다.
            </p>
          )}
        </div>

        {/* 미리보기 (크롭된 이미지가 있을 때) */}
        {croppedImageUrl && selectedPlatform && (
          <div className="p-4 border-t">
            <h5 className="text-sm font-medium mb-2">
              {selectedPlatform.name} 미리보기
            </h5>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={croppedImageUrl}
                alt={`${foodName} - ${selectedPlatform.name}`}
                width={300}
                height={300 / selectedPlatform.aspectRatio}
                className="w-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              파일이 다운로드 폴더에 저장되었습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoDownload;
