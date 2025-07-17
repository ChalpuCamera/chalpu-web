import { apiRequest } from "./client";
import {
  Photo,
  RegisterPhotoRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  PagedResult,
  PageRequest,
  ApiResponse,
} from "./types";

// Photo API
export const photoApi = {
  // Presigned URL 생성
  getPresignedUrl: (
    data: PresignedUrlRequest
  ): Promise<ApiResponse<PresignedUrlResponse>> =>
    apiRequest<PresignedUrlResponse>("/api/photos/presigned-url", "POST", data),

  // 사진 정보 등록
  registerPhoto: (data: RegisterPhotoRequest): Promise<ApiResponse<Photo>> =>
    apiRequest<Photo>("/api/photos/register", "POST", data),

  // 사진 상세 조회
  getPhoto: (photoId: number): Promise<ApiResponse<Photo>> =>
    apiRequest<Photo>(`/api/photos/${photoId}`),

  // 사진 삭제
  deletePhoto: (photoId: number): Promise<ApiResponse<object>> =>
    apiRequest<object>(`/api/photos/${photoId}`, "DELETE"),

  // 대표 사진 설정
  setFeaturedPhoto: (
    photoId: number,
    isFeatured: boolean
  ): Promise<ApiResponse<Photo>> =>
    apiRequest<Photo>(`/api/photos/${photoId}/featured`, "PUT", { isFeatured }),

  // 가게별 사진 목록 조회
  getPhotosByStore: (
    storeId: number,
    params?: PageRequest
  ): Promise<PagedResult<Photo>> => {
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
      ? `/api/photos/store/${storeId}?${queryString}`
      : `/api/photos/store/${storeId}`;

    return apiRequest<PagedResult<Photo>>(endpoint).then(
      (response) => response.result
    );
  },

  // 음식별 사진 목록 조회 (임시로 비활성화 - API 수정 후 재활성화)
  getPhotosByFood: (): Promise<PagedResult<Photo>> => {
    // 임시로 빈 결과 반환
    return Promise.resolve({
      content: [],
      page: 0,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });
  },
};
