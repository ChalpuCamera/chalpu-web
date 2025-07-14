// 카카오(Daum) 우편번호 서비스 타입 정의
declare global {
  interface Window {
    daum: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcode;
    };
  }
}

export interface DaumPostcodeOptions {
  oncomplete?: (data: DaumPostcodeData) => void;
  onclose?: (state: DaumPostcodeCloseState) => void;
  onresize?: (size: DaumPostcodeSize) => void;
  width?: number | string;
  height?: number | string;
  animation?: boolean;
  focusInput?: boolean;
  autoMapping?: boolean;
  shorthand?: boolean;
  pleaseReadGuide?: number;
  pleaseReadGuideTimer?: number;
  maxSuggestItems?: number;
  showMoreHName?: boolean;
  hideMapBtn?: boolean;
  hideEngBtn?: boolean;
  alwaysShowEngAddr?: boolean;
  zonecodeOnly?: boolean;
  theme?: DaumPostcodeTheme;
}

export interface DaumPostcodeData {
  zonecode: string; // 우편번호 (5자리)
  address: string; // 기본 주소
  addressEnglish: string; // 기본 영문 주소
  addressType: "R" | "J"; // 도로명(R) 또는 지번(J)
  userSelectedType: "R" | "J"; // 사용자가 선택한 주소 타입
  noSelected: "Y" | "N"; // 검색된 주소 중 선택하지 않고 사용한 주소인지 여부
  userLanguageType: "K" | "E"; // 사용자가 선택한 언어 타입
  roadAddress: string; // 도로명 주소
  roadAddressEnglish: string; // 도로명 영문 주소
  jibunAddress: string; // 지번 주소
  jibunAddressEnglish: string; // 지번 영문 주소
  autoRoadAddress: string; // 법정동명이 있을 경우 법정동, 아니면 동면읍명
  autoRoadAddressEnglish: string; // 자동완성 도로명 영문 주소
  autoJibunAddress: string; // 자동완성 지번 주소
  autoJibunAddressEnglish: string; // 자동완성 지번 영문 주소
  buildingCode: string; // 건물관리번호
  buildingName: string; // 건물명
  apartment: "Y" | "N"; // 공동주택 여부
  sido: string; // 시도명
  sidoEnglish: string; // 시도명 영문
  sigungu: string; // 시군구명
  sigunguEnglish: string; // 시군구명 영문
  sigunguCode: string; // 시군구 코드
  roadnameCode: string; // 도로명 코드
  roadname: string; // 도로명
  roadnameEnglish: string; // 도로명 영문
  bcode: string; // 법정동/법정리 코드
  bname: string; // 법정동/법정리명
  bnameEnglish: string; // 법정동/법정리명 영문
  bname1: string; // 법정리의 읍면명
  bname1English: string; // 법정리의 읍면명 영문
  bname2: string; // 법정동/법정리명
  bname2English: string; // 법정동/법정리명 영문
  hname: string; // 행정동명
  query: string; // 검색어
}

export interface DaumPostcodeCloseState {
  state: "FORCE_CLOSE" | "COMPLETE_CLOSE";
}

export interface DaumPostcodeSize {
  width: number;
  height: number;
}

export interface DaumPostcodeTheme {
  bgColor?: string; // 바탕 배경색
  searchBgColor?: string; // 검색창 배경색
  contentBgColor?: string; // 본문 배경색(검색결과, 결과없음, 첫화면, 검색서제스트)
  pageBgColor?: string; // 페이지 배경색
  textColor?: string; // 기본 글자색
  queryTextColor?: string; // 검색창 글자색
  postcodeTextColor?: string; // 우편번호 글자색
  emphTextColor?: string; // 강조 글자색
  outlineColor?: string; // 테두리
}

export interface DaumPostcode {
  open: (options?: {
    left?: number;
    top?: number;
    autoClose?: boolean;
  }) => void;
  embed: (
    element: HTMLElement | null,
    options?: { autoClose?: boolean }
  ) => void;
}

export {};
