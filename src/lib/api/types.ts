// 백엔드 API 응답 타입 정의
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// User 타입
export interface User {
  id: number;
  email: string;
  name: string | null;
  profileImageUrl: string | null;
  provider: string;
}

// Store 타입
export interface Store {
  storeId: number;
  storeName: string;
  businessType?: string;
  address?: string;
  phone?: string;
  businessRegistrationNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// 매장 생성 요청 타입
export interface CreateStoreRequest {
  storeName?: string;
  businessType?: string;
  address?: string;
  phone?: string;
  businessRegistrationNumber?: string;
}

// 매장 수정 요청 타입 - 개별 필드 수정 지원
export interface UpdateStoreRequest {
  storeName?: string;
  businessType?: string;
  address?: string;
  phone?: string;
  businessRegistrationNumber?: string;
}

// 매장 삭제 응답 타입
export interface DeleteStoreResponse {
  storeId: number;
  deleted: boolean;
}

// 매장 멤버 타입
export interface StoreMember {
  userId: number;
  userName: string;
  userEmail: string;
  storeId: number;
  roleType: "OWNER" | "MANAGER" | "EMPLOYEE";
  joinedAt: string;
}

// 매장 멤버 초대 요청 타입
export interface CreateStoreMemberRequest {
  userId: number;
  roleType: "MANAGER" | "EMPLOYEE";
  ownershipPercentage?: number;
}

// 페이지네이션 결과 타입
export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 페이지네이션 요청 파라미터
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string[];
}

// Menu 타입
export interface Menu {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// PhotoGuide 타입
export interface PhotoGuide {
  id: string;
  foodCategory: string;
  title: string;
  description: string;
  imageUrl: string;
  tips: string[];
  difficulty: "easy" | "medium" | "hard";
}

// Food 타입
export interface Food {
  foodItemId: number;
  storeId: number;
  foodName: string;
  description: string;
  ingredients: string;
  cookingMethod: string;
  price: number;
  isActive: boolean;
  photos?: Photo[];
  createdAt: string;
  updatedAt: string;
}

// 음식 생성 요청 타입
export interface CreateFoodRequest {
  foodName: string;
  description?: string;
  ingredients?: string;
  cookingMethod?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
}

// 음식 수정 요청 타입
export interface UpdateFoodRequest {
  foodName?: string;
  description?: string;
  ingredients?: string;
  cookingMethod?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
}

// Photo 타입
export interface Photo {
  photoId: number;
  storeId: number;
  foodId: number;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  imageWidth: number;
  imageHeight: number;
  isFeatured: boolean;
  createdAt: string;
}

// 사진 등록 요청 타입
export interface RegisterPhotoRequest {
  s3Key: string;
  fileName: string;
  storeId: number;
  foodItemId: number;
  fileSize: number;
  imageWidth: number;
  imageHeight: number;
}

// 대표 사진 설정 요청 타입
export interface SetFeaturedPhotoRequest {
  photoId: number;
  isFeatured: boolean;
}

// Presigned URL 요청 타입
export interface PresignedUrlRequest {
  fileName: string;
}

// Presigned URL 응답 타입
export interface PresignedUrlResponse {
  presignedUrl: string;
  s3Key: string;
}
