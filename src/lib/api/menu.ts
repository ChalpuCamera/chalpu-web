import { apiRequest } from "./client";
import { Menu } from "./types";

// Menu API
export const menuApi = {
  // 특정 가게의 모든 메뉴 조회
  getMenus: (storeId: string): Promise<Menu[]> =>
    apiRequest<Menu[]>(`/api/stores/${storeId}/menus`).then((res) => res.result),

  // 특정 메뉴 조회
  getMenu: (storeId: string, menuId: string): Promise<Menu> =>
    apiRequest<Menu>(`/api/stores/${storeId}/menus/${menuId}`).then((res) => res.result),

  // 메뉴 생성
  createMenu: (
    storeId: string,
    data: Omit<Menu, "id" | "storeId" | "createdAt" | "updatedAt">
  ): Promise<Menu> =>
    apiRequest<Menu>(`/api/stores/${storeId}/menus`, "POST", data).then((res) => res.result),

  // 메뉴 수정
  updateMenu: (
    storeId: string,
    menuId: string,
    data: Partial<Menu>
  ): Promise<Menu> =>
    apiRequest<Menu>(`/api/stores/${storeId}/menus/${menuId}`, "PUT", data).then((res) => res.result),

  // 메뉴 삭제
  deleteMenu: (storeId: string, menuId: string): Promise<void> =>
    apiRequest<void>(`/api/stores/${storeId}/menus/${menuId}`, "DELETE").then(() => undefined),
};
