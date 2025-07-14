import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, User } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// Query keys
export const userKeys = {
  all: ["user"] as const,
  info: () => [...userKeys.all, "info"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
};

// 사용자 정보 조회
export const useUserInfo = () => {
  const { isLoggedIn, tokens } = useAuthStore();

  return useQuery({
    queryKey: userKeys.info(),
    queryFn: userApi.getUserInfo,
    enabled: isLoggedIn && !!tokens, // 로그인 상태일 때만 쿼리 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분간 메모리에 유지
    retry: (failureCount, error) => {
      // 401 에러는 재시도하지 않음 (토큰 만료)
      if (error.message.includes("401") || error.message.includes("인증")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// 프로필 업데이트
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Pick<User, "name" | "profileImageUrl">>) =>
      userApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // 사용자 정보 캐시 업데이트
      queryClient.setQueryData(userKeys.info(), updatedUser);

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      console.error("프로필 업데이트 실패:", error);
    },
  });
};

// 계정 삭제
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { clearTokens } = useAuthStore();

  return useMutation({
    mutationFn: userApi.deleteAccount,
    onSuccess: () => {
      // 모든 사용자 관련 캐시 삭제
      queryClient.removeQueries({ queryKey: userKeys.all });

      // 로그아웃 처리
      clearTokens();
    },
    onError: (error) => {
      console.error("계정 삭제 실패:", error);
    },
  });
};

// 사용자 정보 캐시 관리
export const useUserCache = () => {
  const queryClient = useQueryClient();

  return {
    // 캐시된 사용자 정보 가져오기
    getCachedUserInfo: (): User | undefined => {
      return queryClient.getQueryData(userKeys.info());
    },

    // 사용자 정보 캐시 업데이트
    updateCachedUserInfo: (updater: (old: User | undefined) => User) => {
      queryClient.setQueryData(userKeys.info(), updater);
    },

    // 사용자 정보 캐시 무효화
    invalidateUserInfo: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.info() });
    },

    // 모든 사용자 관련 캐시 삭제
    clearUserCache: () => {
      queryClient.removeQueries({ queryKey: userKeys.all });
    },

    // 사용자 정보 미리 가져오기
    prefetchUserInfo: () => {
      return queryClient.prefetchQuery({
        queryKey: userKeys.info(),
        queryFn: userApi.getUserInfo,
        staleTime: 5 * 60 * 1000,
      });
    },
  };
};
