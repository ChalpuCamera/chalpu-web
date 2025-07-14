"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분간 캐시 유지
            staleTime: 5 * 60 * 1000,
            // 백그라운드에서 자동 리페치
            refetchOnWindowFocus: true,
            // 네트워크 재연결 시 자동 리페치
            refetchOnReconnect: true,
            // 에러 발생 시 1회 재시도
            retry: 1,
            // 재시도 딜레이 (1초)
            retryDelay: 1000,
          },
          mutations: {
            // 뮤테이션 에러 발생 시 1회 재시도
            retry: 1,
            // 재시도 딜레이 (1초)
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 