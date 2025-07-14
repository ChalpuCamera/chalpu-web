import { DaumPostcodeData } from "@/types/daum";

// 카카오 우편번호 서비스 스크립트 로드
export const loadDaumPostcodeScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는 경우
    if (window.daum && window.daum.Postcode) {
      resolve();
      return;
    }

    // 이미 스크립트 태그가 있는 경우
    const existingScript = document.getElementById("daum-postcode-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("카카오 우편번호 서비스 로드 실패"))
      );
      return;
    }

    // 새로운 스크립트 태그 생성
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;

    script.onload = () => {
      // 스크립트 로드 후 daum 객체가 사용 가능할 때까지 대기
      const checkDaum = () => {
        if (window.daum && window.daum.Postcode) {
          resolve();
        } else {
          setTimeout(checkDaum, 100);
        }
      };
      checkDaum();
    };

    script.onerror = () => {
      reject(new Error("카카오 우편번호 서비스 로드 실패"));
    };

    document.head.appendChild(script);
  });
};

// 주소 데이터에서 도로명 주소 또는 지번 주소 추출
export const getMainAddress = (data: DaumPostcodeData): string => {
  // 도로명 주소가 있으면 우선 사용, 없으면 지번 주소 사용
  return data.roadAddress || data.jibunAddress || data.address;
};

// 웹뷰 환경 감지 (필요시 사용)
// const isWebView = (): boolean => {
//   const userAgent = navigator.userAgent.toLowerCase();
//   return (
//     userAgent.includes("wv") || // Android WebView
//     userAgent.includes("webview") || // iOS WebView
//     (userAgent.includes("mobile") &&
//       userAgent.includes("safari") &&
//       !userAgent.includes("chrome")) // iOS Safari
//   );
// };

// 주소 검색 모달 생성 및 표시 (웹뷰 친화적)
export const openAddressSearch = async (
  onComplete: (address: string, zonecode: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    await loadDaumPostcodeScript();

    // 기존 모달이 있다면 제거
    const existingModal = document.getElementById("address-search-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 컨테이너 생성
    const modal = document.createElement("div");
    modal.id = "address-search-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 모달 내용 컨테이너
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      height: 80%;
      max-height: 600px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    // 헤더 (닫기 버튼 포함)
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
    `;

    const title = document.createElement("h3");
    title.textContent = "주소 검색";
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
      min-width: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 마우스 호버 효과 (웹 브라우저용)
    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.backgroundColor = "#f3f4f6";
    });
    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.backgroundColor = "transparent";
    });

    closeButton.onclick = () => {
      modal.remove();
    };

    header.appendChild(title);
    header.appendChild(closeButton);

    // 주소 검색 컨테이너
    const searchContainer = document.createElement("div");
    searchContainer.style.cssText = `
      height: calc(100% - 60px);
      overflow: hidden;
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(searchContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 주소 검색 위젯 생성
    const postcode = new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const address = getMainAddress(data);
        console.log("주소 검색 완료:", address, data.zonecode);
        onComplete(address, data.zonecode);
        modal.remove(); // 모달 닫기
      },
      onclose: (state) => {
        console.log("주소 검색 닫힘:", state.state);
        if (state.state === "FORCE_CLOSE") {
          modal.remove();
        }
      },
      width: "100%",
      height: "100%",
      animation: false, // 웹뷰에서 애니메이션 비활성화
      focusInput: true,
      autoMapping: true,
      hideMapBtn: true, // 지도 버튼 숨김 (웹뷰에서 불필요)
      hideEngBtn: true, // 영문 버튼 숨김
      pleaseReadGuide: 0, // 가이드 메시지 숨김
      theme: {
        bgColor: "#ffffff",
        searchBgColor: "#f9fafb",
        contentBgColor: "#ffffff",
        pageBgColor: "#ffffff",
        textColor: "#111827",
        queryTextColor: "#374151",
        postcodeTextColor: "#059669",
        emphTextColor: "#3b82f6",
        outlineColor: "#e5e7eb",
      },
    });

    // 임베드 방식으로 주소 검색 위젯 표시
    postcode.embed(searchContainer, {
      autoClose: false, // 자동 닫기 비활성화 (수동으로 처리)
    });

    // 모달 외부 클릭 시 닫기 (터치와 마우스 모두 지원)
    const handleOutsideClick = (e: Event) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    modal.addEventListener("click", handleOutsideClick);
    modal.addEventListener("touchend", handleOutsideClick);

    // ESC 키로 닫기 (웹 브라우저용)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        modal.remove();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 모달이 제거될 때 이벤트 리스너 정리
    const cleanup = () => {
      document.removeEventListener("keydown", handleKeyDown);
    };

    // 모달 제거 시 정리 함수 호출
    const originalRemove = modal.remove.bind(modal);
    modal.remove = () => {
      cleanup();
      originalRemove();
    };
  } catch (error) {
    console.error("주소 검색 오류:", error);
    if (onError) {
      onError(error as Error);
    } else {
      alert(
        "주소 검색 서비스를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  }
};

// 팝업 방식 주소 검색 (데스크톱용, 웹뷰에서는 사용하지 않음)
export const openAddressSearchPopup = async (
  onComplete: (address: string, zonecode: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    await loadDaumPostcodeScript();

    const postcode = new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const address = getMainAddress(data);
        onComplete(address, data.zonecode);
      },
      onclose: (state) => {
        if (state.state === "FORCE_CLOSE") {
          console.log("주소 검색이 취소되었습니다.");
        }
      },
      width: "100%",
      height: "100%",
      animation: true,
      focusInput: true,
      autoMapping: true,
    });

    postcode.open({
      autoClose: true,
    });
  } catch (error) {
    console.error("주소 검색 오류:", error);
    if (onError) {
      onError(error as Error);
    } else {
      alert(
        "주소 검색 서비스를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  }
};

// 임베드 형태로 주소 검색 위젯 생성 (필요시 사용)
export const embedAddressSearch = async (
  element: HTMLElement,
  onComplete: (address: string, zonecode: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    await loadDaumPostcodeScript();

    const postcode = new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        const address = getMainAddress(data);
        onComplete(address, data.zonecode);
      },
      width: "100%",
      height: "400px",
      animation: false,
      focusInput: true,
      autoMapping: true,
      hideMapBtn: true,
      hideEngBtn: true,
    });

    postcode.embed(element, {
      autoClose: true,
    });
  } catch (error) {
    console.error("주소 검색 오류:", error);
    if (onError) {
      onError(error as Error);
    } else {
      alert("주소 검색 서비스를 불러오는데 실패했습니다.");
    }
  }
};
