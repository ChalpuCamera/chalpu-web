"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faChevronDown,
  faChevronUp,
  faCheck,
  faGripVertical,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { useMyStores } from "@/hooks/useStore";
import { useFoodsByStore, useDeleteFood } from "@/hooks/useFood";
import { Food } from "@/lib/api/types";
import Image from "next/image";

const MenuPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStoreId = searchParams.get("storeId");

  // 매장 목록 조회
  const { data: storesData, isLoading: storesLoading } = useMyStores({
    page: 0,
    size: 20,
  });

  const stores = useMemo(
    () => storesData?.content || [],
    [storesData?.content]
  );
  const hasStores = stores.length > 0;

  // 선택된 매장 상태
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const selectedStore = stores[selectedStoreIndex];

  // 매장 선택기 상태
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // 카테고리 상태
  // const [selectedCategory, setSelectedCategory] = useState("대표메뉴");

  // 음식 목록 조회
  const {
    data: foodsData,
    isLoading: foodsLoading,
    refetch: refetchFoods,
  } = useFoodsByStore(selectedStore?.storeId || 0, {
    page: 0,
    size: 50,
  });

  const foods = foodsData?.content || [];

  // 음식 삭제 훅
  const deleteFoodMutation = useDeleteFood();

  // 카테고리 목록
  // const categories = ["대표메뉴", "메인메뉴", "사이드메뉴", "음료"];

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (selectedStore?.storeId) {
        refetchFoods();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedStore?.storeId, refetchFoods]);

  // URL 파라미터로 전달된 storeId에 해당하는 매장을 기본 선택
  useEffect(() => {
    if (urlStoreId && stores.length > 0) {
      const storeIndex = stores.findIndex(
        (store) => store.storeId === parseInt(urlStoreId)
      );
      if (storeIndex !== -1) {
        setSelectedStoreIndex(storeIndex);
      }
    }
  }, [urlStoreId, stores]);

  // 매장 목록이 변경되면 선택된 매장 인덱스 조정
  useEffect(() => {
    if (stores.length > 0 && selectedStoreIndex >= stores.length) {
      setSelectedStoreIndex(0);
    }
  }, [stores.length, selectedStoreIndex]);

  const handleBack = () => {
    router.back();
  };

  const handleAddMenu = () => {
    if (!selectedStore) {
      alert("매장을 선택해주세요.");
      return;
    }
    router.push(`/menu/add?storeId=${selectedStore.storeId}`);
  };

  const handleStoreSelect = (index: number) => {
    setSelectedStoreIndex(index);
    setShowStoreSelector(false);
  };

  const handleEditMenu = (foodId: number) => {
    router.push(`/menu/${foodId}/edit`);
  };

  const handleDeleteMenu = async (foodId: number, foodName: string) => {
    const confirmDelete = window.confirm(
      `"${foodName}" 메뉴를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmDelete) return;

    try {
      await deleteFoodMutation.mutateAsync(foodId);
      alert("메뉴가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("메뉴 삭제 실패:", error);

      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (
          error.message.includes("403") ||
          error.message.includes("권한")
        ) {
          alert("메뉴를 삭제할 권한이 없습니다.");
        } else if (error.message.includes("404")) {
          alert("메뉴를 찾을 수 없습니다.");
        } else {
          alert(`메뉴 삭제에 실패했습니다: ${error.message}`);
        }
      } else {
        alert("메뉴 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 가격 포맷팅 함수
  const formatPrice = (price: number) => {
    return price.toLocaleString() + "원";
  };

  // 음식 이미지 URL 가져오기
  const getFoodImageUrl = (food: Food) => {
    // 업로드된 사진이 있으면 대표 사진 우선, 없으면 첫 번째 사진 사용
    if (food.photos && food.photos.length > 0) {
      const featuredPhoto = food.photos.find((photo) => photo.isFeatured);
      if (featuredPhoto) {
        return featuredPhoto.imageUrl;
      }
      return food.photos[0].imageUrl;
    }

    // 없으면 null 반환 (아이콘 표시)
    return null;
  };

  if (storesLoading) {
    return (
      <div className="w-[375px] min-h-[762px] bg-white relative pb-16">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!hasStores) {
    return (
      <div className="w-[375px] min-h-[762px] bg-white relative pb-16">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-4">등록된 매장이 없습니다.</p>
            <Button onClick={() => router.push("/store/add")}>
              첫 번째 매장 등록하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Nav Bar */}
      <div className="w-full bg-white border-b mb-6">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="cursor-pointer">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-xl text-gray-600"
            />
          </button>
          <h1 className="text-lg font-medium">메뉴 관리</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleAddMenu}
          >
            <FontAwesomeIcon icon={faPlus} className="text-gray-600 text-lg" />
          </Button>
        </div>
      </div>

      {/* Store Selector */}
      <div className="mb-6">
        <div className="px-4">
          <Button
            variant="outline"
            className="rounded-lg w-full flex items-center justify-between cursor-pointer"
            onClick={() => setShowStoreSelector(!showStoreSelector)}
          >
            <span className="font-medium">
              {selectedStore?.storeName || "매장 선택"}
            </span>
            <FontAwesomeIcon
              icon={showStoreSelector ? faChevronUp : faChevronDown}
              className="text-base"
            />
          </Button>

          {showStoreSelector && (
            <div className="absolute left-4 right-4 bg-white border rounded-lg shadow-lg mt-1 z-10">
              {stores.map((store, index) => (
                <button
                  key={store.storeId}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg cursor-pointer"
                  onClick={() => handleStoreSelect(index)}
                >
                  <span
                    className={
                      index === selectedStoreIndex
                        ? "text-blue-600 font-medium"
                        : ""
                    }
                  >
                    {store.storeName}
                  </span>
                  {index === selectedStoreIndex && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-blue-600 float-right mt-1"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {/* <div className="mb-4">
        <ScrollArea className="w-full">
          <div className="flex px-4 gap-3 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`rounded-lg whitespace-nowrap ${
                  selectedCategory === category ? "bg-blue-600" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div> */}

      {/* Menu List */}
      <div className="px-4 space-y-4">
        {foodsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3 flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-gray-500 mb-4">등록된 메뉴가 없습니다.</p>
            <Button onClick={handleAddMenu}>첫 번째 메뉴 등록하기</Button>
          </div>
        ) : (
          foods.map((food: Food) => (
            <Card key={food.foodItemId} className="p-3 flex items-center gap-3">
              <FontAwesomeIcon
                icon={faGripVertical}
                className="text-gray-400"
              />
              {getFoodImageUrl(food) ? (
                <Image
                  src={getFoodImageUrl(food)!}
                  alt={food.foodName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faImage}
                    className="text-gray-400 text-2xl"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">{food.foodName}</h3>
                  <span className="text-base">{formatPrice(food.price)}</span>
                </div>
                <p className="text-base text-gray-600 line-clamp-2 mb-2">
                  {food.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleEditMenu(food.foodItemId)}
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-red-500 border-red-500"
                    onClick={() =>
                      handleDeleteMenu(food.foodItemId, food.foodName)
                    }
                    disabled={deleteFoodMutation.isPending}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MenuPage;
