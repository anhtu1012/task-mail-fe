"use client";
/**
 * Ô mờ đứng thay chỗ một thẻ đang được tạo.
 *
 * Hiện tiêu đề thật ngay lập tức chứ không phải một khối xám trống: người dùng
 * vừa gõ dòng đó, thấy lại đúng chữ mình gõ mới yên tâm là hệ thống đã nhận.
 * Vòng sáng chạy qua báo "đang gửi", và ô này biến mất khi thẻ thật xuất hiện.
 */
import { LoaderCircle } from "lucide-react";
import { G } from "./ui";
import styles from "./board.module.scss";

export function PendingCardTile({ title }: { title: string }) {
  return (
    <div
      className={`${styles.card} ${styles.cardPending} px-2.5 py-2 flex items-start gap-2`}
      aria-busy="true"
    >
      <LoaderCircle
        size={13}
        className="animate-spin shrink-0 mt-[3px]"
        style={{ color: G.textMuted }}
      />
      <span
        className="text-[13.5px] font-medium leading-[1.45]"
        style={{ color: G.textMuted }}
      >
        {title}
      </span>
    </div>
  );
}
