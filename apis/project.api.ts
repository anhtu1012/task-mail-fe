/**
 * Lớp gọi API của Dự án.
 * Hợp đồng: docs/backend/project-api-spec.md.
 *
 * TRẠNG THÁI: backend **chưa triển khai**. Mỗi phương thức gọi API thật trước;
 * gặp 404 (chưa có route) hoặc 501 (có route, chưa bật) thì đánh dấu
 * `unsupported` và lùi về kho mock dưới máy (`apis/mock/project.mock.ts`) cho
 * cả phiên. Đây đúng là cách `themeApi` đang làm.
 *
 * Khi backend deploy xong: không phải sửa file này, cũng không phải đổi biến
 * môi trường. Lần gọi đầu trả 200 là mock tự ngừng được dùng. Việc còn lại chỉ
 * là gỡ ghi chú "backend chưa triển khai" ở đây và trong `apis/endpoints.ts`.
 *
 * KHÔNG tính là "chưa hỗ trợ": 401 (hết phiên — interceptor lo), 429 (vượt
 * trần 20 req/60s, lần sau gọi lại được), 5xx (backend lỗi thật, phải để lỗi
 * nổi lên chứ không âm thầm chuyển sang dữ liệu giả).
 */
import axios from "axios";
import {
  CreateProjectInput,
  Project,
  ProjectListResponse,
  QueryProjectParams,
  UpdateProjectInput,
} from "@/models/project";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";
import { projectMock } from "./mock/project.mock";

const params = (obj: Record<string, unknown>): URLSearchParams => {
  const search = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  return search;
};

class ProjectApi extends AxiosService {
  /** true khi backend chưa có route — thôi gọi lại trong phiên này */
  private unsupported = false;

  /** Trang quản lý dự án đọc cờ này để hiện nhãn "đang dùng dữ liệu mẫu" */
  public get isMock(): boolean {
    return this.unsupported;
  }

  public async list(
    query: QueryProjectParams = {},
  ): Promise<ProjectListResponse> {
    if (this.unsupported) return projectMock.list(query);
    try {
      return await this.getWithParams<ProjectListResponse>(
        API_ENDPOINTS.PROJECTS.ROOT,
        params({ includeArchived: query.includeArchived }),
      );
    } catch (error) {
      // Chỉ endpoint này được phép suy ra "backend chưa có module dự án" từ
      // 404: nó là route gốc, không nhận id nào cả.
      if (this.markIfUnsupported(error, true)) return projectMock.list(query);
      throw error;
    }
  }

  public async detail(id: string): Promise<Project> {
    if (this.unsupported) return projectMock.detail(id);
    try {
      return await this.get<Project>(API_ENDPOINTS.PROJECTS.DETAIL(id));
    } catch (error) {
      if (this.markIfUnsupported(error)) return projectMock.detail(id);
      throw error;
    }
  }

  public async create(input: CreateProjectInput): Promise<Project> {
    if (this.unsupported) return projectMock.create(input);
    try {
      return await this.post<Project, CreateProjectInput>(
        API_ENDPOINTS.PROJECTS.ROOT,
        input,
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) return projectMock.create(input);
      throw error;
    }
  }

  public async update(
    id: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    if (this.unsupported) return projectMock.update(id, input);
    try {
      return await this.patch<Project, UpdateProjectInput>(
        API_ENDPOINTS.PROJECTS.DETAIL(id),
        input,
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) return projectMock.update(id, input);
      throw error;
    }
  }

  /** Đặt dự án mặc định — dự án tự mở sau khi đăng nhập trên máy mới */
  public async setDefault(id: string): Promise<Project> {
    if (this.unsupported) return projectMock.setDefault(id);
    try {
      return await this.put<Project, Record<string, never>>(
        API_ENDPOINTS.PROJECTS.DEFAULT(id),
        {},
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) return projectMock.setDefault(id);
      throw error;
    }
  }

  /** Lưu trữ / bỏ lưu trữ. Dữ liệu vẫn còn, chỉ ẩn khỏi bộ chọn dự án. */
  public async setArchived(id: string, archived: boolean): Promise<Project> {
    if (this.unsupported) return projectMock.update(id, { archived });
    try {
      return await this.put<Project, { archived: boolean }>(
        API_ENDPOINTS.PROJECTS.ARCHIVE(id),
        { archived },
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) {
        return projectMock.update(id, { archived });
      }
      throw error;
    }
  }

  public async remove(id: string): Promise<void> {
    if (this.unsupported) return projectMock.remove(id);
    try {
      return await this.delete<void>(API_ENDPOINTS.PROJECTS.DETAIL(id));
    } catch (error) {
      if (this.markIfUnsupported(error)) return projectMock.remove(id);
      throw error;
    }
  }

  /**
   * `rootRoute = true` chỉ dành cho `GET /projects`. Ở các endpoint có `:id`,
   * 404 nhiều khả năng là `PROJECT_NOT_FOUND` thật chứ không phải thiếu route
   * — nuốt nó và trả dữ liệu mock sẽ che mất lỗi thật, nên chỉ 501 mới tính.
   */
  private markIfUnsupported(error: unknown, rootRoute = false): boolean {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 501 || (rootRoute && status === 404)) {
      this.unsupported = true;
      return true;
    }
    return false;
  }
}

export const projectApi = new ProjectApi();
