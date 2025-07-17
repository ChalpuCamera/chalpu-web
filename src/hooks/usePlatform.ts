"use client";

import { useEffect, useState } from "react";

export type Platform = "android" | "ios" | "desktop" | "unknown";

export interface PlatformInfo {
  platform: Platform;
  isWebView: boolean;
  isMobile: boolean;
  userAgent: string;
  osVersion?: string;
}

export const usePlatform = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: "unknown",
    isWebView: false,
    isMobile: false,
    userAgent: "",
    osVersion: undefined,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;

    // 플랫폼 감지
    let platform: Platform = "unknown";
    let osVersion: string | undefined;

    if (/android/i.test(userAgent)) {
      platform = "android";
      const androidMatch = userAgent.match(/android\s([0-9\.]*)/i);
      osVersion = androidMatch ? androidMatch[1] : undefined;
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      platform = "ios";
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      osVersion = iosMatch
        ? `${iosMatch[1]}.${iosMatch[2]}${iosMatch[3] ? `.${iosMatch[3]}` : ""}`
        : undefined;
    } else {
      platform = "desktop";
    }

    // 모바일 환경 감지
    const isMobile = platform === "android" || platform === "ios";

    // 웹뷰 환경 감지
    let isWebView = false;

    if (platform === "android") {
      // 안드로이드 웹뷰 감지
      isWebView =
        /wv|WebView/.test(userAgent) ||
        !/Chrome/.test(userAgent) ||
        /Version\/\d+\.\d+/.test(userAgent);
    } else if (platform === "ios") {
      // iOS 웹뷰 감지 (WKWebView, UIWebView)
      isWebView =
        !/Safari/.test(userAgent) ||
        /CriOS|FxiOS|EdgiOS/.test(userAgent) ||
        !(window as Window & { safari?: unknown }).safari;
    }

    // 커스텀 앱에서 설정한 User-Agent 확인
    if (userAgent.includes("Chalpu")) {
      isWebView = true;
    }

    setPlatformInfo({
      platform,
      isWebView,
      isMobile,
      userAgent,
      osVersion,
    });
  }, []);

  return platformInfo;
};

// 개별 플랫폼 확인을 위한 유틸리티 훅들
export const useIsAndroid = (): boolean => {
  const { platform } = usePlatform();
  return platform === "android";
};

export const useIsIOS = (): boolean => {
  const { platform } = usePlatform();
  return platform === "ios";
};

export const useIsMobile = (): boolean => {
  const { isMobile } = usePlatform();
  return isMobile;
};

export const useIsWebView = (): boolean => {
  const { isWebView } = usePlatform();
  return isWebView;
};
