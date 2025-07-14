import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiResponse } from "./types";

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    // zustand 스토어에서 토큰 가져오기
    const { tokens, isTokenExpired } = useAuthStore.getState();

    if (tokens && !isTokenExpired()) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 처리
apiClient.interceptors.response.use(
  (response) => {
    // 응답 성공 시 데이터만 반환
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 토큰 갱신을 시도하지 않았다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 토큰 클리어 처리
      const { clearTokens } = useAuthStore.getState();
      clearTokens();

      console.log("토큰 만료로 인한 401 에러 - 로그아웃 처리");

      // 토큰 관련 로컬 스토리지 데이터 삭제
      localStorage.removeItem("auth-storage-timestamp");

      return Promise.reject(
        new Error("인증이 만료되었습니다. 다시 로그인해주세요.")
      );
    }

    // 에러 처리
    const message =
      error.response?.data?.message || error.message || "API 요청 실패";
    throw new Error(message);
  }
);

// 기본 API 요청 함수
export async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown
): Promise<ApiResponse<T>> {
  const response = await apiClient.request({
    url: endpoint,
    method,
    data,
  });

  // Axios 인터셉터에서 response.data를 반환하므로 여기서는 이미 ApiResponse<T> 형태
  const apiResponse = response as unknown as ApiResponse<T>;

  // 성공 응답 확인 (code: 0 또는 200)
  if (apiResponse.code === 0 || apiResponse.code === 200) {
    return apiResponse;
  } else {
    throw new Error(apiResponse.message || "API 요청 실패");
  }
}
