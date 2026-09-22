"use client";

import { use, useEffect } from "react";
import { createPortal } from "react-dom";
import { ConfigProvider } from "antd";
import { useRouter } from "next/navigation";
import { CardDetailView } from "@/components/board/CardDetailView";

/**
 * Chi tiết việc, chiếm TRỌN màn hình đè lên bảng.
 *
 * Trước đây cố tình chừa mép để thấy bảng phía sau. Nhưng màn này có bốn cụm
 * nội dung — thuộc tính, mô tả, đính kèm, ghi chú — và khi chừa mép thì cả bốn
 * phải chen trong 92% chiều cao, cột ghi chú bên phải sinh thanh cuộn riêng.
 * Thấy mép bảng không đáng giá bằng đọc được nội dung.
 *
 * Vẫn thoát nhanh được: Esc, nút X, hoặc "Quay lại bảng" ở góc trái.
 *
 * PHẢI ĐI QUA PORTAL ra `document.body`, không chỉ `position: fixed`:
 *
 * Khung `.main` của layout hệ thống có `backdrop-filter` và `z-index: 1`. Hai
 * thứ đó biến nó thành containing block cho con `position: fixed` VÀ thành một
 * stacking context riêng — nên `z-[1100]` ở đây cũng không bao giờ vượt lên
 * trên thanh điều hướng (`z-index: 40`, anh em với `.main`).
 *
 * Lúc hộp thoại còn chừa mép thì không ai thấy: nó không chạm tới dải bên
 * trái. Chuyển sang full màn hình thì thanh điều hướng cắt mất chữ "Quay lại
 * bảng" — đúng lỗi trong ảnh. Cùng nguyên nhân với chế độ toàn màn hình của
 * bảng, xem `components/board/BoardShell.tsx`.
 */
export default function CardModal({
  params,
}: {
  params: Promise<{ boardId: string; cardId: string }>;
}) {
  const { cardId } = use(params);
  const router = useRouter();
  const close = () => router.back();

  // Esc quay lại bảng thay vì thoát khỏi ứng dụng
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  // Khoá cuộn nền khi lớp phủ đang mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={close}
      className="fixed inset-0 z-[1100]"
      style={{ background: "rgba(2,19,33,.55)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full overflow-hidden bg-white"
      >
        {/*
          Nâng tầng của mọi popup antd bên trong màn này lên trên lớp phủ.

          Lớp phủ ở z-index 1100, còn Popover/Dropdown của antd mặc định dựng ở
          ~1030 và render thẳng vào `document.body` — nên sau khi màn chi tiết
          chuyển sang full màn hình + portal, bấm "Lặp lại" hay "+ Nhãn" là
          popup mở ra NGAY BÊN DƯỚI lớp phủ: không thấy gì, tưởng nút hỏng.
        */}
        <ConfigProvider theme={{ token: { zIndexPopupBase: 1200 } }}>
        <CardDetailView cardId={cardId} onClose={close} />
        </ConfigProvider>
      </div>
    </div>
  );

  // Cây này chỉ chạy phía trình duyệt (layout `(app)` chặn render ở máy chủ
  // cho tới khi kiểm xong cookie), nhưng vẫn kiểm `document` cho chắc.
  return typeof document === "undefined"
    ? overlay
    : createPortal(overlay, document.body);
}
