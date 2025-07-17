import { apiRequest } from "./client";
import {
  Food,
  PagedResult,
  PageRequest,
  CreateFoodRequest,
  UpdateFoodRequest,
  ApiResponse,
} from "./types";

// Food API
export const foodApi = {
  // 매장별 음식 목록 조회 (페이지네이션)
  getFoodsByStore: (
    storeId: number,
    params?: PageRequest
  ): Promise<PagedResult<Food>> => {
    const searchParams = new URLSearchParams();

    // API 명세에 맞게 pageable 객체로 전달
    const pageable = {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || [],
    };

    searchParams.append("pageable", JSON.stringify(pageable));

    const queryString = searchParams.toString();
    const endpoint = `/api/foods/store/${storeId}?${queryString}`;

    return apiRequest<PagedResult<Food>>(endpoint).then(
      (response) => response.result
    );
  },

  // 특정 음식 상세 조회
  getFood: (foodId: number): Promise<ApiResponse<Food>> =>
    apiRequest<Food>(`/api/foods/${foodId}`),

  // 음식 생성
  createFood: (
    storeId: number,
    data: CreateFoodRequest
  ): Promise<ApiResponse<Food>> =>
    apiRequest<Food>(`/api/foods/store/${storeId}`, "POST", data),

  // 음식 수정
  updateFood: (
    foodId: number,
    data: UpdateFoodRequest
  ): Promise<ApiResponse<Food>> =>
    apiRequest<Food>(`/api/foods/${foodId}`, "PUT", data),

  // 음식 삭제
  deleteFood: (foodId: number): Promise<ApiResponse<object>> =>
    apiRequest<object>(`/api/foods/${foodId}`, "DELETE"),
};
