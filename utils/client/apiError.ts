import { AxiosError } from "axios";
import { ApiErrorBody, ERROR_CODE_MESSAGES } from "@/models/task";

/**
 * Rút thông điệp lỗi thân thiện (ưu tiên map errorCode -> tiếng Việt,
 * fallback về message backend trả về).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Có lỗi xảy ra, vui lòng thử lại.",
): string {
  const err = error as AxiosError<ApiErrorBody>;
  const body = err?.response?.data;

  if (body?.errorCode && ERROR_CODE_MESSAGES[body.errorCode]) {
    return ERROR_CODE_MESSAGES[body.errorCode];
  }
  if (err?.response?.status === 429) {
    return "Bạn thao tác quá nhanh (giới hạn 20 yêu cầu/phút). Vui lòng chờ một lát.";
  }
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join("\n") : body.message;
  }
  if (err?.message === "Network Error" || !err?.response) {
    return "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.";
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.data?.errorCode;
}
