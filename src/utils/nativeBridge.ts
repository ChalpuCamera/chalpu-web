import { useEffect, useState } from "react";

// 네이티브 앱 통신을 위한 타입 선언
declare global {
  interface Window {
    Android?: {
      showToast: (message: string) => void;
      getAccessToken: () => string;
      // 기존 Android Interface의 다른 메서드들...
    };
    NativeBridge?: {
      postMessage: (message: string) => string;
    };
    webkit?: {
      messageHandlers?: {
        chalpu?: {
          postMessage: (message: NativeBridgeMessage) => void;
        };
      };
    };
    receiveNativeMessage?: (callbackId: string, result: unknown) => void;
    // 앱에서 주입하는 설정 객체
    appConfig?: {
      userId?: string;
      token?: string;
      apiUrl?: string;
      [key: string]: string | undefined;
    };
  }
}

// 네이티브 브릿지 메시지 타입 정의
export interface NativeBridgeMessage {
  type: string; // 호출할 함수명
  data?: unknown; // 전달할 데이터 (optional)
  callback?: string; // 콜백 ID (응답 받을 때 사용, optional)
}

// 카메라 결과 타입
export interface CameraResult {
  success: boolean;
  filePath?: string; // 파일 경로 (성공 시)
  error?: string; // 에러 메시지 (실패 시)
}

// 갤러리 결과 타입
export interface GalleryResult {
  success: boolean;
  path?: string; // 파일 경로
  error?: string; // 에러 메시지 (실패 시)
}

// 로그아웃/로그인 결과 타입
export interface AuthResult {
  success: boolean;
}

// 인증 토큰 타입
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType?: string;
}

class NativeBridge {
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

  /**
   * 네이티브 앱으로 메시지 전송 (응답 없음)
   * @param type 명령어 (브릿지 함수 이름)
   * @param data 전달할 데이터 (optional)
   */
  postMessage(type: string, data?: unknown): void {
    const message: NativeBridgeMessage = {
      type,
      ...(data !== undefined && { data }),
    };

    this.sendMessage(message);
  }

  /**
   * 네이티브 앱으로 메시지 전송 (응답 있음)
   * @param type 명령어 (브릿지 함수 이름)
   * @param data 전달할 데이터 (optional)
   * @returns Promise<unknown>
   */
  async postMessageWithCallback(
    type: string,
    data?: unknown
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not available"));
        return;
      }

      const callbackId = `callback_${++this.callbackCounter}`;
      this.pendingCallbacks.set(callbackId, resolve);

      const message: NativeBridgeMessage = {
        type,
        ...(data !== undefined && { data }),
        callback: callbackId,
      };

