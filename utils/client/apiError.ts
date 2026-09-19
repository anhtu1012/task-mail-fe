import { AxiosError } from "axios";
import { ApiErrorBody, ERROR_CODE_MESSAGES } from "@/models/task";
import { PROJECT_ERROR_MESSAGES } from "@/models/project";

/** Gộp mọi bảng mã lỗi lại — mã là duy nhất toàn hệ thống nên không sợ đè nhau */
const CODE_MESSAGES: Record<string, string> = {
  ...ERROR_CODE_MESSAGES,
  ...PROJECT_ERROR_MESSAGES,
};

/**
 * Rút thông điệp lỗi thân thiện (ưu tiên map errorCode -> tiếng Việt,
 * fallback về message backend trả về).
 *
 * Cũng hiểu lỗi không đi qua mạng: kho mock dự án ném ra Error có sẵn
 * `errorCode` cùng bộ mã với backend (xem `apis/mock/project.mock.ts`).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Có lỗi xảy ra, vui lòng thử lại.",
): string {
  const err = error as AxiosError<ApiErrorBody>;
  const body = err?.response?.data;

  const localCode = getLocalErrorCode(error);
  if (localCode && CODE_MESSAGES[localCode]) return CODE_MESSAGES[localCode];

  if (body?.errorCode && CODE_MESSAGES[body.errorCode]) {
    return CODE_MESSAGES[body.errorCode];
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
  return (
    getLocalErrorCode(error) ??
    (error as AxiosError<ApiErrorBody>)?.response?.data?.errorCode
  );
}

/** errorCode gắn thẳng trên Error (lỗi sinh ra dưới máy, không qua HTTP) */
function getLocalErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && "errorCode" in error) {
    const code = (error as Error & { errorCode?: unknown }).errorCode;
    if (typeof code === "string") return code;
  }
  return undefined;
}
