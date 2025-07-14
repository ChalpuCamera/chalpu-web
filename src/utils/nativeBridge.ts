// 네이티브 브릿지 메시지 타입 정의
export interface NativeBridgeMessage {
  type: string;
  data?: unknown;
  callback?: string;
}

// 네이티브에서 호출할 수 있는 기능들
export interface NativeFunctions {
  // 카메라 관련
  openCamera: (options?: CameraOptions) => Promise<CameraResult>;
  openGallery: (options?: GalleryOptions) => Promise<GalleryResult>;

  // 인증 관련
  getAuthTokens: () => Promise<AuthTokens>;
  refreshAuthToken: (refreshToken: string) => Promise<AuthTokens>;
  logout: () => Promise<void>;
  showLogin: () => Promise<void>;

  // 디바이스 정보
  getDeviceInfo: () => Promise<DeviceInfo>;

  // 파일 시스템
  saveFile: (data: string, filename: string) => Promise<boolean>;

  // 네트워크
  getNetworkStatus: () => Promise<NetworkStatus>;

  // 알림
  showNativeAlert: (message: string, title?: string) => Promise<void>;

  // 앱 관련
  closeApp: () => void;
  minimizeApp: () => void;
}

// 카메라 옵션 타입
export interface CameraOptions {
  quality?: number; // 0-100
  allowEdit?: boolean;
  encodingType?: "JPEG" | "PNG";
  targetWidth?: number;
  targetHeight?: number;
  mediaType?: "PHOTO" | "VIDEO" | "ALLMEDIA";
}

// 카메라 결과 타입
export interface CameraResult {
  success: boolean;
  imageData?: string; // base64 encoded image
  filePath?: string;
  error?: string;
}

// 갤러리 옵션 타입
export interface GalleryOptions {
  selectionLimit?: number;
  mediaType?: "PHOTO" | "VIDEO" | "ALLMEDIA";
}

// 갤러리 결과 타입
export interface GalleryResult {
  success: boolean;
  files?: Array<{
    data: string;
    path: string;
    type: string;
  }>;
  error?: string;
}

// 디바이스 정보 타입
export interface DeviceInfo {
  platform: "ios" | "android";
  version: string;
  model: string;
  uuid: string;
  manufacturer: string;
}

// 네트워크 상태 타입
export interface NetworkStatus {
  isConnected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
}

// 인증 토큰 타입
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType?: string;
}

class NativeBridge implements NativeFunctions {
  private callbackCounter = 0;
  private pendingCallbacks: Map<string, (result: unknown) => void> = new Map();

  constructor() {
    // 네이티브에서 웹으로 메시지를 받을 때의 핸들러 설정
    if (typeof window !== "undefined") {
      (
        window as Window & {
          receiveNativeMessage?: (callbackId: string, result: unknown) => void;
        }
      ).receiveNativeMessage = this.receiveNativeMessage.bind(this);
    }
  }

  // 네이티브로 메시지 전송
  private sendToNative(type: string, data?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not available"));
        return;
      }

      const callbackId = `callback_${++this.callbackCounter}`;
      this.pendingCallbacks.set(callbackId, resolve);

      const message: NativeBridgeMessage = {
        type,
        data,
        callback: callbackId,
      };

      const win = window as Window & {
        Android?: { receiveMessage?: (message: string) => void };
        webkit?: {
          messageHandlers?: {
            chalpu?: { postMessage?: (message: NativeBridgeMessage) => void };
          };
        };
      };