      this.sendMessage(message);

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (this.pendingCallbacks.has(callbackId)) {
          this.pendingCallbacks.delete(callbackId);
          reject(new Error("Native call timeout"));
        }
      }, 10000);
    });
  }

  // 실제 메시지 전송 로직
  private sendMessage(message: NativeBridgeMessage): void {
    const win = window as Window & {
      NativeBridge?: { postMessage?: (message: string) => string };
      webkit?: {
        messageHandlers?: {
          chalpu?: { postMessage?: (message: NativeBridgeMessage) => void };
        };
      };
    };

    // console.log("🔗 네이티브 브릿지 메시지 전송:", message);

    // Android WebView (NativeBridge Interface)
    if (win.NativeBridge?.postMessage) {
      // console.log("📱 NativeBridge로 메시지 전송");
      try {
        const response = win.NativeBridge.postMessage(JSON.stringify(message));
        // console.log("📱 NativeBridge 응답:", response);

        // 콜백이 있는 경우 즉시 응답 처리
        if (message.callback && response) {
          try {
            const parsedResponse = JSON.parse(response);
            this.receiveNativeMessage(message.callback, parsedResponse);
          } catch (e) {
            console.error("응답 파싱 실패:", e);
          }
        }
      } catch (error) {
        console.error("NativeBridge 호출 실패:", error);
      }
    }
    // iOS WKWebView
    else if (win.webkit?.messageHandlers?.chalpu?.postMessage) {
      // console.log("🍎 iOS로 메시지 전송");
      win.webkit.messageHandlers.chalpu.postMessage(message);
    }
    // 개발 환경에서는 콘솔에 로그만 출력
    else {
      // console.log("🌐 브라우저 환경 (네이티브 브릿지 없음)");
      // console.log("Native Bridge (Dev Mode):", message);

      // 콜백이 있는 경우 mock 데이터 반환
      if (message.callback && process.env.NODE_ENV === "development") {
        // console.log("⏱️ Mock 응답 예정:", this.getMockResponse(message.type));
        setTimeout(() => {
          this.receiveNativeMessage(
            message.callback!,
            this.getMockResponse(message.type)
          );
        }, 100);
      }
    }
  }

  // 네이티브에서 웹으로 메시지 수신
  private receiveNativeMessage(callbackId: string, result: unknown) {
    // console.log("📨 네이티브에서 응답 수신:", { callbackId, result });
    const callback = this.pendingCallbacks.get(callbackId);
    if (callback) {
      // console.log("✅ 콜백 실행:", callbackId);
      this.pendingCallbacks.delete(callbackId);
      callback(result);
    } else {
      // console.log("⚠️ 콜백을 찾을 수 없음:", callbackId);
    }
  }

  // 개발 환경용 목 데이터
  private getMockResponse(type: string): unknown {
    switch (type) {
      case "openCamera":
        return {
          success: true,
          filePath: "/mock/path/image.jpg",
        };
      case "openGallery":
        return {
          success: true,
          path: "/mock/path/gallery_image.jpg",
        };
      case "logout":
      case "showLogin":
      case "showAlert":
        return {
          success: true,
        };
      default:
        return { success: true };
    }
  }

  /**
   * 로그아웃 - 로그인 페이지로 이동
   */
  logout(): void {
    this.postMessage("logout");
  }

  /**
   * 로그아웃 - 로그인 페이지로 이동 (응답 있음)
   */
  async logoutWithCallback(): Promise<AuthResult> {
    return this.postMessageWithCallback("logout") as Promise<AuthResult>;
  }

  /**
   * 로그인 페이지로 이동
   */
  showLogin(): void {
    this.postMessage("showLogin");
  }

  /**
   * 로그인 페이지로 이동 (응답 있음)
   */
  async showLoginWithCallback(): Promise<AuthResult> {
    return this.postMessageWithCallback("showLogin") as Promise<AuthResult>;
  }

  /**
   * 카메라 열기
   * @param foodName 음식 이름 (optional)
   */
  openCamera(foodName?: string): void {
    this.postMessage("openCamera", foodName ? { foodName } : undefined);
  }

  /**
   * 카메라 열기 (응답 있음)
   * @param foodName 음식 이름 (optional)
   */
  async openCameraWithCallback(foodName?: string): Promise<CameraResult> {
    return this.postMessageWithCallback(
      "openCamera",
      foodName ? { foodName } : undefined
    ) as Promise<CameraResult>;
  }

  /**
   * 갤러리 열기
   */
  openGallery(): void {
    this.postMessage("openGallery");
  }

  /**
   * 갤러리 열기 (응답 있음)
   */
  async openGalleryWithCallback(): Promise<GalleryResult> {
    return this.postMessageWithCallback(
      "openGallery"
    ) as Promise<GalleryResult>;
  }

  /**
   * 네이티브 앱에서 Alert 다이얼로그 표시
   * @param message 표시할 메시지
   * @param title 다이얼로그 제목 (optional)
   */
  showAlert(message: string, title?: string): void {
    this.postMessage("showAlert", { message, ...(title && { title }) });
  }

  /**
   * 네이티브 앱에서 Alert 다이얼로그 표시 (응답 있음)
   * @param message 표시할 메시지
   * @param title 다이얼로그 제목 (optional)
   */
  async showAlertWithCallback(
    message: string,
    title?: string
  ): Promise<AuthResult> {
    return this.postMessageWithCallback("showAlert", {
      message,
      ...(title && { title }),
    }) as Promise<AuthResult>;
  }
}

// 싱글톤 인스턴스 생성
export const nativeBridge = new NativeBridge();

// React Hook으로 네이티브 앱 사용
export function useNativeApp() {
  const [isWebView, setIsWebView] = useState(false);
  const [appConfig, setAppConfig] = useState<Record<string, string>>({});

  // WebView 환경 확인 및 앱 설정 로드
  useEffect(() => {
    const checkWebView = () => {
      // 1. 브릿지 객체 확인 (가장 확실한 방법)
      const hasBridge = !!(
        window.NativeBridge?.postMessage ||
        window.webkit?.messageHandlers?.chalpu?.postMessage
      );

      // 2. 커스텀 User-Agent 확인 (앱에서 설정한 경우)
      const userAgent = window.navigator.userAgent;
      const hasCustomUserAgent = userAgent.includes("Chalpu");

      // 3. 앱 설정이 있으면 네이티브 앱으로 간주
      const hasAppConfig = !!window.appConfig;

      // 4. URL 파라미터로 앱 환경 확인
      const urlParams = new URLSearchParams(window.location.search);
      const isFromApp = urlParams.has("fromApp") || urlParams.has("app");

      // 브릿지 객체가 있거나 명시적으로 앱에서 왔다고 표시된 경우만 웹뷰로 간주
      const hasNativeApp =
        hasBridge || hasCustomUserAgent || hasAppConfig || isFromApp;
      setIsWebView(hasNativeApp);

      // 앱에서 주입한 설정 로드
      if (window.appConfig) {
        setAppConfig(window.appConfig as Record<string, string>);
      }

      // URL 파라미터에서 설정 로드
      const urlConfig: Record<string, string> = {};
      urlParams.forEach((value, key) => {
        urlConfig[key] = value;
      });

      if (Object.keys(urlConfig).length > 0) {
        setAppConfig((prev) => ({ ...prev, ...urlConfig }));
      }
    };

    checkWebView();
  }, []);

  return {
    bridge: nativeBridge,
    isAvailable: isWebView,
    appConfig,
  };
}

// 기존 useNativeBridge 호환성을 위한 별칭
export const useNativeBridge = useNativeApp;
