"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faTrash,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Photo } from "@/lib/api/types";
import { useDeletePhoto, useSetFeaturedPhoto } from "@/hooks/usePhoto";

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDelete?: (photoId: number) => void;
  onFeaturedChange?: (photoId: number) => void;
  showDeleteButton?: boolean;
  showFeaturedButton?: boolean;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onPhotoDelete,
  onFeaturedChange,
  showDeleteButton = true,
  showFeaturedButton = true,
  className = "",
}) => {
  const deletePhotoMutation = useDeletePhoto();
  const setFeaturedPhotoMutation = useSetFeaturedPhoto();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handleDeletePhoto = async (photoId: number) => {
    const confirmDelete = window.confirm(
      "이 사진을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmDelete) return;

    try {
      await deletePhotoMutation.mutateAsync(photoId);
      onPhotoDelete?.(photoId);
    } catch (error) {
      console.error("사진 삭제 실패:", error);
      alert("사진 삭제에 실패했습니다.");
    }
  };

  const handleSetFeatured = async (photoId: number) => {
    try {
      await setFeaturedPhotoMutation.mutateAsync({ photoId, isFeatured: true });
      onFeaturedChange?.(photoId);
    } catch (error) {
      console.error("대표 사진 설정 실패:", error);
      alert("대표 사진 설정에 실패했습니다.");
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  if (photos.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FontAwesomeIcon icon={faTimes} className="text-4xl mb-2" />
        <p>등록된 사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo) => (
          <Card key={photo.photoId} className="relative overflow-hidden">
            <div className="aspect-square">
              <Image
                src={photo.imageUrl}
                alt={photo.fileName}
                width={300}
                height={300}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handlePhotoClick(photo)}
              />
            </div>

            {/* 대표 사진 표시 */}
            {photo.isFeatured && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                <FontAwesomeIcon icon={faStar} className="text-sm" />
                대표
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="absolute top-2 right-2 flex gap-1">
              {showFeaturedButton && !photo.isFeatured && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSetFeatured(photo.photoId)}
                  className="bg-white/90 hover:bg-white text-yellow-600"
                  title="대표 사진으로 설정"
                >
                  <FontAwesomeIcon icon={faStar} className="text-sm" />
                </Button>
              )}

              {showDeleteButton && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeletePhoto(photo.photoId)}
                  disabled={deletePhotoMutation.isPending}
                  className="bg-red-500/90 hover:bg-red-500"
                  title="사진 삭제"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 사진 상세 보기 모달 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div className="relative">
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.fileName}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* 모달 내 액션 버튼들 */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                {showFeaturedButton && !selectedPhoto.isFeatured && (
                  <Button
                    onClick={() => {
                      handleSetFeatured(selectedPhoto.photoId);
                      closeModal();
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-2" />
                    대표 사진으로 설정
                  </Button>
                )}

                {showDeleteButton && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeletePhoto(selectedPhoto.photoId);
                      closeModal();
                    }}
                    disabled={deletePhotoMutation.isPending}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    삭제
                  </Button>
                )}
              </div>
            </div>

            {/* 사진 정보 */}
            <div className="mt-4 text-white text-base">
              <p>
                <strong>파일명:</strong> {selectedPhoto.fileName}
              </p>
              <p>
                <strong>크기:</strong>{" "}
                {(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <strong>해상도:</strong> {selectedPhoto.imageWidth} x{" "}
                {selectedPhoto.imageHeight}
              </p>
              <p>
                <strong>등록일:</strong>{" "}
                {new Date(selectedPhoto.createdAt).toLocaleDateString()}
              </p>
              {selectedPhoto.isFeatured && (
                <p className="text-yellow-400">
                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                  대표 사진
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
