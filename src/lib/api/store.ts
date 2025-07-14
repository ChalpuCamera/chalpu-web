import { apiRequest } from "./client";
import {
  Store,
  PagedResult,
  PageRequest,
  CreateStoreRequest,
  UpdateStoreRequest,
  StoreMember,
  CreateStoreMemberRequest,
  ApiResponse,
  DeleteStoreResponse,
} from "./types";

// Store API
export const storeApi = {
  // 내 매장 목록 조회 (페이지네이션)
  getMyStores: (params?: PageRequest): Promise<PagedResult<Store>> => {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) {
      searchParams.append("page", params.page.toString());
    }
    if (params?.size !== undefined) {
      searchParams.append("size", params.size.toString());
    }
    if (params?.sort) {
      params.sort.forEach((sortParam) => {
        searchParams.append("sort", sortParam);
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/stores/my?${queryString}`
      : "/api/stores/my";

    return apiRequest<PagedResult<Store>>(endpoint).then(
      (response) => response.result
    );
  },

  // 모든 가게 조회 (기존 API 유지)
  getStores: (): Promise<Store[]> =>
    apiRequest<Store[]>("/stores").then((response) => response.result),

  // 특정 가게 조회
  getStore: (id: number): Promise<ApiResponse<Store>> =>
    apiRequest<Store>(`/api/stores/${id}`),

  // 가게 생성
  createStore: (data: CreateStoreRequest): Promise<ApiResponse<Store>> =>
    apiRequest<Store>("/api/stores", "POST", data),

  // 가게 정보 수정 (전체 또는 개별 필드)
  updateStore: (
    id: number,
    data: UpdateStoreRequest
  ): Promise<ApiResponse<Store>> =>
    apiRequest<Store>(`/api/stores/${id}`, "PUT", data),

  // 가게 삭제
  deleteStore: (id: number): Promise<ApiResponse<DeleteStoreResponse>> =>
    apiRequest<DeleteStoreResponse>(`/api/stores/${id}`, "DELETE"),

  // 매장 멤버 목록 조회
  getStoreMembers: (storeId: number): Promise<ApiResponse<StoreMember[]>> =>
    apiRequest<StoreMember[]>(`/api/stores/${storeId}/members`),

  // 매장 멤버 초대
  createStoreMember: (
    storeId: number,
    data: CreateStoreMemberRequest
  ): Promise<ApiResponse<StoreMember>> =>
    apiRequest<StoreMember>(`/api/stores/${storeId}/members`, "POST", data),
};
