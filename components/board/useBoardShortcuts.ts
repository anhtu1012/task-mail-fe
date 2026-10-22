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
 * chữ "n" vào tiêu đề cũng mở ô thêm việc. Ctrl+K vẫn chạy khi đang gõ.
 *
 * Ctrl+Z / Ctrl+Y thì KHÔNG chạy khi đang gõ: ở đó người dùng muốn hoàn tác
 * chữ vừa gõ, không phải thao tác trên bảng. Trước đây phím này vẫn chạy và
 * nuốt mất undo của ô nhập — gõ mô tả xong bấm Ctrl+Z ngay sau khi vừa thêm
 * việc thì mục "thêm việc" bị hoàn tác, tức là XOÁ luôn việc đang mở, rồi bấm
 * Lưu thì backend báo "Task not found".
 *
 * Có hộp thoại đang mở (màn chi tiết việc, form antd…) thì tắt hết: bảng nằm
 * phía sau lớp phủ, người dùng không nhìn thấy thứ mà phím tắt vừa thay đổi.
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

    /**
     * Có hộp thoại nào đang hiện không. Kiểm tra cả nơi phát phím lẫn DOM:
     * bấm vào chỗ trống trong hộp thoại thì `e.target` là `body`. Modal antd
     * đóng mà không huỷ vẫn nằm trong DOM nhưng bị ẩn — `getClientRects()`
     * rỗng nên không bị tính.
     */
    const dialogOpen = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (node?.closest?.('[role="dialog"], [aria-modal="true"]')) return true;
      return Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
      ).some((d) => d.getClientRects().length > 0);
    };

    const onKey = (e: KeyboardEvent) => {
      if (dialogOpen(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;

      // --- Ctrl+K: chạy kể cả khi đang gõ ---
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onPalette();
        return;
      }

      // Đang gõ thì để trình duyệt / trình soạn thảo tự hoàn tác chữ
      if (mod && isTyping(e.target)) return;

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
