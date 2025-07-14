import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Activity 타입 정의
export interface Activity {
  id: string;
  type: "photo" | "menu" | "description" | "content";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// 로컬 스토리지 키
const ACTIVITY_STORAGE_KEY = "chalpu_recent_activities";
const ACTIVITY_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

// 캐시된 활동 데이터 타입
interface CachedActivityData {
  activities: Activity[];
  timestamp: number;
}

// 로컬 스토리지 유틸리티
const activityCache = {
  // 활동 저장
  save: (activities: Activity[]) => {
    try {
      const data: CachedActivityData = {
        activities,
        timestamp: Date.now(),
      };
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("활동 캐시 저장 실패:", error);
    }
  },

  // 활동 불러오기
  load: (): Activity[] | null => {
    try {
      const cached = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (!cached) return null;

      const data: CachedActivityData = JSON.parse(cached);

      // 7일 이상 된 데이터는 무효화
      if (Date.now() - data.timestamp > ACTIVITY_CACHE_DURATION) {
        activityCache.clear();
        return null;
      }

      // 1주일 이내 활동만 필터링
      const oneWeekAgo = Date.now() - ACTIVITY_CACHE_DURATION;
      return data.activities.filter(
        (activity) => new Date(activity.timestamp).getTime() > oneWeekAgo
      );
    } catch (error) {
      console.warn("활동 캐시 로드 실패:", error);
      return null;
    }
  },

  // 새 활동 추가
  addActivity: (newActivity: Activity) => {
    const cached = activityCache.load() || [];
    const updated = [newActivity, ...cached].slice(0, 50); // 최대 50개 유지
    activityCache.save(updated);
  },

  // 캐시 삭제
  clear: () => {
    try {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    } catch (error) {
      console.warn("활동 캐시 삭제 실패:", error);
    }
  },

  // 캐시 유효성 확인
  isValid: (): boolean => {
    try {
      const cached = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (!cached) return false;

      const data: CachedActivityData = JSON.parse(cached);
      return Date.now() - data.timestamp <= ACTIVITY_CACHE_DURATION;
    } catch {
      return false;
    }
  },
};

// Query keys
export const activityKeys = {
  all: ["activities"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (limit?: number) => [...activityKeys.lists(), { limit }] as const,
};

// Queries
export const useActivities = (limit?: number) => {
  return useQuery({
    queryKey: activityKeys.list(limit),
    queryFn: async () => {
      // 로컬 스토리지에서만 데이터 가져오기 (백엔드 API 호출 없음)
      const cached = activityCache.load();

      if (cached && cached.length > 0) {
        return limit ? cached.slice(0, limit) : cached;
      }

      // 캐시된 데이터가 없으면 빈 배열 반환
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 메모리에 유지
  });
};

// Mutations
export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newActivityData: Omit<Activity, "id" | "timestamp">) => {
      // 로컬에서만 활동 생성 (백엔드 API 호출 없음)
      const newActivity: Activity = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...newActivityData,
        timestamp: new Date().toISOString(),
      };

      // 로컬 스토리지에 저장
      activityCache.addActivity(newActivity);

      return newActivity;
    },
    onSuccess: () => {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
    onError: (error) => {
      console.warn("활동 생성 실패:", error);
    },
  });
};

// 캐시 관리 훅
export const useActivityCache = () => {
  const queryClient = useQueryClient();

  return {
    clearCache: activityCache.clear,
    getCacheInfo: () => {
      const cached = activityCache.load();
      return {
        count: cached?.length || 0,
        isValid: activityCache.isValid(),
        lastUpdate: (() => {
          try {
            const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
            if (data) {
              const parsed: CachedActivityData = JSON.parse(data);
              return new Date(parsed.timestamp);
            }
          } catch {}
          return null;
        })(),
      };
    },
    forceRefresh: () => {
      activityCache.clear();
      // React Query 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  };
};
