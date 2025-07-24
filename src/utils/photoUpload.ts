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
    // 1. Presigned URL 생성
    const presignedResponse = await photoApi.getPresignedUrl({
      fileName: file.name,
    });

    const { presignedUrl, s3Key } = presignedResponse.result;

    // 2. S3에 파일 업로드
    await photoApi.uploadToS3(presignedUrl, file);

    // 3. 이미지 메타데이터 추출
    const { width, height } = await getImageDimensions(file);

    // 4. 서버에 사진 정보 등록
    const registerResponse = await photoApi.registerPhoto({
      s3Key,
      fileName: file.name,
      storeId,
      foodItemId,
      fileSize: file.size,
      imageWidth: width,
      imageHeight: height,
    });

    return {
      photoId: registerResponse.result.photoId,
      imageUrl: registerResponse.result.imageUrl,
    };
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
