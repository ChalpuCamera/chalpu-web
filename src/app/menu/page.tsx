"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faChevronDown,
  faChevronUp,
  faCheck,
  // faGripVertical,
  faImage,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useMyStores } from "@/hooks/useStore";
import { useFoodsByStore, useDeleteFood } from "@/hooks/useFood";
import { Food } from "@/lib/api/types";
import Image from "next/image";
import NavBar from "@/components/ui/navbar";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import PhotoDownload from "@/components/PhotoDownload";
import { usePhotosByFood } from "@/hooks/usePhoto";

interface MenuItemCardProps {
  food: Food;
  onDelete: (foodId: number, foodName: string) => void;
  onEdit: (foodId: number) => void;
  onDownload: (food: Food) => void;
  isDeleting: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  food,
  onDelete,
  onEdit,
  onDownload,
  isDeleting,
}) => {
  const { data: photoData } = usePhotosByFood(food.foodItemId, {
    page: 0,
    size: 1,
  });

  const originalPhoto = photoData?.result?.content?.[0];
  const imageUrl = food.thumbnailUrl && originalPhoto
    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${food.thumbnailUrl}?s=80x80&t=crop&q=70`
    : null;

  const formatPrice = (price: number) => {
    return price.toLocaleString() + "원";
  };

  return (
    <Card className="p-3 flex items-center gap-4">
      {/* <FontAwesomeIcon
        icon={faGripVertical}
        className="text-gray-400"
      /> */}
      {imageUrl ? (
        <Image
          src={imageUrl}
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
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            {food.foodName}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-red-500 border-red-500"
            onClick={() => onDelete(food.foodItemId, food.foodName)}
            disabled={isDeleting}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-1" />
            삭제
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-gray-800 mb-1">
            {formatPrice(food.price)}
          </p>
        </div>
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg flex-1"
            onClick={() => onEdit(food.foodItemId)}
          >
            <FontAwesomeIcon icon={faEdit} className="mr-1" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg flex-1"
            onClick={() => onDownload(food)}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-1" />
            다운로드
          </Button>
        </div>
      </div>
    </Card>
  );
};

const MenuPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStoreId = searchParams.get("storeId");
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  // 다운로드 다이얼로그 상태
  const [selectedFoodForDownload, setSelectedFoodForDownload] =
    useState<Food | null>(null);

  // 매장 목록 조회
  const { data: storesData } = useMyStores({
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

  // 등록된 매장이 없을 때 매장 생성 페이지로 이동하는 함수
  const handleCreateStore = () => {
    router.push("/store/add?returnTo=/menu");
  };

  const handleAddMenu = () => {
    if (!selectedStore) {
      showAlert({
        title: "매장 선택 필요",
        message: "매장을 선택해주세요.",
        type: "warning",
      });
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

  const handleDownloadMenu = (food: Food) => {
    setSelectedFoodForDownload(food);
  };

  const handleCloseDownload = () => {
    setSelectedFoodForDownload(null);
  };

  const handleDeleteMenu = async (foodId: number, foodName: string) => {
    showAlert({
      title: "메뉴 삭제 확인",
      message: `"${foodName}" 메뉴를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await deleteFoodMutation.mutateAsync(foodId);
          showAlert({
            title: "삭제 완료",
            message: "메뉴가 성공적으로 삭제되었습니다.",
            type: "success",
          });
        } catch (error) {
          console.error("메뉴 삭제 실패:", error);

          if (error instanceof Error) {
            if (
              error.message.includes("401") ||
              error.message.includes("인증")
            ) {
              showAlert({
                title: "인증 오류",
                message: "인증이 만료되었습니다. 다시 로그인해주세요.",
                type: "error",
              });
            } else if (
              error.message.includes("403") ||
              error.message.includes("권한")
            ) {
              showAlert({
                title: "권한 오류",
                message: "메뉴를 삭제할 권한이 없습니다.",
                type: "error",
              });
            } else if (error.message.includes("404")) {
              showAlert({
                title: "메뉴 없음",
                message: "메뉴를 찾을 수 없습니다.",
                type: "error",
              });
            } else {
              showAlert({
                title: "삭제 실패",
                message: `메뉴 삭제에 실패했습니다: ${error.message}`,
                type: "error",
              });
            }
          } else {
            showAlert({
              title: "삭제 실패",
              message: "메뉴 삭제에 실패했습니다. 다시 시도해주세요.",
              type: "error",
            });
          }
        }
      },
      onCancel: () => {},
    });
  };


  // 매장이 없는 경우 안내 화면 표시
  if (storesData && !hasStores) {
    return (
      <div className="bg-white">
        <NavBar title="메뉴 관리" onBack={() => router.push("/")} />

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faPlus}
              className="text-6xl text-gray-300 mb-6"
            />
            <h2 className="text-xl font-semibold text-gray-700 mb-3">
              등록된 매장이 없습니다
            </h2>
            <p className="text-gray-500 mb-8">
              메뉴를 관리하려면 먼저 매장을 생성해주세요.
            </p>
            <Button
              onClick={handleCreateStore}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
            >
              매장 생성하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <NavBar
        title="메뉴판"
        onBack={() => router.push("/")}
        rightElement={
          hasStores ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleAddMenu}
            >
              <FontAwesomeIcon
                icon={faPlus}
                className="text-gray-600 text-lg"
              />
            </Button>
          ) : undefined
        }
      />

      {/* Store Selector */}
      <div className="mb-6 px-4">
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
            <MenuItemCard
              key={food.foodItemId}
              food={food}
              onDelete={handleDeleteMenu}
              onEdit={handleEditMenu}
              onDownload={handleDownloadMenu}
              isDeleting={deleteFoodMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Photo Download Dialog */}
      {selectedFoodForDownload && (
        <PhotoDownload
          foodName={selectedFoodForDownload.foodName}
          thumbnailUrl={selectedFoodForDownload.thumbnailUrl}
          foodItemId={selectedFoodForDownload.foodItemId}
          onClose={handleCloseDownload}
        />
      )}

      {AlertDialogComponent}
    </div>
  );
};

export default MenuPage;
