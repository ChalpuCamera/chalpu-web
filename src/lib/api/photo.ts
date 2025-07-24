import { apiRequest } from "./client";
import {
  ApiResponse,
  PagedResult,
  Photo,
  RegisterPhotoRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  PageRequest,
} from "./types";

export const photoApi = {
  // 사진 상세 조회
  getPhoto: async (photoId: number): Promise<ApiResponse<Photo>> => {
    return apiRequest<Photo>(`/api/photos/${photoId}`);
  },

  // 가게별 사진 목록 조회 (실제 API 스펙)
  getPhotosByStore: async (
    storeId: number,
    params?: PageRequest
  ): Promise<ApiResponse<PagedResult<Photo>>> => {
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

    return apiRequest<PagedResult<Photo>>(endpoint);
  },

  // 음식별 사진 목록 조회 (실제 API 스펙)
  getPhotosByFood: async (
    foodItemId: number,
    params?: PageRequest
  ): Promise<ApiResponse<PagedResult<Photo>>> => {
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
      ? `/api/photos/store/${foodItemId}?${queryString}`
      : `/api/photos/store/${foodItemId}`;

    return apiRequest<PagedResult<Photo>>(endpoint);
  },

  // Presigned URL 생성
  getPresignedUrl: async (
    data: PresignedUrlRequest
  ): Promise<ApiResponse<PresignedUrlResponse>> => {
    return apiRequest<PresignedUrlResponse>(
      "/api/photos/presigned-url",
      "POST",
      data
    );
  },

  // 사진 등록 (실제 API 스펙)
  registerPhoto: async (
    data: RegisterPhotoRequest
  ): Promise<ApiResponse<Photo>> => {
    return apiRequest<Photo>("/api/photos/register", "POST", data);
  },

  // 대표 사진 설정 (실제 API 스펙)
  setFeaturedPhoto: async (
    photoId: number,
    foodItemId: number
  ): Promise<ApiResponse<unknown>> => {
    return apiRequest<unknown>("/api/photos/featured", "PATCH", {
      photoId,
      foodItemId,
    });
  },

  // 사진 삭제
  deletePhoto: async (photoId: number): Promise<ApiResponse<unknown>> => {
    return apiRequest<unknown>(`/api/photos/${photoId}`, "DELETE");
  },

  // S3에 파일 직접 업로드
  uploadToS3: async (presignedUrl: string, file: File): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(
        `S3 업로드 실패: ${response.status} ${response.statusText}`
      );
    }
  },
};
