"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useUpdateStore } from "@/hooks/useStore";
import { UpdateStoreRequest } from "@/lib/api/types";
import { openAddressSearch } from "@/utils/addressSearch";

interface StoreEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  field: keyof UpdateStoreRequest;
  currentValue: string;
  fieldLabel: string;
  fieldType?: "text" | "tel" | "address";
  placeholder?: string;
}

const StoreEditDialog: React.FC<StoreEditDialogProps> = ({
  isOpen,
  onClose,
  storeId,
  field,
  currentValue,
  fieldLabel,
  fieldType = "text",
  placeholder,
}) => {
  const updateStoreMutation = useUpdateStore();
  const [value, setValue] = useState(currentValue);
  const [detailAddress, setDetailAddress] = useState("");

  // 다이얼로그가 열릴 때마다 현재 값으로 초기화
  React.useEffect(() => {
    if (isOpen) {
      setValue(currentValue);
      setDetailAddress("");
    }
  }, [isOpen, currentValue]);

  const handleAddressSearch = async () => {
    try {
      await openAddressSearch(
        (address: string, zonecode: string) => {
          console.log("선택된 주소:", address, "우편번호:", zonecode);
          setValue(address);

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
          alert("주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      );
    } catch (error) {
      console.error("주소 검색 실행 오류:", error);
      alert("주소 검색을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) {
      alert(`${fieldLabel}을(를) 입력해주세요.`);
      return;
    }

    try {
      const submitValue =
        fieldType === "address" && detailAddress
          ? `${value} ${detailAddress}`
          : value;

      await updateStoreMutation.mutateAsync({
        id: storeId,
        data: { [field]: submitValue },
      });

      alert(`${fieldLabel}이(가) 성공적으로 수정되었습니다.`);
      onClose();
    } catch (error) {
      console.error(`${fieldLabel} 수정 실패:`, error);

      // 에러 메시지에 따라 다른 알림 표시
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (
          error.message.includes("403") ||
          error.message.includes("권한")
        ) {
          alert("매장을 수정할 권한이 없습니다.");
        } else if (error.message.includes("404")) {
          alert("매장을 찾을 수 없습니다.");
        } else if (
          error.message.includes("400") ||
          error.message.includes("잘못된")
        ) {
          alert("입력 정보를 확인해주세요.");
        } else {
          alert(`${fieldLabel} 수정에 실패했습니다: ${error.message}`);
        }
      } else {
        alert(`${fieldLabel} 수정에 실패했습니다. 다시 시도해주세요.`);
      }
    }
  };

  const handleCancel = () => {
    setValue(currentValue);
    setDetailAddress("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{fieldLabel} 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fieldType === "address" ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {fieldLabel} <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="주소 검색을 눌러주세요"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-gray-50"
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg whitespace-nowrap px-3 py-2 text-sm"
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
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {fieldLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                type={fieldType}
                placeholder={placeholder || `${fieldLabel}을(를) 입력해주세요`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border-gray-200 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 px-3 py-2"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-1 text-sm" />
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateStoreMutation.isPending || !value.trim()}
            className="flex-1 px-3 py-2"
          >
            <FontAwesomeIcon icon={faSave} className="mr-1 text-sm" />
            {updateStoreMutation.isPending ? "수정 중..." : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreEditDialog;
