"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuth } from "@/hooks/useAuth";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useMyStores } from "@/hooks/useStore";
import {
  useActivities,
  useCreateActivity,
  useActivityCache,
} from "@/hooks/useActivity";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChevronDown,
  faChevronRight,
  faCamera,
  faUtensils,
  faEdit,
  faShareAlt,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useTodayTip, getTipImageUrl } from "@/hooks/useTips";
import Image from "next/image";

export default function Home() {
  const { bridge, isAvailable } = useNativeBridge();
  const { data: activities, isLoading: activitiesLoading } = useActivities(5);
  const createActivity = useCreateActivity();
  const { getCacheInfo, forceRefresh } = useActivityCache();
  const router = useRouter();

  // 오늘의 팁 데이터 가져오기
  const {
    data: todayTip,
    isLoading: tipLoading,
    error: tipError,
  } = useTodayTip();
  // zustand 스토어 직접 사용
  const { tokens, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { logout } = useAuth(); // 로그아웃 함수만 훅에서 가져오기

  // 사용자 정보 가져오기
  const {
    data: userInfo,
    isLoading: userLoading,
    isError: isUserError,
  } = useUserInfo();

  // 내 매장 목록 가져오기
  const { data: storesData, isLoading: storesLoading } = useMyStores({
    page: 0,
    size: 10,
  });

  const [selectedStore, setSelectedStore] = useState(0);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  // 매장 목록과 선택된 매장 처리
  const stores = storesData?.content || [];
  const hasStores = stores.length > 0;

  const handleStoreChange = (index: number) => {
    setSelectedStore(index);
    setIsStoreDropdownOpen(false);
  };

  const handlePhotoGuide = async () => {
    // 로그인 성공 메시지를 네이티브 앱에 전달
    if (isAvailable && userInfo) {
      bridge.postMessage("LOGIN_SUCCESS", {
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
      });
    }
    if (isAvailable) {
      try {
        console.log("카메라 촬영 시도");
        const result = await bridge.openCameraWithCallback("guide_photo");

        if (result.success) {
          console.log("카메라 촬영 성공:", result.filePath);
          // 촬영된 이미지로 가이드 처리 로직 추가
          // 활동 로그 생성
          createActivity.mutate({
            type: "photo",
            title: "음식 촬영 가이드 사용",
            description: "카메라를 사용하여 음식 사진을 촬영했습니다",
          });
        } else {
          console.error("카메라 촬영 실패:", result.error);
        }
      } catch (error) {
        console.error("카메라 호출 실패:", error);
      }
    } else {
      console.log("네이티브 앱에서만 사용 가능합니다.");
    }
  };

  const handleMenuManagement = () => {
    if (hasStores && stores[selectedStore]) {
      router.push(`/menu?storeId=${stores[selectedStore].storeId}`);
    } else {
      router.push("/menu");
    }
  };

  // const handleMenuDescription = () => {
  //   console.log("메뉴 소개 페이지로 이동 - 추후 구현");
  //   // 추후 router.push('/menu-description') 등으로 구현
  // };

  const handleMyPage = () => {
    console.log("마이페이지로 이동 - 추후 구현");
    router.push("/mypage");
  };

  // Alert 기능 테스트 핸들러
  const handleTestAlert = () => {
    if (isAvailable) {
      bridge.showAlert("이것은 네이티브 Alert 테스트입니다!", "알림");
    } else {
      alert("웹 브라우저에서는 일반 alert이 표시됩니다.");
    }
  };

  // 네이티브 브릿지 상태 확인
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

  // 앱에서 웹으로 응답 테스트
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

  // Android 객체 상세 진단
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

  // 기존 showToast 메서드로 테스트
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

  // 기존 메서드들로 통신 테스트
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

  // 카메라 테스트 (응답 없는 버전)
  const handleTestCameraSimple = () => {
    console.log("단순 카메라 테스트 (응답 없음)");
    bridge.openCamera("test_food");
  };

  // 갤러리 테스트
  const handleTestGallery = async () => {
    console.log("갤러리 테스트 시작");
    if (isAvailable) {
      try {
        const result = await bridge.openGalleryWithCallback();
        console.log("갤러리 결과:", result);
        if (result.success) {
          bridge.showAlert(
            `갤러리에서 파일을 선택했습니다: ${result.path}`,
            "성공"
          );
        }
      } catch (error) {
        console.error("갤러리 테스트 실패:", error);
        bridge.showAlert("갤러리 테스트 실패", "오류");
      }
    }
  };

  // 개발 환경에서 캐시 정보 표시
  const cacheInfo = getCacheInfo();
  const tokenExpiryTime = tokens?.expiresIn;
  const showDevInfo = process.env.NODE_ENV === "development";

  return (
    <div className="bg-white">
      {/* Development Cache Info */}
      {showDevInfo && (
        <div className="bg-gray-100 p-2 text-sm text-gray-600 border-b">
          <div className="max-w-[400px] mx-auto">
            <div className="flex justify-between items-center mb-1">
              <span>
                캐시: {cacheInfo.count}개 |
                {cacheInfo.isValid ? " 유효" : " 무효"} |
                {cacheInfo.lastUpdate
                  ? ` ${cacheInfo.lastUpdate.toLocaleTimeString()}`
                  : " 없음"}
              </span>
              <button
                onClick={forceRefresh}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                새로고침
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>
                인증:{" "}
                {authLoading
                  ? "로딩..."
                  : isLoggedIn
                  ? "로그인됨"
                  : "로그아웃됨"}{" "}
                | 토큰: {tokens ? "있음" : "없음"} | 만료:{" "}
                {tokenExpiryTime
                  ? new Date(tokenExpiryTime).toLocaleTimeString()
                  : "없음"}
              </span>
              {isLoggedIn && (
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  로그아웃
                </button>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>
                사용자:{" "}
                {userLoading
                  ? "로딩..."
                  : isUserError
                  ? "에러"
                  : userInfo?.name || "없음"}{" "}
                | 제공자: {userInfo?.provider || "없음"} | 이메일:{" "}
                {userInfo?.email || "없음"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>네이티브 기능 테스트:</span>
              <div className="flex gap-1">
                <button
                  onClick={handleTestBridge}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                >
                  브릿지
                </button>
                <button
                  onClick={handleTestAlert}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-sm"
                >
                  Alert
                </button>
                <button
                  onClick={handleTestCameraSimple}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                >
                  카메라
                </button>
                <button
                  onClick={handleTestGallery}
                  className="bg-orange-500 text-white px-2 py-1 rounded text-sm"
                >
                  갤러리
                </button>
                <button
                  onClick={handleTestResponse}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  응답
                </button>
                <button
                  onClick={handleDiagnose}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                >
                  진단
                </button>
                <button
                  onClick={handleTestToast}
                  className="bg-purple-700 text-white px-2 py-1 rounded text-sm"
                >
                  showToast
                </button>
                <button
                  onClick={handleTestExistingMethods}
                  className="bg-blue-700 text-white px-2 py-1 rounded text-sm"
                >
                  기존 메서드 테스트
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>
                매장: {storesLoading ? "로딩..." : `${stores.length}개`} | 선택:{" "}
                {hasStores
                  ? stores[selectedStore]?.storeName || "없음"
                  : "없음"}{" "}
                | 총: {storesData?.totalElements || 0}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>
                브릿지 상태: {isAvailable ? "✅ 연결됨" : "❌ 미연결"} |
                NativeBridge:{" "}
                {typeof window !== "undefined" && window.NativeBridge
                  ? "✅"
                  : "❌"}{" "}
                | iOS:{" "}
                {typeof window !== "undefined" &&
                window.webkit?.messageHandlers?.chalpu
                  ? "✅"
                  : "❌"}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Navigation Bar */}
      <div className="w-full bg-white border-b mb-6">
        <div className="px-4 py-2 flex items-center justify-between border-b">
          <div className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
              disabled={!hasStores}
            >
              <span className="font-medium">
                {storesLoading ? (
                  <span className="inline-block w-32 h-5 bg-gray-200 rounded animate-pulse"></span>
                ) : hasStores ? (
                  stores[selectedStore]?.storeName || "매장을 선택해주세요"
                ) : (
                  "등록된 매장이 없습니다"
                )}
              </span>
              {hasStores && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-sm text-gray-500 transition-transform ${
                    isStoreDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {isStoreDropdownOpen && hasStores && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10">
                {stores.map((store, index) => (
                  <button
                    key={store.storeId}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                      index === selectedStore ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    onClick={() => handleStoreChange(index)}
                  >
                    <div>
                      <div className="font-medium">{store.storeName}</div>
                      <div className="text-sm text-gray-500">
                        {store.businessType}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <FontAwesomeIcon
              icon={faBell}
              className="text-xl text-gray-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userInfo?.profileImageUrl || ""} />
              <AvatarFallback>
                {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium">
                {userLoading ? (
                  <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse"></span>
                ) : isUserError ? (
                  "안녕하세요!"
                ) : (
                  `안녕하세요, ${userInfo?.name || "사장"}님!`
                )}
              </p>
              <p className="text-sm text-gray-600">
                오늘도 맛있는 하루 되세요!
              </p>
            </div>
          </div>
          <button
            className="text-sm text-blue-600 flex items-center gap-1"
            onClick={handleMyPage}
          >
            <span>마이페이지</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12 px-4">
        {/* Main Features Grid Section */}
        <div className="mb-12">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-2 !rounded-button border-2"
              onClick={handlePhotoGuide}
            >
              <FontAwesomeIcon
                icon={faCamera}
                className="text-2xl text-blue-600"
              />
              <span className="font-medium">음식 촬영 가이드</span>
              <span className="text-sm text-gray-500">멋진 사진 찍기</span>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-2 !rounded-button border-2"
              onClick={handleMenuManagement}
            >
              <FontAwesomeIcon
                icon={faUtensils}
                className="text-2xl text-green-600"
              />
              <span className="font-medium">메뉴 관리하기</span>
              <span className="text-sm text-gray-500">메뉴 등록/수정</span>
            </Button>

            {/* <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-2 !rounded-button border-2"
              // onClick={handleMenuDescription}
            >
              <FontAwesomeIcon icon={faEdit} className="text-2xl text-purple-600" />
              <span className="font-medium">메뉴 소개 만들기</span>
              <span className="text-sm text-gray-500">매력적인 설명 작성</span>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-2 !rounded-button border-2"
              // onClick={handleSNSContent}
            >
              <FontAwesomeIcon icon={faShareAlt} className="text-2xl text-orange-600" />
              <span className="font-medium">SNS 콘텐츠</span>
              <span className="text-sm text-gray-500">홍보 콘텐츠 제작</span>
            </Button> */}
          </div>
        </div>

        {/* Today's Tip Section */}
        <div className="mb-12">
          <Card className="p-4 bg-orange-50">
            <div className="flex gap-4">
              <div className="w-[80px] h-[80px] bg-orange-200 rounded-lg flex items-center justify-center overflow-hidden">
                {tipLoading ? (
                  <div className="w-full h-full bg-orange-300 animate-pulse"></div>
                ) : todayTip && !tipError ? (
                  <Image
                    src={getTipImageUrl(todayTip.id)}
                    alt={todayTip.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 기본 아이콘으로 대체
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `<FontAwesome icon={faLightbulb} className="text-2xl text-orange-600" />`;
                    }}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faLightbulb}
                    className="text-2xl text-orange-600"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon
                    icon={faLightbulb}
                    className="text-orange-500"
                  />
                  <h3 className="font-medium">오늘의 팁</h3>
                </div>
                {tipLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-orange-300 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-orange-200 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-orange-200 rounded w-4/5 animate-pulse"></div>
                  </div>
                ) : todayTip && !tipError ? (
                  <>
                    <h4 className="font-medium mb-1">{todayTip.title}</h4>
                    <p className="text-sm text-gray-600">{todayTip.text}</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium mb-1">자연광 활용하기</h4>
                    <p className="text-sm text-gray-600">
                      창가 근처에서 촬영하면 음식이 더욱 맛있어 보여요.
                      플래시보다는 자연스러운 빛을 활용해 보세요!
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities Section */}
        <div>
          <h3 className="font-medium mb-4">최근 활동</h3>
          {activitiesLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "photo"
                        ? "bg-blue-100"
                        : activity.type === "menu"
                        ? "bg-green-100"
                        : activity.type === "description"
                        ? "bg-purple-100"
                        : "bg-orange-100"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        activity.type === "photo"
                          ? faCamera
                          : activity.type === "menu"
                          ? faUtensils
                          : activity.type === "description"
                          ? faEdit
                          : faShareAlt
                      }
                      className={`${
                        activity.type === "photo"
                          ? "text-blue-600"
                          : activity.type === "menu"
                          ? "text-green-600"
                          : activity.type === "description"
                          ? "text-purple-600"
                          : "text-orange-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>아직 활동 내역이 없습니다.</p>
              <p className="text-base mt-1">
                첫 번째 음식 사진을 촬영해보세요!
              </p>
            </div>
          )}
        </div>

        {/* Network Status Section */}
        <div>
          {!isAvailable && (
            <div className="bg-yellow-100 rounded-lg p-3 mt-8">
              <p className="text-base text-yellow-800 text-center">
                ⚠️ 네이티브 기능을 사용하려면 앱에서 실행해주세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
