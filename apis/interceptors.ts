/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { API_ENDPOINTS } from "./endpoints";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { Authorization } from "./authorization";
import { getCookie } from "@/utils/client/getCookie";
import { isValidToken } from "@/utils/servers/api";

// ==========================================
// SHARED REFRESH TOKEN STATE & QUEUE
// ==========================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const resetRefreshState = (): void => {
  isRefreshing = false;
  failedQueue = [];
};

// ==========================================
// AUTHENTICATION UTILITIES
// ==========================================
export const setCookieSecurely = (
  name: string,
  value: string,
  authInstance?: Authorization,
): void => {
  const maxAge = 8 * 60 * 60; // 8 hours
  const isProduction =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isProduction ? "Secure;" : "";

  document.cookie = `${name}=${value}; Max-Age=${maxAge}; path=/; ${secureFlag} SameSite=Strict`;

  if (name === "accessToken" && authInstance) {
    // Lưu tạm vào variable của class
    authInstance.setToken(value);
  }
};

/**
 * Xin accessToken mới bằng refresh_token (HttpOnly cookie, `withCredentials`
 * tự mang đi). Single-flight: BE xoay vòng refresh token và coi việc dùng lại
 * token cũ là tấn công (AUTH_REFRESH_TOKEN_REUSED) — hai lời gọi song song
 * (StrictMode, interceptor + trang login) sẽ làm hỏng phiên, nên mọi nơi phải
 * đi qua hàm này và dùng chung một promise.
 */
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = (
  baseUrl: string,
  authInstance?: Authorization,
): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        { withCredentials: true, timeout: 10000 },
      )
      .then(({ data }) => {
        if (!data?.accessToken) {
          throw new Error("Invalid refresh response: missing accessToken");
        }
        setCookieSecurely("accessToken", data.accessToken, authInstance);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const dispatchUnauthorizedEvent = (message: string): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("unauthorized", { detail: { message } }),
    );
  }
};

export const handleSessionExpired = (): void => {
  document.cookie = "accessToken=; Max-Age=0; path=/;";
  document.cookie = "forbiddenMenus=; Max-Age=0; path=/;";

  localStorage.clear();
  sessionStorage.clear();
  resetRefreshState();
  dispatchUnauthorizedEvent("Session expired. Please login again.");
};

// ==========================================
// INTERCEPTORS SETUP
// ==========================================

export const setupRequestInterceptor = (
  http: AxiosInstance,
  authInstance: Authorization,
): void => {
  http.interceptors.request.use(
    async (
      config: InternalAxiosRequestConfig,
    ): Promise<InternalAxiosRequestConfig> => {
      const token = getCookie("accessToken");
      const headers = (config.headers as any) || {};

      headers.Accept = "application/json";

      const locale = getCookie("NEXT_LOCALE") || "vi";
      headers["x-lang"] = locale;

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (isValidToken(authInstance.getToken())) {
        headers.Authorization = `Bearer ${authInstance.getToken()}`;
      }

      config.headers = headers;
      return config;
    },
    (error) => Promise.reject(error),
  );
};

export const setupResponseInterceptor = (
  http: AxiosInstance,
  baseUrl: string,
  authInstance: Authorization,
): void => {
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Case 1: Lỗi từ API Refresh Token (Thất bại khi xin token mới)
      if (
        error.config?.url?.includes(API_ENDPOINTS.AUTH.REFRESH) &&
        error.response?.status === 401
      ) {
        handleSessionExpired();
        return Promise.reject(error);
      }

      // Case 2: Lỗi mạng không có response
      if (!error.response) {
        return Promise.reject(error);
      }

      // Case 3: 401 Access Token hết hạn -> Bắt đầu Refresh Token
      if (error.response?.status === 401 && !originalRequest._retry) {
        const isAuthEndpoint = [
          API_ENDPOINTS.AUTH.LOGIN,
          API_ENDPOINTS.AUTH.REGISTER,
          API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
          API_ENDPOINTS.AUTH.RESET_PASSWORD,
          API_ENDPOINTS.AUTH.GOOGLE_CALLBACK,
        ].some((endpoint) => originalRequest.url?.includes(endpoint));

        if (isAuthEndpoint) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // KHÓA LUỒNG: Nếu đã có request nào đang làm nhiệm vụ refresh, request này phải xếp hàng
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return http(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // Bật khóa luồng để bắt đầu xin cấp refresh token
        isRefreshing = true;

        try {
          // Token lưu trong HttpOnly Cookie nên withCredentials: true tự mang đi ngầm
          const newAccessToken = await refreshAccessToken(
            baseUrl,
            authInstance,
          );
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Giải phóng toàn bộ API đang chờ trong Queue
          processQueue(null, newAccessToken);

          // Chạy lại chính API vừa bị lỗi
          return http(originalRequest);
        } catch (refreshError: any) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Refresh token failed:", refreshError);
          }
          // Hủy toàn bộ Queue
          processQueue(refreshError, null);
          handleSessionExpired();
          return Promise.reject(refreshError);
        } finally {
          // Luôn luôn mở khóa luồng cho các API sau
          isRefreshing = false;
        }
      }

      // Case 4: Các lỗi 401 khác (Ví dụ Token mới cũng bị 401 do role)
      if (error.response?.status === 401) {
        const message =
          error.response?.data?.message ||
          "Unauthorized access. Please login again.";
        dispatchUnauthorizedEvent(message);
      }

      // Case 5: Lỗi 403 Không có quyền -> Chuyển hướng sang trang 403
      if (error.response?.status === 403) {
        if (typeof window !== "undefined") {
          window.location.href = "/403";
        }
      }

      return Promise.reject(error);
    },
  );
};

