"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardDetailView } from "@/components/board/CardDetailView";
import { useBoard } from "@/components/board/BoardStore";

/**
 * Chi tiết việc dạng hộp thoại lớn đè lên bảng.
 * Cố ý KHÔNG chiếm trọn màn hình: vẫn thấy mép bảng phía sau nên biết mình
 * đang ở đâu, và bấm ra ngoài là quay lại ngay.
 */
export default function CardModal({
  params,
}: {
  params: Promise<{ boardId: string; cardId: string }>;
}) {
  const { cardId } = use(params);
  const router = useRouter();
  const { cardById } = useBoard();
  const card = cardById.get(cardId);

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

  // Việc vừa bị xoá trong lúc đang mở
  useEffect(() => {
    if (!card) router.back();
  }, [card, router]);

  if (!card) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      onClick={close}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(2,19,33,.55)", backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1120px] h-full max-h-[92vh] rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 30px 80px rgba(2,19,33,.5)" }}
      >
        <CardDetailView card={card} onClose={close} />
      </div>
    </div>
  );
}
