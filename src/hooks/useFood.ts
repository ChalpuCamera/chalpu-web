import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodApi } from "@/lib/api/food";
import { CreateFoodRequest, UpdateFoodRequest } from "@/lib/api/types";

// 매장별 음식 목록 조회 훅
export const useFoodsByStore = (
  storeId: number,
  params?: { page?: number; size?: number; sort?: string[] }
) => {
  return useQuery({
    queryKey: ["foods", "store", storeId, params],
    queryFn: () => foodApi.getFoodsByStore(storeId, params),
    enabled: !!storeId,
  });
};

// 특정 음식 상세 조회 훅
export const useFood = (foodId: number) => {
  return useQuery({
    queryKey: ["food", foodId],
    queryFn: () => foodApi.getFood(foodId),
    enabled: !!foodId,
  });
};

// 음식 생성 훅
export const useCreateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      data,
    }: {
      storeId: number;
      data: CreateFoodRequest;
    }) => foodApi.createFood(storeId, data),
    onSuccess: (_, { storeId }) => {
      // 매장별 음식 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["foods", "store", storeId],
      });
    },
  });
};

// 음식 수정 훅
export const useUpdateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      foodId,
      data,
    }: {
      foodId: number;
      data: UpdateFoodRequest;
    }) => foodApi.updateFood(foodId, data),
    onSuccess: (updatedFood, { foodId }) => {
      // 특정 음식 캐시 업데이트
      queryClient.setQueryData(["food", foodId], {
        code: 0,
        message: "Success",
        result: updatedFood.result,
      });

      // 매장별 음식 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["foods", "store", updatedFood.result.storeId],
      });
    },
  });
};

// 음식 삭제 훅
export const useDeleteFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (foodId: number) => foodApi.deleteFood(foodId),
    onSuccess: (_, foodId) => {
      // 특정 음식 캐시 제거
      queryClient.removeQueries({
        queryKey: ["food", foodId],
      });

      // 매장별 음식 목록 캐시 무효화 (모든 매장)
      queryClient.invalidateQueries({
        queryKey: ["foods", "store"],
      });
    },
  });
};
