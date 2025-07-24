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
  faCheckSquare,
  faSquare,
} from "@fortawesome/free-solid-svg-icons";
import { Photo } from "@/lib/api/types";
import { useDeletePhoto, useSetFeaturedPhoto } from "@/hooks/usePhoto";
import { useAlertDialog } from "@/components/ui/alert-dialog";

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDelete?: (photoId: number) => void;
  onFeaturedChange?: (photoId: number) => void;
  showDeleteButton?: boolean;
  showFeaturedButton?: boolean;
  showMultiSelect?: boolean;
  maxPhotos?: number;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onPhotoDelete,
  onFeaturedChange,
  showDeleteButton = true,
  showFeaturedButton = true,
  showMultiSelect = false,
  maxPhotos = 10,
  className = "",
}) => {
  const deletePhotoMutation = useDeletePhoto();
  const setFeaturedPhotoMutation = useSetFeaturedPhoto();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  const isAtMaxLimit = photos.length >= maxPhotos;

  const handleDeletePhoto = async (photoId: number) => {
    const photo = photos.find((p) => p.photoId === photoId);

    showAlert({
      title: "사진 삭제 확인",
      message: `"${photo?.fileName}" 사진을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await deletePhotoMutation.mutateAsync(photoId);
          onPhotoDelete?.(photoId);

          showAlert({
            title: "삭제 완료",
            message: "사진이 성공적으로 삭제되었습니다.",
            type: "success",
          });
        } catch (error) {
          console.error("사진 삭제 실패:", error);
          showAlert({
            title: "삭제 실패",
            message: "사진 삭제에 실패했습니다. 다시 시도해주세요.",
            type: "error",
          });
        }
      },
      onCancel: () => {},
    });
  };

  const handleDeleteMultiplePhotos = async () => {
    if (selectedPhotos.size === 0) {
      showAlert({
        title: "선택된 사진 없음",
        message: "삭제할 사진을 선택해주세요.",
        type: "warning",
      });
      return;
    }

    showAlert({
      title: "다중 사진 삭제 확인",
      message: `선택된 ${selectedPhotos.size}개의 사진을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          // 병렬로 모든 선택된 사진 삭제
          await Promise.all(
            Array.from(selectedPhotos).map((photoId) =>
              deletePhotoMutation.mutateAsync(photoId)
            )
          );

          // 삭제 완료 후 콜백 호출
          Array.from(selectedPhotos).forEach((photoId) => {
            onPhotoDelete?.(photoId);
          });

          setSelectedPhotos(new Set());
          setIsMultiSelectMode(false);

          showAlert({
            title: "삭제 완료",
            message: `${selectedPhotos.size}개의 사진이 성공적으로 삭제되었습니다.`,
            type: "success",
          });
        } catch (error) {
          console.error("다중 사진 삭제 실패:", error);
          showAlert({
            title: "삭제 실패",
            message: "일부 사진 삭제에 실패했습니다. 다시 시도해주세요.",
            type: "error",
          });
        }
      },
      onCancel: () => {},
    });
  };

  const handleSetFeatured = async (photoId: number) => {
    // foodId 또는 foodItemId 찾기 (Photo 타입에서 foodId 사용)
    const photo = photos.find((p) => p.photoId === photoId);
    if (!photo) {
      showAlert({
        title: "오류",
        message: "사진 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    try {
      await setFeaturedPhotoMutation.mutateAsync({
        photoId,
        foodItemId: photo.foodId, // API 스펙에 맞게 foodId 사용
      });
      onFeaturedChange?.(photoId);

      showAlert({
        title: "대표 사진 설정 완료",
        message: "대표 사진이 성공적으로 설정되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("대표 사진 설정 실패:", error);
      showAlert({
        title: "설정 실패",
        message: "대표 사진 설정에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    if (isMultiSelectMode) {
      togglePhotoSelection(photo.photoId);
    } else {
      setSelectedPhoto(photo);
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedPhotos(new Set());
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map((photo) => photo.photoId)));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
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
      {/* 상단 컨트롤 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            총 {photos.length}개 {maxPhotos && `(최대 ${maxPhotos}개)`}
          </span>
          {isAtMaxLimit && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              최대 개수 도달
            </span>
          )}
        </div>

        {showMultiSelect && showDeleteButton && (
          <div className="flex gap-2">
            {!isMultiSelectMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMultiSelectMode}
              >
                다중 선택
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPhotos}
                  disabled={selectedPhotos.size === photos.length}
                >
                  전체 선택
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllPhotos}
                  disabled={selectedPhotos.size === 0}
                >
                  선택 해제
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMultiplePhotos}
                  disabled={selectedPhotos.size === 0}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-1" />
                  삭제 ({selectedPhotos.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMultiSelectMode}
                >
                  취소
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 사진 그리드 */}
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

            {/* 다중 선택 체크박스 */}
            {isMultiSelectMode && (
              <div className="absolute top-2 left-2">
                <div
                  className="w-6 h-6 rounded border-2 border-white bg-black/50 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.photoId);
                  }}
                >
                  <FontAwesomeIcon
                    icon={
                      selectedPhotos.has(photo.photoId)
                        ? faCheckSquare
                        : faSquare
                    }
                    className="text-white text-sm"
                  />
                </div>
              </div>
            )}

            {/* 대표 사진 표시 */}
            {photo.isFeatured && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                <FontAwesomeIcon icon={faStar} className="text-sm" />
                대표
              </div>
            )}

            {/* 액션 버튼들 (다중 선택 모드가 아닐 때만) */}
            {!isMultiSelectMode && (
              <div className="absolute top-2 right-2 flex gap-1">
                {showFeaturedButton && !photo.isFeatured && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetFeatured(photo.photoId);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.photoId);
                    }}
                    disabled={deletePhotoMutation.isPending}
                    className="bg-red-500/90 hover:bg-red-500"
                    title="사진 삭제"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </Button>
                )}
              </div>
            )}
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

      {AlertDialogComponent}
    </div>
  );
};

export default PhotoGallery;
