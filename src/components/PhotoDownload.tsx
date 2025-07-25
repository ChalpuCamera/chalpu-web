"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

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
  onClose: () => void;
}

const PhotoDownload: React.FC<PhotoDownloadProps> = ({
  foodName,
  thumbnailUrl,
  onClose,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const handlePlatformSelect = async (platform: Platform) => {
    if (!thumbnailUrl) {
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
        foodName
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
    fileName: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.crossOrigin = "anonymous";
      img.onload = () => {
        const { width: imgWidth, height: imgHeight } = img;
        const imgAspectRatio = imgWidth / imgHeight;

        let cropWidth, cropHeight, cropX, cropY;

        if (imgAspectRatio > targetAspectRatio) {
          // 이미지가 더 넓음 - 높이를 기준으로 자르기
          cropHeight = imgHeight;
          cropWidth = cropHeight * targetAspectRatio;
          cropX = (imgWidth - cropWidth) / 2;
          cropY = 0;
        } else {
          // 이미지가 더 높음 - 너비를 기준으로 자르기
          cropWidth = imgWidth;
          cropHeight = cropWidth / targetAspectRatio;
          cropX = 0;
          cropY = (imgHeight - cropHeight) / 2;
        }

        // 캔버스 크기 설정 (적절한 출력 크기로)
        const outputWidth = 1200;
        const outputHeight = outputWidth / targetAspectRatio;

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        if (ctx) {
          // 이미지 크롭하여 캔버스에 그리기
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            outputWidth,
            outputHeight
          );

          // 캔버스를 blob으로 변환
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);

                // 파일 다운로드
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileName}_${platformName}_${new Date().getTime()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                resolve(url);
              } else {
                reject(new Error("이미지 변환에 실패했습니다."));
              }
            },
            "image/jpeg",
            0.9
          );
        } else {
          reject(new Error("캔버스 컨텍스트를 가져올 수 없습니다."));
        }
      };

      img.onerror = () => {
        reject(new Error("이미지 로드에 실패했습니다."));
      };

      img.src = imageUrl;
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
                src={thumbnailUrl}
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
