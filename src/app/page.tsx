"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { useNativeBridge } from "@/utils/nativeBridge";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useMyStores } from "@/hooks/useStore";
import { useActivities, useCreateActivity } from "@/hooks/useActivity";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import {
  faChevronDown,
  faChevronRight,
  faCamera,
  faUtensils,
  faEdit,
  faShareAlt,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter, usePathname } from "next/navigation";
import { useTodayTip, getTipImageUrl } from "@/hooks/useTips";
import Image from "next/image";

export default function Home() {
  const { bridge, isAvailable } = useNativeBridge();
  const { data: activities, isLoading: activitiesLoading } = useActivities(5);
  const createActivity = useCreateActivity();
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  // 오늘의 팁 데이터 가져오기
  const {
    data: todayTip,
    isLoading: tipLoading,
    error: tipError,
  } = useTodayTip();
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

  const handlePhotoGuide = () => {
    // 가게가 없으면 먼저 가게 등록을 안내
    if (!hasStores) {
      showAlert({
        title: "가게 등록 필요",
        message:
          "먼저 가게를 등록해야 합니다. 가게 등록 페이지로 이동하시겠습니까?",
        type: "info",
        confirmText: "가게 등록하기",
        cancelText: "취소",
        onConfirm: () => {
          router.push("/store/add");
        },
      });
      return;
    }

    if (isAvailable) {
      console.log("🎯 [handlePhotoGuide] 카메라 촬영 시도");
      bridge.openCamera(pathname, (result) => {
        console.log("🎯 [handlePhotoGuide] 콜백 함수 실행됨");
        console.log("🎯 [handlePhotoGuide] 결과:", result);

        if (result.success) {
          console.log("🎯 [handlePhotoGuide] 카메라 촬영 성공");
          if (result.tempFileURL) {
            console.log("🎯 [handlePhotoGuide] 파일 URL:", result.tempFileURL);
            // 촬영한 이미지 URL과 선택된 가게 정보를 쿼리 파라미터로 전달하여 메뉴 등록 페이지로 이동
            const encodedImageUrl = encodeURIComponent(result.tempFileURL);
            const selectedStoreInfo = stores[selectedStore];
            router.push(
              `/menu/add?imageUrl=${encodedImageUrl}&storeId=${selectedStoreInfo.storeId}`
            );
          } else {
            console.log("🎯 [handlePhotoGuide] 파일 URL 없음 (요청만 수락됨)");
          }
          // 활동 로그 생성
          createActivity.mutate({
            type: "photo",
            title: "음식 촬영 가이드 사용",
            description: "카메라를 사용하여 음식 사진을 촬영했습니다",
          });
        } else {
          console.error(
            "🎯 [handlePhotoGuide] 카메라 촬영 실패:",
            result.error
          );
        }
      });
    } else {
      console.log("🎯 [handlePhotoGuide] 네이티브 앱에서만 사용 가능합니다.");
    }
  };

  const handleMenuManagement = () => {
    // 활동 로그 생성
    createActivity.mutate({
      type: "menu",
      title: hasStores && stores[selectedStore]
      ? `${stores[selectedStore].storeName} 매장 메뉴 관리`
      : "메뉴 관리 페이지로 이동",
      description:
        hasStores && stores[selectedStore]
          ? `${stores[selectedStore].storeName} 매장 메뉴 관리`
          : "메뉴 관리 페이지로 이동했습니다",
    });

    // 페이지 이동
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
    // 활동 로그 생성
    createActivity.mutate({
      type: "content",
      title: "매장 관리 접속",
      description: "매장 관리 페이지로 이동했습니다",
    });

    router.push("/mypage");
  };

  return (
    <div className="bg-white">
      {/* Navigation Bar */}
      <div className="w-full bg-white border-b mb-6">
        <div className="px-4 py-2 flex items-center justify-between border-b">
          <div className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
              disabled={!hasStores}
            >
              <span className="font-medium text-2xl">
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
            <span>매장 관리</span>
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
              <span className="font-medium text-lg">가이드로 촬영</span>
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
              <span className="font-medium text-lg">메뉴 등록/수정</span>
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
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faLightbulb} className="text-orange-500" />
              <h3 className="font-medium">오늘의 팁</h3>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-[80px] h-[80px] bg-orange-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {tipLoading ? (
                  <div className="w-full h-full bg-orange-300 animate-pulse"></div>
                ) : todayTip && !tipError ? (
                  <Image
                    src={getTipImageUrl(todayTip.id)}
                    alt={todayTip.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover object-center"
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
                {tipLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-orange-300 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-orange-200 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-orange-200 rounded w-4/5 animate-pulse"></div>
                  </div>
                ) : todayTip && !tipError ? (
                  <>
                    <h4 className="font-bold mb-1">{todayTip.title}</h4>
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
      {AlertDialogComponent}
    </div>
  );
}