      // Android WebView
      if (win.Android?.receiveMessage) {
        win.Android.receiveMessage(JSON.stringify(message));
      }
      // iOS WKWebView
      else if (win.webkit?.messageHandlers?.chalpu?.postMessage) {
        win.webkit.messageHandlers.chalpu.postMessage(message);
      }
      // 웹뷰가 아닌 경우 또는 브릿지가 준비되지 않은 경우
      else {
        // 개발 환경에서는 mock 데이터 반환
        if (process.env.NODE_ENV === "development") {
          setTimeout(() => {
            this.receiveNativeMessage(callbackId, this.getMockResponse(type));
          }, 100);
        } else {
          reject(new Error("Native bridge is not available"));
        }
      }

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (this.pendingCallbacks.has(callbackId)) {
          this.pendingCallbacks.delete(callbackId);
          reject(new Error("Native call timeout"));
        }
      }, 10000);
    });
  }

  // 네이티브에서 웹으로 메시지 수신
  private receiveNativeMessage(callbackId: string, result: unknown) {
    const callback = this.pendingCallbacks.get(callbackId);
    if (callback) {
      this.pendingCallbacks.delete(callbackId);
      callback(result);
    }
  }

  // 개발 환경용 목 데이터
  private getMockResponse(type: string): unknown {
    switch (type) {
      case "openCamera":
        return {
          success: true,
          imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
          filePath: "/mock/path/image.jpg",
        };
      case "getDeviceInfo":
        return {
          platform: "android",
          version: "11.0",
          model: "Mock Device",
          uuid: "mock-uuid-1234",
          manufacturer: "Mock Manufacturer",
        };
      case "getNetworkStatus":
        return {
          isConnected: true,
          connectionType: "wifi",
        };
      case "getAuthTokens":
        return {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 3600,
          tokenType: "Bearer",
        };
      case "refreshAuthToken":
        return {
          accessToken: "mock-new-access-token",
          refreshToken: "mock-new-refresh-token",
          expiresIn: 3600,
          tokenType: "Bearer",
        };
      case "logout":
        return { success: true };
      case "showLogin":
        return { success: true };
      default:
        return { success: true };
    }
  }

  // 인증 토큰 가져오기
  async getAuthTokens(): Promise<AuthTokens> {
    return this.sendToNative("getAuthTokens") as Promise<AuthTokens>;
  }

  // 토큰 갱신
  async refreshAuthToken(refreshToken: string): Promise<AuthTokens> {
    return this.sendToNative("refreshAuthToken", {
      refreshToken,
    }) as Promise<AuthTokens>;
  }

  // 로그아웃
  async logout(): Promise<void> {
    return this.sendToNative("logout") as Promise<void>;
  }

  // 로그인 화면 표시
  async showLogin(): Promise<void> {
    return this.sendToNative("showLogin") as Promise<void>;
  }

  // 카메라 열기
  async openCamera(options: CameraOptions = {}): Promise<CameraResult> {
    return this.sendToNative("openCamera", options) as Promise<CameraResult>;
  }

  // 갤러리 열기
  async openGallery(options: GalleryOptions = {}): Promise<GalleryResult> {
    return this.sendToNative("openGallery", options) as Promise<GalleryResult>;
  }

  // 디바이스 정보 가져오기
  async getDeviceInfo(): Promise<DeviceInfo> {
    return this.sendToNative("getDeviceInfo") as Promise<DeviceInfo>;
  }

  // 파일 저장
  async saveFile(data: string, filename: string): Promise<boolean> {
    const result = (await this.sendToNative("saveFile", {
      data,
      filename,
    })) as { success: boolean };
    return result.success;
  }

  // 네트워크 상태 확인
  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.sendToNative("getNetworkStatus") as Promise<NetworkStatus>;
  }

  // 네이티브 알림 표시
  async showNativeAlert(message: string, title?: string): Promise<void> {
    return this.sendToNative("showNativeAlert", {
      message,
      title,
    }) as Promise<void>;
  }

  // 앱 종료
  closeApp(): void {
    this.sendToNative("closeApp").catch(console.error);
  }

  // 앱 최소화
  minimizeApp(): void {
    this.sendToNative("minimizeApp").catch(console.error);
  }

  // 브릿지가 사용 가능한지 확인
  isAvailable(): boolean {
    if (typeof window === "undefined") return false;

    const win = window as Window & {
      Android?: { receiveMessage?: (message: string) => void };
      webkit?: {
        messageHandlers?: {
          chalpu?: { postMessage?: (message: NativeBridgeMessage) => void };
        };
      };
    };

    return !!(
      win.Android?.receiveMessage ||
      win.webkit?.messageHandlers?.chalpu?.postMessage
    );
  }
}

// 싱글톤 인스턴스 생성
export const nativeBridge = new NativeBridge();

// React Hook으로 네이티브 브릿지 사용
export const useNativeBridge = () => {
  return {
    bridge: nativeBridge,
    isAvailable: nativeBridge.isAvailable(),
  };
};
