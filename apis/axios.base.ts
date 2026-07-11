/* eslint-disable @typescript-eslint/no-explicit-any */
// Đã loại bỏ import AuthServices để tránh vòng lặp import

import axios from "axios";
import { API_ENDPOINTS } from "./endpoints";
import { Authorization } from "./authorization";
import {
  setupRequestInterceptor,
  setupResponseInterceptor,
} from "./interceptors";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { RepositoryPort } from "./ddd/repository.port";

export class AxiosService extends Authorization implements RepositoryPort {
  protected baseUrl: string;
  protected http: AxiosInstance;

  constructor(baseUrl?: string) {
    super();
    // Ưu tiên đọc biến NEXT_PUBLIC_API_URL từ Vite
    // Nếu không có, fallback về localhost.
    this.baseUrl =
      baseUrl ?? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888");

    // KHỞI TẠO AXIOS INSTANCE 1 LẦN DUY NHẤT
    this.http = axios.create({
      baseURL: this.baseUrl,
      withCredentials: true,
    });

    // Tích hợp Interceptors (Request & Response) được tách riêng biệt để cấu trúc gọn hơn
    setupRequestInterceptor(this.http, this);
    setupResponseInterceptor(this.http, this.baseUrl, this);
  }

  // ============== REST API METHODS ==============

  async get<T>(url: string): Promise<T> {
    const response = await this.http.get<T>(url);
    return response.data;
  }

  async getWithParams<T>(url: string, params?: URLSearchParams): Promise<T> {
    const response = await this.http.get<T>(url, { params });
    return response.data;
  }

  async post<T, TFromData>(
    url: string,
    data: TFromData,
    config?: { headers?: AxiosRequestConfig["headers"] } | any,
  ): Promise<T> {
    const response = await this.http.post<T>(url, data, config);
    return response.data;
  }

  async put<T, TFromData>(url: string, data: TFromData): Promise<T> {
    const response = await this.http.put<T>(url, data);
    return response.data;
  }

  async patch<T, TFromData>(url: string, data: TFromData): Promise<T> {
    const response = await this.http.patch<T>(url, data);
    return response.data;
  }

  async delete<T, TFromData = any>(url: string, data?: TFromData): Promise<T> {
    const response = await this.http.delete<T>(url, { data });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      this.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      document.cookie = "accessToken=; Max-Age=0; path=/;";
      localStorage.clear();
      sessionStorage.clear();
    }
  }
}
