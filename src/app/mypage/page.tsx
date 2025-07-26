"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faStore,
  faEdit,
  faChevronRight,
  faMapMarkerAlt,
  faSignOutAlt,
  faTrash,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useMyStores, useDeleteStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import StoreEditDialog from "@/components/StoreEditDialog";
import { UpdateStoreRequest } from "@/lib/api/types";
import NavBar from "@/components/ui/navbar";
import { useAlertDialog } from "@/components/ui/alert-dialog";

const MyPage: React.FC = () => {
  const router = useRouter();
  const { showAlert, AlertDialogComponent } = useAlertDialog();

  // 인증 상태 관리
  const { logout } = useAuth();

  // 매장 관리 훅들
  const {
    data: storesData,
    isLoading: storesLoading,
    refetch,
  } = useMyStores({
    page: 0,
    size: 20,
  });
  const deleteStoreMutation = useDeleteStore();

  const stores = storesData?.content || [];
  const hasStores = stores.length > 0;

  // 선택된 매장 상태 (기본값: 첫 번째 매장)
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const selectedStore = stores[selectedStoreIndex];

  // 다이얼로그 상태
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    field: keyof UpdateStoreRequest;
    fieldLabel: string;
    fieldType: "text" | "tel" | "address";
    placeholder?: string;
  }>({
    isOpen: false,
    field: "storeName",
    fieldLabel: "매장명",
    fieldType: "text",
  });

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  // 매장 목록이 변경되면 선택된 매장 인덱스 조정
  useEffect(() => {
    if (stores.length > 0 && selectedStoreIndex >= stores.length) {
      setSelectedStoreIndex(0);
    }
  }, [stores.length, selectedStoreIndex]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleStoreEdit = (storeId: number) => {
    // 매장 수정 페이지로 이동
    router.push(`/store/${storeId}/edit`);
  };

  const handleAddStore = () => {
    // 매장 추가 페이지로 이동
    router.push("/store/add");
  };

  const handleStoreSelect = (index: number) => {
    setSelectedStoreIndex(index);
  };

  const handleFieldEdit = (
    field: keyof UpdateStoreRequest,
    fieldLabel: string,
    fieldType: "text" | "tel" | "address" = "text",
    placeholder?: string
  ) => {
    setEditDialog({
      isOpen: true,
      field,
      fieldLabel,
      fieldType,
      placeholder,
    });
  };

  const handleDeleteStore = async (storeId: number, storeName: string) => {
    showAlert({
      title: "매장 삭제 확인",
      message: `"${storeName}" 매장을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await deleteStoreMutation.mutateAsync(storeId);

          // 매장 목록 새로고침 (메뉴 페이지와 동일한 방식)
          await refetch();

          // 삭제된 매장이 선택된 매장이었다면 첫 번째 매장으로 선택 변경
          if (selectedStoreIndex >= stores.length - 1) {
            setSelectedStoreIndex(0);
          }

          showAlert({
            title: "삭제 완료",
            message: "매장이 성공적으로 삭제되었습니다.",
            type: "success",
          });
        } catch (error) {
          console.error("매장 삭제 실패:", error);

          // 에러 메시지에 따라 다른 알림 표시
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
                message: "매장을 삭제할 권한이 없습니다.",
                type: "error",
              });
            } else if (error.message.includes("404")) {
              showAlert({
                title: "매장 없음",
                message: "매장을 찾을 수 없습니다.",
                type: "error",
              });
            } else {
              showAlert({
                title: "삭제 실패",
                message: `매장 삭제에 실패했습니다: ${error.message}`,
                type: "error",
              });
            }
          } else {
            showAlert({
              title: "삭제 실패",
              message: "매장 삭제에 실패했습니다. 다시 시도해주세요.",
              type: "error",
            });
          }
        }
      },
      onCancel: () => {},
    });
  };

  return (
    <div className="bg-white">
      <NavBar title="매장 관리" onBack={() => router.push("/")} />
      {/* Main Content */}
      <div className="space-y-12 px-4">
        {/* Store Management Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              매장 정보 관리
            </h3>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={handleAddStore}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              매장 추가
            </Button>
          </div>

          {/* 매장 목록 */}
          <Card className="p-0 overflow-hidden mb-6">
            <div className="p-4 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-700">
                  현재 관리중인 매장
                </h4>
                <span className="text-sm text-blue-600">
                  {storesLoading ? "로딩..." : `총 ${stores.length}개`}
                </span>
              </div>
            </div>

            {storesLoading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !hasStores ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">등록된 매장이 없습니다.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddStore}
                >
                  첫 번째 매장 등록하기
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stores.map((store, index) => (
                  <div
                    key={store.storeId}
                    className={`p-4 cursor-pointer transition-colors ${
                      index === selectedStoreIndex
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleStoreSelect(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{store.storeName}</h5>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStoreEdit(store.storeId);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="매장 수정"
                        >
                          <FontAwesomeIcon
                            icon={faEdit}
                            className="text-base"
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStore(store.storeId, store.storeName);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="매장 삭제"
                          disabled={deleteStoreMutation.isPending}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-base"
                          />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {store.address || "주소 미입력"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{store.businessType || "업종 미입력"}</span>
                      <span>{store.phone || "전화번호 미입력"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 선택된 매장 상세 정보 */}
          {selectedStore && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h4 className="font-medium text-blue-700">
                  {selectedStore.storeName} 상세 정보
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    handleFieldEdit(
                      "storeName",
                      "매장명",
                      "text",
                      "매장명을 입력해주세요"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faStore}
                        className="text-blue-600"
                      />
                    </div>
                    <div>
                      <p className="font-medium">매장명</p>
                      <p className="text-sm text-gray-500">
                        {selectedStore.storeName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-gray-400 text-sm"
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-gray-400 text-sm"
                    />
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    handleFieldEdit("address", "매장 주소", "address")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="text-green-600"
                      />
                    </div>
                    <div>
                      <p className="font-medium">매장 주소</p>
                      <p className="text-sm text-gray-500">
                        {selectedStore.address || "주소 미입력"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-gray-400 text-sm"
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-gray-400 text-sm"
                    />
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    handleFieldEdit(
                      "businessType",
                      "업종",
                      "text",
                      "예: 한식, 중식, 양식, 카페 등"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faStore}
                        className="text-purple-600"
                      />
                    </div>
                    <div>
                      <p className="font-medium">업종</p>
                      <p className="text-sm text-gray-500">
                        {selectedStore.businessType || "업종 미입력"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-gray-400 text-sm"
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-gray-400 text-sm"
                    />
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    handleFieldEdit("phone", "전화번호", "tel", "000-0000-0000")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-teal-600"
                      />
                    </div>
                    <div>
                      <p className="font-medium">전화번호</p>
                      <p className="text-sm text-gray-500">
                        {selectedStore.phone || "전화번호 미입력"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faEdit}
                      className="text-gray-400 text-sm"
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-gray-400 text-sm"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Account Settings Section */}
        {/* <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 text-gray-800">계정 설정</h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faKey} className="text-purple-600" />
                  </div>
                  <p className="font-medium">비밀번호 변경</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-400 text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faBell}
                      className="text-yellow-600"
                    />
                  </div>
                  <div>
                    <p className="font-medium">알림 설정</p>
                    <p className="text-sm text-gray-500">
                      푸시 알림, 이메일 알림
                    </p>
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-400 text-sm"
                />
              </div>
            </div>
          </Card>
        </div> */}

        {/* Additional Settings */}
        {/* <div className="mb-8">
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faQuestionCircle}
                      className="text-gray-600"
                    />
                  </div>
                  <p className="font-medium">고객 지원</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-400 text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faFileAlt}
                      className="text-gray-600"
                    />
                  </div>
                  <p className="font-medium">이용약관</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-400 text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faShieldAlt}
                      className="text-gray-600"
                    />
                  </div>
                  <p className="font-medium">개인정보처리방침</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-gray-400 text-sm"
                />
              </div>
            </div>
          </Card>
        </div> */}

        {/* Logout Button */}
        {/* <div className="mb-8">
          <Button
            variant="outline"
            className="w-full py-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            로그아웃
          </Button>
        </div> */}
      </div>

      {/* 매장 정보 수정 다이얼로그 */}
      {selectedStore && (
        <StoreEditDialog
          isOpen={editDialog.isOpen}
          onClose={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
          storeId={selectedStore.storeId}
          field={editDialog.field}
          currentValue={
            editDialog.field === "storeName"
              ? selectedStore.storeName
              : editDialog.field === "address"
              ? selectedStore.address || ""
              : editDialog.field === "businessType"
              ? selectedStore.businessType || ""
              : editDialog.field === "phone"
              ? selectedStore.phone || ""
              : ""
          }
          fieldLabel={editDialog.fieldLabel}
          fieldType={editDialog.fieldType}
          placeholder={editDialog.placeholder}
        />
      )}
      {AlertDialogComponent}
    </div>
  );
};

export default MyPage;
