"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useCreateStore } from "@/hooks/useStore";
import { CreateStoreRequest } from "@/lib/api/types";
import { openAddressSearch } from "@/utils/addressSearch";

const AddStorePage: React.FC = () => {
  const router = useRouter();
  const createStoreMutation = useCreateStore();

  const [formData, setFormData] = useState<CreateStoreRequest>({
    storeName: "",
    businessType: "",
    address: "",
    phone: "",
    businessRegistrationNumber: "",
  });

  const [detailAddress, setDetailAddress] = useState("");
  const [isWeekend, setIsWeekend] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    router.push("/mypage");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof CreateStoreRequest
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
          // 주소 검색 완료 시 호출되는 콜백
          console.log("선택된 주소:", address, "우편번호:", zonecode);
          setFormData((prev) => ({
            ...prev,
            address: address,
          }));

          // 상세 주소 입력 필드에 포커스 (선택사항)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 최소한 매장명은 입력되어야 함
    if (!formData.storeName?.trim()) {
      alert("매장명을 입력해주세요.");
      return;
    }

    try {
      const fullAddress = detailAddress
        ? `${formData.address} ${detailAddress}`
        : formData.address;

      const submitData: CreateStoreRequest = {
        storeName: formData.storeName?.trim() || "",
        address: fullAddress || undefined,
        phone: formData.phone?.trim() || undefined,
        businessRegistrationNumber:
          formData.businessRegistrationNumber?.trim() || undefined,
        businessType: formData.businessType?.trim() || undefined,
      };

      await createStoreMutation.mutateAsync(submitData);
      alert("매장이 성공적으로 등록되었습니다.");

      // 캐시 무효화가 완료될 때까지 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/mypage");
    } catch (error) {
      console.error("매장 등록 실패:", error);

      // 에러 메시지에 따라 다른 알림 표시
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("인증")) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (
          error.message.includes("400") ||
          error.message.includes("잘못된")
        ) {
          alert("입력 정보를 확인해주세요.");
        } else if (
          error.message.includes("409") ||
          error.message.includes("중복")
        ) {
          alert("이미 등록된 매장입니다.");
        } else {
          alert(`매장 등록에 실패했습니다: ${error.message}`);
        }
      } else {
        alert("매장 등록에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

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
          <h1 className="text-lg font-medium">매장 등록</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              매장명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="매장명을 입력해주세요"
              value={formData.storeName}
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
                value={formData.address}
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
          <div className="space-y-2">
            <Label className="text-sm font-medium">전화번호</Label>
            <Input
              type="tel"
              placeholder="000-0000-0000"
              value={formData.phone}
              onChange={(e) => handleInputChange(e, "phone")}
              className="w-full border-gray-200 focus:border-blue-500"
            />
          </div>

          {/* Business Registration Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">사업자 번호</Label>
            <Input
              type="text"
              placeholder="000-00-00000"
              value={formData.businessRegistrationNumber}
              onChange={(e) =>
                handleInputChange(e, "businessRegistrationNumber")
              }
              className="w-full border-gray-200 focus:border-blue-500"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">업종</Label>
            <Input
              type="text"
              placeholder="예: 한식, 중식, 양식, 카페 등"
              value={formData.businessType}
              onChange={(e) => handleInputChange(e, "businessType")}
              className="w-full border-gray-200 focus:border-blue-500"
            />
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">영업시간</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                주말 영업시간 별도 설정
              </span>
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
          </div>

          {/* Bottom Buttons */}
          <div className="flex gap-4 pt-8 pb-8">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 rounded-lg"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              disabled={createStoreMutation.isPending}
            >
              {createStoreMutation.isPending ? "등록 중..." : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStorePage;
