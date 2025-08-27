/**
 * 이미지 URL 생성 유틸리티
 * 메뉴판과 다운로드 화면에서 동일한 URL을 사용하여 캐싱되도록 함
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageUrlOptions {
  width?: number;
  height?: number;
  quality?: number;
  type?: 'crop' | 'fit' | 'fill';
}

/**
 * CDN 이미지 URL 생성
 * @param imagePath 이미지 경로
 * @param options 옵션
 * @returns 완전한 이미지 URL
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  options: ImageUrlOptions = {}
): string {
  if (!imagePath) return '';
  
  const {
    width,
    height,
    quality = 70,
    type = 'crop'
  } = options;
  
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL;
  if (!baseUrl) return imagePath;
  
  const params = new URLSearchParams();
  
  if (width && height) {
    params.append('s', `${width}x${height}`);
  } else if (width) {
    params.append('s', `${width}`);
  }
  
  params.append('t', type);
  params.append('q', quality.toString());
  
  return `${baseUrl}/${imagePath}?${params.toString()}`;
}

/**
 * 원본 이미지 비율을 유지하면서 썸네일 URL 생성
 * @param imagePath 이미지 경로
 * @param originalDimensions 원본 이미지 크기
 * @param displaySize 화면에 표시되는 크기 (기본 80px)
 * @returns 썸네일 URL
 */
export function getThumbnailUrl(
  imagePath: string | null | undefined,
  originalDimensions?: ImageDimensions,
  displaySize: number = 80
): string {
  if (!imagePath) return '';
  
  // 화질 개선을 위해 표시 크기의 2-3배로 CDN에서 가져오기
  const cdnSize = Math.max(displaySize * 3, 240); // 최소 240px
  
  if (originalDimensions) {
    // 원본 비율 유지하면서 리사이즈
    const { width, height } = originalDimensions;
    const aspectRatio = width / height;
    
    let thumbnailWidth: number;
    let thumbnailHeight: number;
    
    if (width > height) {
      // 가로가 더 긴 경우
      thumbnailWidth = Math.min(cdnSize, width);
      thumbnailHeight = Math.round(thumbnailWidth / aspectRatio);
    } else {
      // 세로가 더 긴 경우
      thumbnailHeight = Math.min(cdnSize, height);
      thumbnailWidth = Math.round(thumbnailHeight * aspectRatio);
    }
    
    return getImageUrl(imagePath, {
      width: thumbnailWidth,
      height: thumbnailHeight,
      quality: 85, // 화질 개선
      type: 'crop'
    });
  }
  
  // 원본 크기 정보가 없으면 기본 썸네일 (고화질)
  return getImageUrl(imagePath, {
    width: cdnSize,
    height: cdnSize,
    quality: 85, // 화질 개선
    type: 'crop'
  });
}

/**
 * 플랫폼별 크롭된 이미지 URL 생성
 * @param imagePath 이미지 경로
 * @param aspectRatio 타겟 비율 (width/height)
 * @param originalDimensions 원본 이미지 크기
 * @param quality 품질 (기본 100)
 * @returns 크롭된 이미지 URL
 */
export function getCroppedImageUrl(
  imagePath: string | null | undefined,
  aspectRatio: number,
  originalDimensions: ImageDimensions,
  quality: number = 100
): string {
  if (!imagePath) return '';
  
  const { width: imageWidth, height: imageHeight } = originalDimensions;
  const originalAspectRatio = imageWidth / imageHeight;
  
  let outputWidth: number;
  let outputHeight: number;
  
  if (aspectRatio > originalAspectRatio) {
    // 타겟 비율이 원본보다 더 가로로 긴 경우
    outputWidth = imageWidth;
    outputHeight = Math.round(imageWidth / aspectRatio);
  } else {
    // 타겟 비율이 원본보다 덜 가로로 긴 경우
    outputHeight = imageHeight;
    outputWidth = Math.round(imageHeight * aspectRatio);
  }
  
  return getImageUrl(imagePath, {
    width: outputWidth,
    height: outputHeight,
    quality,
    type: 'crop'
  });
}