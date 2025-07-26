import { useEffect, useState } from "react";

// 네이티브 앱 통신을 위한 타입 선언
declare global {
  interface Window {
    Android?: {
      postMessage: (message: string) => void; // 문서 규격에 맞춰 수정
      showToast: (message: string) => void;
    };
    NativeBridge?: {
      postMessage: (message: string) => string; // 기존 호환성 유지
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
  tempFileURL?: string; // 파일이 저장된 S3 서버 경로 (성공 시) - 문서 규격에 맞춰 수정
  error?: string; // 에러 메시지 (실패 시)
}

// 갤러리 결과 타입
export interface GalleryResult {
  success: boolean;
  tempFileURL?: string; // 파일 경로
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
    console.log("🔧 [NativeBridge] 생성자 호출됨");
    // 네이티브에서 웹으로 메시지를 받을 때의 핸들러 설정
    if (typeof window !== "undefined") {
      console.log("🔧 [NativeBridge] Window 객체 확인됨");
      (
        window as Window & {
          receiveNativeMessage?: (callbackId: string, result: unknown) => void;
        }
      ).receiveNativeMessage = this.receiveNativeMessage.bind(this);
      console.log(
        "🔧 [NativeBridge] window.receiveNativeMessage 함수 등록 완료"
      );
    } else {
      console.log("🔧 [NativeBridge] Window 객체 없음");
    }
  }

  /**
   * 네이티브 앱으로 메시지 전송
   */
  postMessage(type: string): void;
  postMessage(type: string, callback: (result: unknown) => void): void;
  postMessage(type: string, data: unknown): void;
  postMessage(
    type: string,
    data: unknown,
    callback: (result: unknown) => void
  ): void;
  postMessage(
    type: string,
    dataOrCallback?: unknown | ((result: unknown) => void),
    callback?: (result: unknown) => void
  ): void {
    console.log("📤 [postMessage] 함수 호출됨");
    console.log("📤 [postMessage] 파라미터:", {
      type,
      dataOrCallback,
      callback: !!callback,
    });

    // 두 번째 파라미터가 함수인 경우 콜백으로 처리
    if (typeof dataOrCallback === "function") {
      console.log("📤 [postMessage] 두 번째 파라미터가 콜백 함수");
      const callbackFn = dataOrCallback as (result: unknown) => void;

      if (typeof window === "undefined") {
        console.log("📤 [postMessage] Window 객체 없음 - 즉시 실패");
        callbackFn({ success: false, error: "Window is not available" });
        return;
      }

      const callbackId = `callback_${++this.callbackCounter}`;
      console.log("📤 [postMessage] 콜백 ID 생성:", callbackId);
      this.pendingCallbacks.set(callbackId, callbackFn);
      console.log(
        "📤 [postMessage] 콜백 등록 완료. 현재 대기 중인 콜백 수:",
        this.pendingCallbacks.size
      );

      const message: NativeBridgeMessage = {
        type,
        callback: callbackId,
      };

      console.log("📤 [postMessage] 메시지 생성:", message);
      this.sendMessage(message);

    } else if (callback) {
      // 세 번째 파라미터가 콜백인 경우
      console.log("📤 [postMessage] 세 번째 파라미터가 콜백 함수");
      if (typeof window === "undefined") {
        console.log("📤 [postMessage] Window 객체 없음 - 즉시 실패");
        callback({ success: false, error: "Window is not available" });
        return;
      }

      const callbackId = `callback_${++this.callbackCounter}`;
      console.log("📤 [postMessage] 콜백 ID 생성:", callbackId);
      this.pendingCallbacks.set(callbackId, callback);
      console.log(
        "📤 [postMessage] 콜백 등록 완료. 현재 대기 중인 콜백 수:",
        this.pendingCallbacks.size
      );

      const message: NativeBridgeMessage = {
        type,
        ...(dataOrCallback !== undefined && { data: dataOrCallback }),
        callback: callbackId,
      };

      console.log("📤 [postMessage] 메시지 생성:", message);
      this.sendMessage(message);

    } else {
      // 콜백이 없는 경우
      console.log("📤 [postMessage] 콜백 함수 없음");
      const message: NativeBridgeMessage = {
        type,
        ...(dataOrCallback !== undefined && { data: dataOrCallback }),
      };
      console.log("📤 [postMessage] 메시지 생성:", message);
      this.sendMessage(message);
    }
  }

  // 실제 메시지 전송 로직
  private sendMessage(message: NativeBridgeMessage): void {
    console.log("📡 [sendMessage] 함수 호출됨");
    console.log("📡 [sendMessage] 메시지:", message);

    const win = window as Window & {
      NativeBridge?: { postMessage?: (message: string) => string };
      webkit?: {
        messageHandlers?: {
          chalpu?: { postMessage?: (message: NativeBridgeMessage) => void };
        };
      };
    };

    // Android WebView (NativeBridge Interface)
    if (win.NativeBridge?.postMessage) {
      console.log("📱 [sendMessage] Android NativeBridge 사용");
      try {
        const messageString = JSON.stringify(message);
        console.log(
          "📱 [sendMessage] 네이티브로 전송할 메시지:",
          messageString
        );

        const response = win.NativeBridge.postMessage(messageString);
        console.log("📱 [sendMessage] 네이티브 응답:", response);

        // 콜백이 있는 경우 즉시 응답 처리
        if (message.callback && response) {
          console.log("📱 [sendMessage] 즉시 응답 처리 시작");
          try {
            const parsedResponse = JSON.parse(response);
            console.log("📱 [sendMessage] 파싱된 응답:", parsedResponse);

            // 카메라/갤러리 관련 함수는 즉시 응답을 무시
            if (
              message.type === "openCamera" ||
              message.type === "openGallery"
            ) {
              console.log(
                "📱 [sendMessage] 카메라/갤러리 함수 - 즉시 응답 무시, 실제 촬영 결과 대기"
              );
              // 즉시 응답을 무시하고 실제 촬영 결과를 기다림
              // 나중에 window.receiveNativeMessage()로 실제 결과가 올 것
            } else {
              // 다른 함수들은 즉시 응답 처리
              console.log("📱 [sendMessage] 즉시 응답 처리 실행");
              this.receiveNativeMessage(message.callback, parsedResponse);
            }
          } catch (e) {
            console.error("📱 [sendMessage] 응답 파싱 실패:", e);
          }
        } else {
          console.log("📱 [sendMessage] 즉시 응답 없음 (비동기 대기)");
        }
      } catch (error) {
        console.error("📱 [sendMessage] NativeBridge 호출 실패:", error);
      }
    }
    // Android WebView (문서 규격)
    else if (win.Android?.postMessage) {
      console.log("📱 [sendMessage] Android 문서 규격 사용");
      try {
        const messageString = JSON.stringify(message);
        console.log(
          "📱 [sendMessage] 네이티브로 전송할 메시지:",
          messageString
        );

        // 문서 규격에 맞춰 응답 없이 처리
        win.Android.postMessage(messageString);
        console.log(
          "📱 [sendMessage] Android로 메시지 전송 완료 (비동기 응답 대기)"
        );
      } catch (error) {
        console.error("📱 [sendMessage] Android 호출 실패:", error);
      }
    }
    // iOS WKWebView
    else if (win.webkit?.messageHandlers?.chalpu?.postMessage) {
      console.log("🍎 [sendMessage] iOS WKWebView 사용");
      win.webkit.messageHandlers.chalpu.postMessage(message);
      console.log("🍎 [sendMessage] iOS로 메시지 전송 완료 (비동기 응답 대기)");
    }
    // 개발 환경에서는 콘솔에 로그만 출력
    else {
      console.log("🌐 [sendMessage] 브라우저 환경 (네이티브 브릿지 없음)");
      console.log("🌐 [sendMessage] Mock 모드로 실행");

      // 콜백이 있는 경우 mock 데이터 반환
      if (message.callback && process.env.NODE_ENV === "development") {
        console.log("🌐 [sendMessage] Mock 응답 생성 중...");
        setTimeout(() => {
          const mockResponse = this.getMockResponse(message.type);
          console.log("🌐 [sendMessage] Mock 응답:", mockResponse);
          this.receiveNativeMessage(message.callback!, mockResponse);
        }, 100);
      }
    }
  }

  // 네이티브에서 웹으로 메시지 수신
  private receiveNativeMessage(callbackId: string, result: unknown) {
    console.log("📨 [receiveNativeMessage] 함수 호출됨");
    console.log("📨 [receiveNativeMessage] 파라미터:", { callbackId, result });

    const callback = this.pendingCallbacks.get(callbackId);
    if (callback) {
      console.log("✅ [receiveNativeMessage] 콜백 함수 찾음:", callbackId);
      this.pendingCallbacks.delete(callbackId);
      console.log(
        "✅ [receiveNativeMessage] 콜백 제거 완료. 남은 콜백 수:",
        this.pendingCallbacks.size
      );
      console.log("✅ [receiveNativeMessage] 콜백 함수 실행 시작");
      callback(result);
      console.log("✅ [receiveNativeMessage] 콜백 함수 실행 완료");
    } else {
      console.log("⚠️ [receiveNativeMessage] 콜백을 찾을 수 없음:", callbackId);
      console.log(
        "⚠️ [receiveNativeMessage] 현재 대기 중인 콜백들:",
        Array.from(this.pendingCallbacks.keys())
      );
    }
  }

  // 개발 환경용 목 데이터
  private getMockResponse(type: string): unknown {
    switch (type) {
      case "openCamera":
        return {
          success: true,
          tempFileURL: "/mock/path/image.jpg",
        };
      case "openGallery":
        return {
          success: true,
          tempFileURL: "/mock/path/gallery_image.jpg",
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
   * @param callback 콜백 함수 (optional)
   */
  logout(callback?: (result: AuthResult) => void): void {
    if (callback) {
      this.postMessage("logout", callback as (result: unknown) => void);
    } else {
      this.postMessage("logout");
    }
  }

  /**
   * 로그인 페이지로 이동
   * @param callback 콜백 함수 (optional)
   */
  showLogin(callback?: (result: AuthResult) => void): void {
    if (callback) {
      this.postMessage("showLogin", callback as (result: unknown) => void);
    } else {
      this.postMessage("showLogin");
    }
  }

  /**
   * 카메라 열기
   * @param pathName 경로명 (필수)
   * @param callback 콜백 함수 (optional)
   */
  openCamera(
    pathName: string,
    callback?: (result: CameraResult) => void
  ): void {
    console.log("📸 [openCamera] 함수 호출됨");
    console.log("📸 [openCamera] 파라미터:", {
      pathName,
      callback: !!callback,
    });

    if (callback) {
      console.log("📸 [openCamera] 콜백 함수와 함께 호출");
      this.postMessage(
        "openCamera",
        { pathName },
        callback as (result: unknown) => void
      );
    } else {
      console.log("📸 [openCamera] 콜백 함수 없음");
      this.postMessage("openCamera", { pathName });
    }
  }

  /**
   * 갤러리 열기
   * @param callback 콜백 함수 (optional)
   */
  openGallery(callback?: (result: GalleryResult) => void): void {
    if (callback) {
      this.postMessage("openGallery", callback as (result: unknown) => void);
    } else {
      this.postMessage("openGallery");
    }
  }

  /**
   * 네이티브 앱에서 Alert 다이얼로그 표시
   * @param message 표시할 메시지
   * @param titleOrCallback 다이얼로그 제목 또는 콜백 함수 (optional)
   * @param callback 콜백 함수 (optional)
   */
  showAlert(
    message: string,
    titleOrCallback?: string | ((result: AuthResult) => void),
    callback?: (result: AuthResult) => void
  ): void {
    // 두 번째 파라미터가 함수인 경우 콜백으로 처리
    if (typeof titleOrCallback === "function") {
      this.postMessage(
        "showAlert",
        { message },
        titleOrCallback as (result: unknown) => void
      );
    } else if (callback) {
      // 세 번째 파라미터가 콜백인 경우
      this.postMessage(
        "showAlert",
        {
          message,
          ...(titleOrCallback && { title: titleOrCallback }),
        },
        callback as (result: unknown) => void
      );
    } else {
      // 콜백이 없는 경우
      this.postMessage("showAlert", {
        message,
        ...(titleOrCallback && { title: titleOrCallback }),
      });
    }
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
