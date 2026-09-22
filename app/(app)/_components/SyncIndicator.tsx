"use client";
/**
 * Vạch mảnh chạy ở mép trên khung nội dung khi app đang nói chuyện với máy chủ.
 *
 * Vì sao cần: phần lớn thao tác ghi giờ đã cập nhật lạc quan, nên giao diện
 * đổi ngay còn yêu cầu vẫn đang bay. Không có dấu hiệu nào thì lúc mạng chậm
 * hoặc backend chạm trần 20 yêu cầu/60 giây, người dùng không phân biệt được
 * "xong rồi" với "treo".
 *
 * Cố tình chỉ là một vạch: mọi thứ nặng đô hơn (lớp phủ, spinner giữa màn) sẽ
 * nhấp nháy liên tục vì các truy vấn nền chạy rất thường xuyên.
 */
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import styles from "../layout.module.scss";

export default function SyncIndicator() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const busy = fetching + mutating > 0;

  return (
    <div
      className={`${styles.syncBar} ${busy ? styles.syncBarOn : ""}`}
      role="status"
      aria-live="polite"
      aria-label={busy ? "Đang đồng bộ dữ liệu" : "Đã đồng bộ"}
    />
  );
}
