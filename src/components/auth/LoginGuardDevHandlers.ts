import { useNativeBridge, AuthTokens } from "@/utils/nativeBridge";
import { DevModeHandlers } from "./LoginGuardTypes";

export function useDevModeHandlers(
  setTokens: (tokens: AuthTokens | null) => void,
  pathname: string
): DevModeHandlers {
  const { bridge, isAvailable } = useNativeBridge();

  const handleDevLogin = () => {
    const mockTokens = {
      accessToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwiZW1haWwiOiJhZG1pbjU0OTRAZGF1bS5uZXQiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUxNDQ3NDgxLCJleHAiOjE3ODI5ODM0ODF9.VF9xEz9kOLaQm9p633V6IrW87qI2dB1PNc3kHZRQlW0",
      refreshToken: "dev-refresh-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    };
    setTokens(mockTokens);
    localStorage.setItem("auth-storage-timestamp", Date.now().toString());
  };

  const handleRetryAuth = () => {
    window.location.reload();
  };

  const handleTestAlert = () => {
    if (isAvailable) {
      bridge.showAlert("이것은 네이티브 Alert 테스트입니다!", "알림");
    } else {
      alert("웹 브라우저에서는 일반 alert이 표시됩니다.");
    }
  };

  const handleTestBridge = () => {
    console.log("=== 네이티브 브릿지 테스트 ===");
    console.log("isAvailable:", isAvailable);
    console.log("window.Android:", !!window.Android);
    console.log("window.webkit:", !!window.webkit);
    console.log("User Agent:", navigator.userAgent);

    if (window.Android) {
      console.log(
        "Android.postMessage:",
        typeof (window.Android as Record<string, unknown>).postMessage
      );
    }
    if (window.webkit?.messageHandlers?.chalpu) {
      console.log(
        "iOS chalpu handler:",
        typeof window.webkit.messageHandlers.chalpu.postMessage
      );
    }

    // 단순한 테스트 메시지 전송
    bridge.postMessage("TEST_MESSAGE", {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  };

  const handleTestResponse = () => {
    console.log("앱 응답 테스트 - receiveNativeMessage 함수 확인");

    // receiveNativeMessage 함수가 있는지 확인
    if (typeof window.receiveNativeMessage === "function") {
      console.log("✅ receiveNativeMessage 함수 존재");

      // 직접 호출해서 테스트
      window.receiveNativeMessage("test_callback", {
        success: true,
        message: "테스트 응답",
      });
    } else {
      console.log("❌ receiveNativeMessage 함수가 없습니다");
    }

    // Android 객체 상세 확인
    if (window.Android) {
      console.log(
        "Android 객체 메서드들:",
        Object.getOwnPropertyNames(window.Android)
      );
    }
  };

  const handleDiagnose = () => {
    console.log("=== 🔍 Android 웹뷰 진단 ===");
    console.log("window.NativeBridge 존재:", !!window.NativeBridge);
    console.log("window.Android 존재:", !!window.Android);

    if (window.NativeBridge) {
      console.log("✅ NativeBridge 발견!");
      console.log(
        "postMessage 메서드:",
        typeof window.NativeBridge.postMessage
      );
    }

    if (window.Android) {
      console.log("✅ Android 발견!");
      console.log("메서드들:", Object.getOwnPropertyNames(window.Android));
    }

    console.log("User Agent:", navigator.userAgent);
  };

  const handleTestToast = () => {
    console.log("기존 showToast 메서드로 테스트");

    if (window.Android) {
      const androidObj = window.Android as Record<string, unknown>;
      if (typeof androidObj.showToast === "function") {
        try {
          (androidObj.showToast as (message: string) => void)(
            "웹에서 호출한 토스트 메시지!"
          );
          console.log("✅ showToast 호출 성공!");
        } catch (error) {
          console.log("❌ showToast 호출 실패:", error);
        }
      } else {
        console.log("❌ showToast 메서드를 찾을 수 없음");
      }
    }
  };

  const handleTestExistingMethods = () => {
    console.log("=== 기존 Android 메서드들 테스트 ===");

    if (!window.Android) {
      console.log("❌ Android 객체가 없습니다");
      return;
    }

    const android = window.Android as Record<string, unknown>;

    // showToast 테스트
    if (typeof android.showToast === "function") {
      try {
        (android.showToast as (message: string) => void)(
          "웹에서 보낸 토스트 메시지입니다!"
        );
        console.log("✅ showToast 성공");
      } catch (error) {
        console.log("❌ showToast 실패:", error);
      }
    }

    // getDeviceInfo 테스트
    if (typeof android.getDeviceInfo === "function") {
      try {
        const deviceInfo = (android.getDeviceInfo as () => unknown)();
        console.log("✅ getDeviceInfo 성공:", deviceInfo);
      } catch (error) {
        console.log("❌ getDeviceInfo 실패:", error);
      }
    }

    // getAuthTokens 테스트
    if (typeof android.getAuthTokens === "function") {
      try {
        const tokens = (android.getAuthTokens as () => unknown)();
        console.log("✅ getAuthTokens 성공:", tokens);
      } catch (error) {
        console.log("❌ getAuthTokens 실패:", error);
      }
    }
  };

  const handleTestCameraSimple = () => {
    console.log("🎯 [handleTestCameraSimple] 카메라 테스트 시작");
    if (isAvailable) {
      bridge.openCamera(pathname, (result) => {
        console.log("🎯 [handleTestCameraSimple] 콜백 함수 실행됨");
        console.log("🎯 [handleTestCameraSimple] 결과:", result);

        if (result.success) {
          console.log("🎯 [handleTestCameraSimple] 카메라 촬영 성공");
          if (result.tempFileURL) {
            console.log(
              "🎯 [handleTestCameraSimple] 파일 URL:",
              result.tempFileURL
            );
          } else {
            console.log(
              "🎯 [handleTestCameraSimple] 파일 URL 없음 (요청만 수락됨)"
            );
          }
          bridge.showAlert("카메라 촬영 성공!", "테스트");
        } else {
          console.error(
            "🎯 [handleTestCameraSimple] 카메라 촬영 실패:",
            result.error
          );
          bridge.showAlert("카메라 촬영 실패", "테스트");
        }
      });
    } else {
      console.log(
        "🎯 [handleTestCameraSimple] 네이티브 앱에서만 사용 가능합니다."
      );
    }
  };

  const handleTestGallery = () => {
    console.log("갤러리 테스트 시작");
    if (isAvailable) {
      bridge.openGallery((result) => {
        console.log("갤러리 결과:", result);
        if (result.success) {
          bridge.showAlert(
            `갤러리에서 파일을 선택했습니다: ${result.tempFileURL}`,
            "성공"
          );
        } else {
          console.error("갤러리 테스트 실패:", result.error);
          bridge.showAlert("갤러리 테스트 실패", "오류");
        }
      });
    }
  };

  return {
    handleTestAlert,
    handleTestBridge,
    handleTestResponse,
    handleDiagnose,
    handleTestToast,
    handleTestExistingMethods,
    handleTestCameraSimple,
    handleTestGallery,
    handleDevLogin,
    handleRetryAuth,
  };
}