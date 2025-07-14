import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  storeApi,
  PageRequest,
  UpdateStoreRequest,
  CreateStoreMemberRequest,
  ApiResponse,
  Store,
} from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// Query keys
export const storeKeys = {
  all: ["stores"] as const,
  lists: () => [...storeKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...storeKeys.lists(), { filters }] as const,
  myStores: () => [...storeKeys.all, "my"] as const,
  myStoresList: (params?: PageRequest) =>
    [...storeKeys.myStores(), { params }] as const,
  details: () => [...storeKeys.all, "detail"] as const,
  detail: (id: number) => [...storeKeys.details(), id] as const,
};

// 내 매장 목록 조회 (새로운 API)
export const useMyStores = (params?: PageRequest) => {
  const { isLoggedIn, tokens } = useAuthStore();

  return useQuery({
    queryKey: storeKeys.myStoresList(params),
    queryFn: () => storeApi.getMyStores(params),
    enabled: isLoggedIn && !!tokens, // 로그인 상태일 때만 쿼리 실행
    staleTime: 0, // 즉시 stale 상태로 만들어 항상 최신 데이터 가져오기
    gcTime: 5 * 60 * 1000, // 5분간 메모리에 유지
    retry: (failureCount, error) => {
      // 401 에러는 재시도하지 않음
      if (error.message.includes("401") || error.message.includes("인증")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Queries (기존 API)
export const useStores = () => {
  return useQuery({
    queryKey: storeKeys.lists(),
    queryFn: storeApi.getStores,
  });
};

export const useStore = (id: number) => {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => storeApi.getStore(id),
    enabled: !!id,
    select: (data) => data.result, // ApiResponse에서 result만 추출
  });
};

// Mutations
export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.createStore,
    onSuccess: (data) => {
      // 백엔드 응답 처리
      if (data.code === 0) {
        // 모든 매장 관련 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: storeKeys.all });

        // 특정 쿼리들도 명시적으로 무효화
        queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: storeKeys.myStores() });

        // 캐시에서 완전히 제거하고 다시 가져오기
        queryClient.removeQueries({ queryKey: storeKeys.myStores() });
        queryClient.removeQueries({ queryKey: storeKeys.lists() });
      }
    },
    onError: (error) => {
      console.error("매장 생성 실패:", error);
    },
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStoreRequest }) =>
      storeApi.updateStore(id, data),
    onSuccess: (data, variables) => {
      // 백엔드 응답 처리
      if (data.code === 0) {
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: storeKeys.myStores() });
        queryClient.invalidateQueries({
          queryKey: storeKeys.detail(variables.id),
        });

        // 옵티미스틱 업데이트로 즉시 UI 반영
        queryClient.setQueryData(
          storeKeys.detail(variables.id),
          (oldData: ApiResponse<Store> | undefined) => {
            if (oldData?.result) {
              return {
                ...oldData,
                result: {
                  ...oldData.result,
                  ...variables.data,
                  updatedAt: new Date().toISOString(),
                },
              };
            }
            return oldData;
          }
        );
      }
    },
    onError: (error) => {
      console.error("매장 수정 실패:", error);
    },
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.deleteStore,
    onSuccess: (data, variables) => {
      // 백엔드 응답 처리
      if (data.code === 0) {
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: storeKeys.myStores() });

        // 삭제된 매장 상세 데이터 제거
        queryClient.removeQueries({ queryKey: storeKeys.detail(variables) });

        // 매장 멤버 관련 쿼리도 제거
        queryClient.removeQueries({
          queryKey: [...storeKeys.detail(variables), "members"],
        });
      }
    },
    onError: (error) => {
      console.error("매장 삭제 실패:", error);
    },
  });
};

// 매장 멤버 관련 훅들
export const useStoreMembers = (storeId: number) => {
  const { isLoggedIn, tokens } = useAuthStore();

  return useQuery({
    queryKey: [...storeKeys.detail(storeId), "members"],
    queryFn: () => storeApi.getStoreMembers(storeId),
    enabled: isLoggedIn && !!tokens && !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => data.result, // ApiResponse에서 result만 추출
  });
};

export const useCreateStoreMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      data,
    }: {
      storeId: number;
      data: CreateStoreMemberRequest;
    }) => storeApi.createStoreMember(storeId, data),
    onSuccess: (data, variables) => {
      // 백엔드 응답 처리
      if (data.code === 0) {
        queryClient.invalidateQueries({
          queryKey: [...storeKeys.detail(variables.storeId), "members"],
        });
      }
    },
    onError: (error) => {
      console.error("매장 멤버 초대 실패:", error);
    },
  });
};
