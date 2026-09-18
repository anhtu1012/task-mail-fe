/**
 * Hình dạng dữ liệu trao đổi với backend cho phần cài đặt giao diện.
 *
 * `ThemeState` (libs/theme/presets.ts) là nguồn sự thật về *nội dung* cấu hình;
 * ở đây chỉ mô tả phần vỏ mà API bọc quanh nó, để không có hai định nghĩa
 * lệch nhau khi thêm trường mới.
 */
import type { ThemeState } from "@/libs/theme/presets";

/**
 * Cho biết bản ghi trả về là của người dùng hay chỉ là mặc định hệ thống.
 *
 * Cần thiết để phân biệt "chưa từng lưu" với "đã lưu và trùng mặc định":
 * trường hợp đầu thì FE đẩy cấu hình đang có dưới máy lên (chuyển tiếp từ
 * thời còn lưu ở localStorage), trường hợp sau thì không được ghi đè.
 */
export type ThemeSource = "user" | "default";

export interface ThemePreferenceResponse {
  theme: ThemeState;
  source: ThemeSource;
  /** ISO-8601, null khi source = "default" */
  updatedAt: string | null;
}

export type SaveThemePreferenceInput = ThemeState;
