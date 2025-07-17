import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photoApi } from "@/lib/api/photo";
import { RegisterPhotoRequest, PresignedUrlRequest } from "@/lib/api/types";

// 사진 상세 조회 훅
export const usePhoto = (photoId: number) => {
  return useQuery({
    queryKey: ["photo", photoId],
    queryFn: () => photoApi.getPhoto(photoId),
    enabled: !!photoId,
  });
};

// 가게별 사진 목록 조회 훅
export const usePhotosByStore = (
  storeId: number,
  params?: { page?: number; size?: number; sort?: string[] }
) => {
  return useQuery({
    queryKey: ["photos", "store", storeId, params],
    queryFn: () => photoApi.getPhotosByStore(storeId, params),
    enabled: !!storeId,
  });
};

// 음식별 사진 목록 조회 훅 (임시로 비활성화 - API 수정 후 재활성화)
export const usePhotosByFood = (
  foodItemId: number,
  params?: { page?: number; size?: number; sort?: string[] }
) => {
  return useQuery({
    queryKey: ["photos", "food", foodItemId, params],
    queryFn: () => Promise.resolve({ content: [] }), // 임시로 빈 배열 반환
    enabled: false, // 비활성화
  });
};

// Presigned URL 생성 훅
export const usePresignedUrl = () => {
  return useMutation({
    mutationFn: (data: PresignedUrlRequest) => photoApi.getPresignedUrl(data),
  });
};

// 사진 등록 훅
export const useRegisterPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterPhotoRequest) => photoApi.registerPhoto(data),
    onSuccess: (registeredPhoto) => {
      // 사진 캐시 업데이트
      queryClient.setQueryData(["photo", registeredPhoto.result.photoId], {
        code: 0,
        message: "Success",
        result: registeredPhoto.result,
      });

      // 음식 관련 캐시 무효화 (음식에 사진이 추가되었으므로)
      queryClient.invalidateQueries({
        queryKey: ["foods", "store", registeredPhoto.result.storeId],
      });

      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["photos", "store", registeredPhoto.result.storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["photos", "food", registeredPhoto.result.foodId],
      });
    },
  });
};

// 대표 사진 설정 훅
export const useSetFeaturedPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      photoId,
      isFeatured,
    }: {
      photoId: number;
      isFeatured: boolean;
    }) => photoApi.setFeaturedPhoto(photoId, isFeatured),
    onSuccess: (updatedPhoto) => {
      // 사진 캐시 업데이트
      queryClient.setQueryData(["photo", updatedPhoto.result.photoId], {
        code: 0,
        message: "Success",
        result: updatedPhoto.result,
      });

      // 음식 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["foods", "store"],
      });

      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["photos", "store"],
      });
      queryClient.invalidateQueries({
        queryKey: ["photos", "food"],
      });
    },
  });
};

// 사진 삭제 훅
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: number) => photoApi.deletePhoto(photoId),
    onSuccess: (_, photoId) => {
      // 사진 캐시 제거
      queryClient.removeQueries({
        queryKey: ["photo", photoId],
      });

      // 음식 관련 캐시 무효화 (음식에서 사진이 삭제되었으므로)
      queryClient.invalidateQueries({
        queryKey: ["foods", "store"],
      });

      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["photos", "store"],
      });
      queryClient.invalidateQueries({
        queryKey: ["photos", "food"],
      });
    },
  });
};
