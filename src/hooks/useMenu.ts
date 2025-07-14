import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi, Menu } from "@/lib/api";

// Query keys
export const menuKeys = {
  all: ["menus"] as const,
  lists: () => [...menuKeys.all, "list"] as const,
  list: (storeId: string) => [...menuKeys.lists(), storeId] as const,
  details: () => [...menuKeys.all, "detail"] as const,
  detail: (storeId: string, menuId: string) =>
    [...menuKeys.details(), storeId, menuId] as const,
};

// Queries
export const useMenus = (storeId: string) => {
  return useQuery({
    queryKey: menuKeys.list(storeId),
    queryFn: () => menuApi.getMenus(storeId),
    enabled: !!storeId,
  });
};

export const useMenu = (storeId: string, menuId: string) => {
  return useQuery({
    queryKey: menuKeys.detail(storeId, menuId),
    queryFn: () => menuApi.getMenu(storeId, menuId),
    enabled: !!storeId && !!menuId,
  });
};

// Mutations
export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      data,
    }: {
      storeId: string;
      data: Omit<Menu, "id" | "storeId" | "createdAt" | "updatedAt">;
    }) => menuApi.createMenu(storeId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.list(data.storeId) });
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      menuId,
      data,
    }: {
      storeId: string;
      menuId: string;
      data: Partial<Menu>;
    }) => menuApi.updateMenu(storeId, menuId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.list(data.storeId) });
      queryClient.invalidateQueries({
        queryKey: menuKeys.detail(data.storeId, data.id),
      });
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, menuId }: { storeId: string; menuId: string }) =>
      menuApi.deleteMenu(storeId, menuId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.list(storeId) });
    },
  });
};
