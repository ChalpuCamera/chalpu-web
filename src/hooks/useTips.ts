import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";

interface Tip {
  id: string;
  title: string;
  text: string;
}

// Tips 관련 query keys
export const tipsKeys = {
  all: ["tips"] as const,
  tip: (id: string) => ["tips", id] as const,
};

// 날짜 기반 고정된 팁 ID (1-8) 생성 함수
const getTodayTipId = (): string => {
  const today = new Date().toDateString(); // "Mon Oct 21 2024" 형태
  // 날짜 문자열을 숫자로 변환하여 시드로 사용
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash + today.charCodeAt(i)) & 0xffffffff;
  }
  // 1~8 범위의 고정된 값 생성
  return (Math.abs(hash) % 8 + 1).toString();
};

// 특정 팁 조회
export const useTip = (id: string) => {
  return useQuery({
    queryKey: tipsKeys.tip(id),
    queryFn: async () => {
      const response = await apiRequest<Tip>(`/api/home/tips/${id}`);
      return response.result;
    },
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐시 유지
  });
};

// 오늘의 고정된 팁 조회
export const useTodayTip = () => {
  // 날짜 기반으로 고정된 팁 ID 생성
  const tipId = getTodayTipId();
  const today = new Date().toDateString();
  
  return useQuery({
    queryKey: [...tipsKeys.tip(tipId), today],
    queryFn: async () => {
      const response = await apiRequest<Tip>(`/api/home/tips/${tipId}`);
      return response.result;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// CDN 이미지 URL 생성 함수
export const getTipImageUrl = (tipId: string): string => {
  return `${process.env.NEXT_PUBLIC_IMAGE_URL}/tip/${tipId}.webp?s=80x80&t=crop&q=70`;
};