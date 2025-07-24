import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photoApi } from "@/lib/api/photo";
import { RegisterPhotoRequest, PresignedUrlRequest } from "@/lib/api/types";
import { setFeaturedPhoto } from "@/utils/photoUpload";

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

// 음식별 사진 목록 조회 훅
export const usePhotosByFood = (
  foodId: number,
  params?: { page?: number; size?: number; sort?: string[] }
) => {
  return useQuery({
    queryKey: ["photos", "food", foodId, params],
    queryFn: () => photoApi.getPhotosByFood(foodId, params),
    enabled: !!foodId,
  });
};

// Presigned URL 생성 훅
export const usePresignedUrl = () => {
  return useMutation({
    mutationFn: (data: PresignedUrlRequest) => photoApi.getPresignedUrl(data),
  });
};

// 사진 등록 훅 (대표 사진 자동 설정 포함)
export const useRegisterPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: RegisterPhotoRequest & { isFirstPhoto?: boolean }
    ) => {
      const result = await photoApi.registerPhoto(data);

      // 첫 번째 사진인 경우 자동으로 대표 사진으로 설정
      if (data.isFirstPhoto) {
        try {
          await setFeaturedPhoto(result.result.photoId, data.foodItemId);
        } catch (error) {
          console.warn("대표 사진 자동 설정 실패:", error);
          // 대표 사진 설정 실패는 전체 등록을 실패시키지 않음
        }
      }

      return result;
    },
    onSuccess: (registeredPhoto, variables) => {
      // 사진 캐시 업데이트
      queryClient.setQueryData(["photo", registeredPhoto.result.photoId], {
        code: 0,
        message: "Success",
        result: registeredPhoto.result,
      });

      // 음식 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["foods", "store", registeredPhoto.result.storeId],
      });

      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["photos", "store", registeredPhoto.result.storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["photos", "food", variables.foodItemId],
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
      foodItemId,
    }: {
      photoId: number;
      foodItemId: number;
    }) => photoApi.setFeaturedPhoto(photoId, foodItemId),
    onSuccess: (_, variables) => {
      // 음식 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["foods", "store"],
      });

      // 사진 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["photos", "store"],
      });
      queryClient.invalidateQueries({
        queryKey: ["photos", "food", variables.foodItemId],
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
