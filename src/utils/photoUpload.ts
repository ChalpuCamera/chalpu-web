import { photoApi } from "@/lib/api/photo";

export interface UploadResult {
  photoId: number;
  imageUrl: string;
}

/**
 * 사진 업로드 전체 플로우
 * 1. Presigned URL 생성
 * 2. S3에 파일 업로드
 * 3. 서버에 사진 정보 등록
 */
export const uploadPhoto = async (
  file: File,
  storeId: number,
  foodItemId: number
): Promise<UploadResult> => {
  try {
    console.log("=== 사진 업로드 시작 ===");
    console.log("파일 정보:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    console.log("매장 ID:", storeId, "음식 ID:", foodItemId);

    // 1. Presigned URL 생성
    console.log("1. Presigned URL 생성 중...");
    const presignedResponse = await photoApi.getPresignedUrl({
      fileName: file.name,
    });
    console.log("Presigned URL 응답:", presignedResponse);

    const { presignedUrl, s3Key } = presignedResponse.result;
    console.log("Presigned URL:", presignedUrl);
    console.log("S3 Key:", s3Key);

    // 2. S3에 파일 업로드
    console.log("2. S3 업로드 중...");
    await photoApi.uploadToS3(presignedUrl, file);
    console.log("S3 업로드 완료");

    // 3. 이미지 메타데이터 추출
    console.log("3. 이미지 메타데이터 추출 중...");
    const { width, height } = await getImageDimensions(file);
    console.log("이미지 크기:", { width, height });

    // 4. 서버에 사진 정보 등록
    console.log("4. 서버에 사진 정보 등록 중...");
    const registerResponse = await photoApi.registerPhoto({
      s3Key,
      fileName: file.name,
      storeId,
      foodItemId,
      fileSize: file.size,
      imageWidth: width,
      imageHeight: height,
    });
    console.log("서버 등록 응답:", registerResponse);

    const result = {
      photoId: registerResponse.result.photoId,
      imageUrl: registerResponse.result.imageUrl,
    };
    console.log("업로드 완료:", result);

    // 업로드된 사진을 대표 사진으로 설정
    if (foodItemId !== 0) {
      await photoApi.setFeaturedPhoto(result.photoId, foodItemId);
      console.log("대표 사진 설정 완료");
    }

    return result;
  } catch (error) {
    console.error("사진 업로드 실패:", error);
    throw new Error(
      error instanceof Error
        ? `사진 업로드 실패: ${error.message}`
        : "사진 업로드에 실패했습니다."
    );
  }
};

/**
 * 이미지 파일의 가로/세로 크기 추출
 */
const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 읽을 수 없습니다."));
    };

    img.src = url;
  });
};

/**
 * 대표 사진 설정
 */
export const setFeaturedPhoto = async (
  photoId: number,
  foodItemId: number
): Promise<void> => {
  try {
    await photoApi.setFeaturedPhoto(photoId, foodItemId);
  } catch (error) {
    console.error("대표 사진 설정 실패:", error);
    throw new Error(
      error instanceof Error
        ? `대표 사진 설정 실패: ${error.message}`
        : "대표 사진 설정에 실패했습니다."
    );
  }
};
