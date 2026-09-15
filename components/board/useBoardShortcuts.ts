"use client";

import { useEffect } from "react";

type Handlers = {
  onNewCard: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPalette: () => void;
  onFullscreen: () => void;
};

/**
 * Phím tắt của bảng.
 *
 * Cố tình ít phím: phím tắt chỉ có giá trị khi người dùng nhớ được.
 * Mọi phím đơn đều bỏ qua khi con trỏ đang ở trong ô nhập, nếu không thì gõ
 * chữ "n" vào tiêu đề cũng mở ô thêm việc. Riêng Ctrl+Z / Ctrl+K thì vẫn chạy
 * khi đang gõ, vì đó là thói quen chung của mọi ứng dụng.
 */
export function useBoardShortcuts({
  onNewCard,
  onUndo,
  onRedo,
  onPalette,
  onFullscreen,
}: Handlers) {
  useEffect(() => {
    const isTyping = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // --- Phím có tổ hợp: chạy kể cả khi đang gõ ---
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onPalette();
        return;
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
        return;
      }
      if (mod || e.altKey) return;

      // --- Phím đơn: chỉ khi không gõ ở ô nhập ---
      if (isTyping(e.target)) {
        // Esc rời ô tìm kiếm để quay lại dùng phím đơn
        if (e.key === "Escape" && (e.target as HTMLElement).dataset?.boardSearch !== undefined) {
          (e.target as HTMLInputElement).blur();
        }
        return;
      }

      if (e.key === "/") {
        const input = document.querySelector<HTMLInputElement>("[data-board-search]");
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
        }
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onNewCard();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onFullscreen();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onNewCard, onUndo, onRedo, onPalette, onFullscreen]);
}
