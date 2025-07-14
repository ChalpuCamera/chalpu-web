import { apiRequest } from "./client";
import { PhotoGuide } from "./types";

// Photo Guide API
export const photoGuideApi = {
  // 모든 촬영 가이드 조회
  getGuides: (): Promise<PhotoGuide[]> =>
    apiRequest<PhotoGuide[]>("/photo-guides"),

  // 특정 촬영 가이드 조회
  getGuide: (id: string): Promise<PhotoGuide> =>
    apiRequest<PhotoGuide>(`/photo-guides/${id}`),

  // 카테고리별 촬영 가이드 조회
  getGuidesByCategory: (category: string): Promise<PhotoGuide[]> =>
    apiRequest<PhotoGuide[]>(`/photo-guides?category=${category}`),
};
