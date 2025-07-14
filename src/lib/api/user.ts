import { apiRequest } from "./client";
import { User } from "./types";

// User API
export const userApi = {
  // 현재 사용자 정보 조회
  getUserInfo: (): Promise<User> =>
    apiRequest<User>("/api/user/me").then((res) => res.result),

  // 프로필 업데이트
  updateProfile: (
    data: Partial<Pick<User, "name" | "profileImageUrl">>
  ): Promise<User> =>
    apiRequest<User>("/user/profile", "PUT", data).then((res) => res.result),

  // 계정 삭제
  deleteAccount: (): Promise<void> =>
    apiRequest<void>("/user/account", "DELETE").then(() => undefined),
};
