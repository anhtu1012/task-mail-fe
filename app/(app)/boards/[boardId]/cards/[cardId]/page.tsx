"use client";

/**
 * Trang đầy đủ của một việc — chỉ chạy khi mở thẳng link hoặc tải lại trang,
 * vì điều hướng từ trong bảng đã bị @modal/(.)cards/[cardId] chặn lại.
 *
 * Giữ GIỐNG HỆT bản trong bảng: full màn hình và đi qua portal ra
 * `document.body`. Hai đường vào cùng một màn mà nhìn khác nhau thì người dùng
 * tưởng mình đang ở hai chỗ; còn portal là bắt buộc để thoát stacking context
 * của `.main` — xem ghi chú ở @modal/(.)cards/[cardId]/page.tsx.
 */
import { use } from "react";
import { createPortal } from "react-dom";
import { ConfigProvider } from "antd";
import { useRouter } from "next/navigation";
import { CardDetailView } from "@/components/board/CardDetailView";

export default function CardPage({
  params,
}: {
  params: Promise<{ boardId: string; cardId: string }>;
}) {
  const { boardId, cardId } = use(params);
  const router = useRouter();

  const overlay = (
    <div
      className="fixed inset-0 z-[1100]"
      style={{ background: "rgba(2,19,33,.55)" }}
    >
      <div className="w-full h-full overflow-hidden bg-white">
        {/*
          Nâng tầng của mọi popup antd bên trong màn này lên trên lớp phủ.

          Lớp phủ ở z-index 1100, còn Popover/Dropdown của antd mặc định dựng ở
          ~1030 và render thẳng vào `document.body` — nên sau khi màn chi tiết
          chuyển sang full màn hình + portal, bấm "Lặp lại" hay "+ Nhãn" là
          popup mở ra NGAY BÊN DƯỚI lớp phủ: không thấy gì, tưởng nút hỏng.
        */}
        <ConfigProvider theme={{ token: { zIndexPopupBase: 1200 } }}>
        <CardDetailView
          cardId={cardId}
          onClose={() => router.push(`/boards/${boardId}`)}
        />
        </ConfigProvider>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? overlay
    : createPortal(overlay, document.body);
}
