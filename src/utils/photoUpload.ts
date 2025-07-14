import { photoApi } from "@/lib/api/photo";
import { RegisterPhotoRequest } from "@/lib/api/types";

// 이미지 파일 유효성 검사
export const validateImageFile = (file: File): string | null => {
  // 파일 크기 검사 (15MB 제한)
  const maxSize = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSize) {
    return "파일 크기는 15MB 이하여야 합니다.";
  }

  // 파일 타입 검사
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.";
  }

  return null;
};

// 이미지 크기 정보 가져오기
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("이미지 크기를 읽을 수 없습니다."));
    };
    img.src = URL.createObjectURL(file);
  });
};

// S3 업로드 함수
export const uploadToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(
      `S3 업로드 실패: ${response.status} ${response.statusText}`
    );
  }
};

// 사진 업로드 전체 프로세스
export const uploadPhoto = async (
  file: File,
  storeId: number,
  foodItemId: number
): Promise<{ photoId: number; imageUrl: string }> => {
  try {
    // 1. 파일 유효성 검사
    const validationError = validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // 2. Presigned URL 요청
    const presignedResponse = await photoApi.getPresignedUrl({
      fileName: file.name,
    });

    const { presignedUrl, s3Key } = presignedResponse.result;

    // 3. S3에 파일 업로드
    await uploadToS3(presignedUrl, file);

    // 4. 이미지 크기 정보 가져오기
    const { width, height } = await getImageDimensions(file);

    // 5. 서버에 사진 정보 등록
    const registerData: RegisterPhotoRequest = {
      s3Key,
      fileName: file.name,
      storeId,
      foodItemId,
      fileSize: file.size,
      imageWidth: width,
      imageHeight: height,
    };

    const registerResponse = await photoApi.registerPhoto(registerData);

    return {
      photoId: registerResponse.result.photoId,
      imageUrl: registerResponse.result.imageUrl,
    };
  } catch (error) {
    console.error("사진 업로드 실패:", error);
    throw error;
  }
};
