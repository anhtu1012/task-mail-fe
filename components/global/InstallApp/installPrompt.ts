"use client";

/**
 * Trạng thái "cài ứng dụng" dùng chung cho cả app.
 *
 * Chrome/Edge/Samsung Internet phát `beforeinstallprompt` MỘT lần, rất sớm, và
 * chỉ trong lúc đó mới giữ lại được để gọi `prompt()` về sau. Nên nó phải được
 * bắt ở gốc (PwaSetup, mount trong root layout), không phải trong banner — lúc
 * banner kịp mount thì sự kiện đã trôi qua.
 *
 * Safari trên iPhone không có sự kiện này, cũng không có nút cài tự động: chỉ
 * có "Chia sẻ → Thêm vào MH chính". Banner hiện hướng dẫn cho trường hợp đó.
 */
import { useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  /** Có thể bấm nút "Cài" (Android / desktop Chromium) */
  canPrompt: boolean;
  /** iPhone/iPad Safari: chỉ hiện hướng dẫn thêm vào màn hình chính */
  iosManual: boolean;
  /** Đang chạy như app đã cài — không hiện gì cả */
  installed: boolean;
};

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { canPrompt: false, iosManual: false, installed: false };
const listeners = new Set<() => void>();
const SERVER_STATE: InstallState = { canPrompt: false, iosManual: false, installed: false };

function set(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS dùng cờ riêng
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ tự nhận là Mac — phân biệt bằng màn cảm ứng
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  // Chrome/Firefox trên iOS (CriOS/FxiOS) không có "Thêm vào MH chính" ở cùng chỗ
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

let started = false;

/** Gọi đúng một lần ở gốc app (PwaSetup) */
export function startInstallTracking() {
  if (started || typeof window === "undefined") return;
  started = true;

  if (isStandalone()) {
    set({ installed: true });
    return;
  }
  set({ iosManual: isIosSafari() });

  window.addEventListener("beforeinstallprompt", (e) => {
    // Chặn thanh gợi ý mặc định của trình duyệt — tự hiện banner của mình
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    set({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ canPrompt: false, installed: true });
  });
}

/** Mở hộp thoại cài của trình duyệt. Trả true nếu người dùng đồng ý. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  // Mỗi sự kiện chỉ prompt được một lần
  deferred = null;
  set({ canPrompt: false });
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER_STATE,
  );
}
