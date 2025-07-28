"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
import { CreateStoreRequest, UpdateStoreRequest, Store } from "@/lib/api/types";
import { openAddressSearch } from "@/utils/addressSearch";
import { useAlertDialog } from "@/components/ui/alert-dialog";

interface StoreFormProps {
  mode: "create" | "edit";
  initialData?: Store;
  onSubmit: (data: CreateStoreRequest | UpdateStoreRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const StoreForm: React.FC<StoreFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { showAlert } = useAlertDialog();
  const isEditMode = mode === "edit";

  const [formData, setFormData] = useState<
    CreateStoreRequest | UpdateStoreRequest
  >({
    storeName: "",
    businessType: "",
    address: "",
    phone: "",
    businessRegistrationNumber: "",
  });

  const [detailAddress, setDetailAddress] = useState("");
  // const [isWeekend, setIsWeekend] = useState(false);
  // const [startTime, setStartTime] = useState("09:00");
  // const [endTime, setEndTime] = useState("22:00");
  const [hasChanges, setHasChanges] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        storeName: initialData.storeName || "",
        businessType: initialData.businessType || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        businessRegistrationNumber:
          initialData.businessRegistrationNumber || "",
      });
    }
  }, [isEditMode, initialData]);

  // 변경사항 감지 (수정 모드에서만)
  useEffect(() => {
    if (isEditMode && initialData) {
      const hasAnyChanges =
        (formData.storeName || "") !== (initialData.storeName || "") ||
        (formData.businessType || "") !== (initialData.businessType || "") ||
        (formData.address || "") !== (initialData.address || "") ||
        (formData.phone || "") !== (initialData.phone || "") ||
        (formData.businessRegistrationNumber || "") !==
          (initialData.businessRegistrationNumber || "");

      setHasChanges(hasAnyChanges);
    } else {
      // 등록 모드에서는 항상 변경사항이 있다고 간주
      setHasChanges(true);
    }
  }, [formData, initialData, isEditMode]);

  const handleCancel = () => {
    if (isEditMode && hasChanges) {
      showAlert({
        title: "변경사항 확인",
        message: "저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?",
        type: "warning",
        confirmText: "취소",
        cancelText: "계속 작성",
        onConfirm: onCancel,
        onCancel: () => {},
      });
      return;
    }
    onCancel();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof (CreateStoreRequest | UpdateStoreRequest)
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleAddressSearch = async () => {
    try {
      await openAddressSearch(
        (address: string, zonecode: string) => {
          console.log("선택된 주소:", address, "우편번호:", zonecode);
          setFormData((prev) => ({
            ...prev,
            address: address,
          }));

          // 상세 주소 입력 필드에 포커스
          const detailAddressInput = document.querySelector(
            'input[placeholder="상세 주소를 입력해주세요"]'
          ) as HTMLInputElement;
          if (detailAddressInput) {
            setTimeout(() => {
              detailAddressInput.focus();
            }, 100);
          }
        },
        (error: Error) => {
          console.error("주소 검색 오류:", error);
          showAlert({
            title: "주소 검색 오류",
            message: "주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.",
            type: "error",
          });
        }
      );
    } catch (error) {
      console.error("주소 검색 실행 오류:", error);
      showAlert({
        title: "주소 검색 오류",
        message: "주소 검색을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.storeName?.trim()) {
      showAlert({
        title: "입력 오류",
        message: "매장명을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    // 기본 필수 필드만 검증 (매장명은 위에서 이미 검증됨)
    // 나머지 필드들은 선택사항으로 처리

    try {
      const fullAddress = detailAddress
        ? `${formData.address} ${detailAddress}`
        : formData.address;

      const submitData = {
        storeName: formData.storeName?.trim() || "",
        address: fullAddress || undefined,
        phone: formData.phone?.trim() || undefined,
        businessRegistrationNumber:
          formData.businessRegistrationNumber?.trim() || undefined,
        businessType: formData.businessType?.trim() || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      // 에러 처리는 부모 컴포넌트에서 담당
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          매장명 <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          placeholder="매장명을 입력해주세요"
          value={formData.storeName || ""}
          onChange={(e) => handleInputChange(e, "storeName")}
          className="w-full border-gray-200 focus:border-blue-500"
          required
        />
      </div>

      {/* Store Address */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">매장 주소</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="주소 검색을 눌러주세요"
            value={formData.address || ""}
            onChange={(e) => handleInputChange(e, "address")}
            className="w-full bg-gray-50"
            readOnly
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-lg whitespace-nowrap px-4"
            onClick={handleAddressSearch}
          >
            주소 검색
          </Button>
        </div>
        <Input
          type="text"
          placeholder="상세 주소를 입력해주세요"
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value)}
          className="w-full border-gray-200 focus:border-blue-500"
        />
      </div>

      {/* Phone Number */}
      {/* <div className="space-y-2">
        <Label className="text-sm font-medium">전화번호</Label>
        <Input
          type="tel"
          placeholder="000-0000-0000"
          value={formData.phone || ""}
          onChange={(e) => handleInputChange(e, "phone")}
          className="w-full border-gray-200 focus:border-blue-500"
        />
      </div> */}

      {/* Business Registration Number */}
      {/* <div className="space-y-2">
        <Label className="text-sm font-medium">사업자 번호</Label>
        <Input
          type="text"
          placeholder="000-00-00000"
          value={formData.businessRegistrationNumber}
          onChange={(e) => handleInputChange(e, "businessRegistrationNumber")}
          className="w-full border-gray-200 focus:border-blue-500"
        />
      </div> */}

      {/* Business Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">업종</Label>
        <Input
          type="text"
          placeholder="예: 한식, 중식, 양식, 카페 등"
          value={formData.businessType || ""}
          onChange={(e) => handleInputChange(e, "businessType")}
          className="w-full border-gray-200 focus:border-blue-500"
        />
      </div>

      {/* Business Hours */}
      {/* <div className="space-y-4">
        <Label className="text-sm font-medium">영업시간</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">주말 영업시간 별도 설정</span>
          <Switch checked={isWeekend} onCheckedChange={setIsWeekend} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">시작 시간</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border-gray-200 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">종료 시간</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>
      </div> */}

      {/* Bottom Buttons */}
      <div className="flex gap-4 py-8">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-lg"
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          disabled={isLoading || (isEditMode && !hasChanges)}
        >
          {isLoading
            ? isEditMode
              ? "수정 중..."
              : "등록 중..."
            : isEditMode
            ? "수정"
            : "등록"}
        </Button>
      </div>
    </form>
  );
};

export default StoreForm;
