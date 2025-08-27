"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { usePhotosByFood } from "@/hooks/usePhoto";
import { getThumbnailUrl, getCroppedImageUrl } from "@/utils/imageUtils";

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

  // 음식별 사진 정보 조회
  const { data: photoData } = usePhotosByFood(foodItemId, {
    page: 0,
    size: 1,
  });

  const originalPhoto = photoData?.result?.content?.[0];

  const handlePlatformSelect = (platform: Platform) => {
    if (!thumbnailUrl || !originalPhoto) {
      alert("다운로드할 사진이 없습니다.");
      return;
    }

    setSelectedPlatform(platform);
  };

  const getDownloadFileName = (foodName: string, platformName: string) => {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-");
    return `${foodName}_${platformName}_${timestamp}.jpg`;
  };

  const handleClose = () => {
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
                  originalPhoto
                    ? getThumbnailUrl(thumbnailUrl, {
                        width: originalPhoto.imageWidth,
                        height: originalPhoto.imageHeight
                      })
                    : getThumbnailUrl(thumbnailUrl, undefined, 60)
                }
                alt={foodName}
                width={60}
                height={60}
                className="w-15 h-15 rounded-lg object-cover bg-white"
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
            {platforms.map((platform) => {
              const croppedUrl = thumbnailUrl && originalPhoto 
                ? getCroppedImageUrl(
                    thumbnailUrl,
                    platform.aspectRatio,
                    {
                      width: originalPhoto.imageWidth,
                      height: originalPhoto.imageHeight
                    },
                    100
                  )
                : '';
              const downloadFileName = getDownloadFileName(foodName, platform.name);
              
              return (
                <div key={platform.name} className="relative">
                  {thumbnailUrl && originalPhoto ? (
                    <a
                      href={croppedUrl}
                      download={downloadFileName}
                      onClick={() => handlePlatformSelect(platform)}
                      className={`w-full p-3 rounded-lg border transition-colors text-left block ${platform.bgColor} cursor-pointer`}
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
                        <FontAwesomeIcon 
                          icon={faDownload} 
                          className="text-gray-400" 
                        />
                      </div>
                    </a>
                  ) : (
                    <div className="w-full p-3 rounded-lg border transition-colors text-left opacity-50 cursor-not-allowed bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${platform.color}`}>
                            {platform.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            비율: {platform.ratio}
                          </p>
                        </div>
                        <FontAwesomeIcon 
                          icon={faDownload} 
                          className="text-gray-300" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!thumbnailUrl && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              이 메뉴에는 다운로드할 사진이 없습니다.
            </p>
          )}
        </div>

        {/* 미리보기 (선택된 플랫폼이 있을 때) */}
        {selectedPlatform && thumbnailUrl && originalPhoto && (
          <div className="p-4 border-t">
            <h5 className="text-sm font-medium mb-2">
              {selectedPlatform.name} 미리보기
            </h5>
            <div className="relative bg-white rounded-lg overflow-hidden">
              <Image
                src={getCroppedImageUrl(
                  thumbnailUrl,
                  selectedPlatform.aspectRatio,
                  {
                    width: originalPhoto.imageWidth,
                    height: originalPhoto.imageHeight
                  },
                  70 // 미리보기용은 낮은 품질
                )}
                alt={`${foodName} - ${selectedPlatform.name}`}
                width={300}
                height={300 / selectedPlatform.aspectRatio}
                className="w-full object-cover bg-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              위 버튼을 클릭하면 고품질 이미지가 다운로드됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoDownload;
