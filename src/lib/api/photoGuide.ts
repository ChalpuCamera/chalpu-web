import { apiRequest } from "./client";
import { PhotoGuide } from "./types";

// Photo Guide API
export const photoGuideApi = {
  // 모든 촬영 가이드 조회
  getGuides: (): Promise<PhotoGuide[]> =>
    apiRequest<PhotoGuide[]>("/photo-guides").then((res) => res.result),

  // 특정 촬영 가이드 조회
  getGuide: (id: string): Promise<PhotoGuide> =>
    apiRequest<PhotoGuide>(`/photo-guides/${id}`).then((res) => res.result),

  // 카테고리별 촬영 가이드 조회
  getGuidesByCategory: (category: string): Promise<PhotoGuide[]> =>
    apiRequest<PhotoGuide[]>(`/photo-guides?category=${category}`).then((res) => res.result),
};
