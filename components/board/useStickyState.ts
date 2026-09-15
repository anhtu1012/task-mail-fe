"use client";

import { useEffect, useState } from "react";

/**
 * State nhớ lại giữa các lần mở trang (localStorage).
 *
 * Đọc localStorage ngay trong hàm khởi tạo chứ không đặt trong effect — đặt
 * trong effect sẽ tạo một lượt render thừa và vi phạm quy tắc set-state-in-effect.
 *
 * Về hydration: cây component của bảng KHÔNG bao giờ được render ở server, vì
 * app/(app)/layout.tsx chỉ hiện <Spin/> cho tới khi kiểm tra xong cookie trong
 * effect. Nên không có HTML phía server để lệch. Nếu sau này bỏ chốt chặn đó,
 * phải đổi hook này sang useSyncExternalStore với getServerSnapshot.
 */
export function useStickyState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      // Chế độ riêng tư / bị chặn cookie -> dùng giá trị mặc định
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Hết dung lượng hoặc bị chặn -> không lưu, không làm vỡ UI
    }
  }, [key, value]);

  return [value, setValue] as const;
}
