/**
 * Lớp gọi API của Dự án.
 * Hợp đồng: docs/backend/project-api-spec.md.
 *
 * Trước đây có kho mock dưới máy làm phương án lùi khi backend chưa có
 * `/projects`. Đã gỡ: backend có module dự án rồi, và chính phương án lùi đó
 * sinh ra id dự án "ma" (chỉ có trong localStorage) khiến `/boards/me/full`
 * trả PROJECT_NOT_FOUND. Giờ lỗi thật phải nổi lên thật.
 */
import {
  CreateProjectInput,
  Project,
  ProjectListResponse,
  QueryProjectParams,
  UpdateProjectInput,
} from "@/models/project";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

const params = (obj: Record<string, unknown>): URLSearchParams => {
  const search = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  return search;
};

class ProjectApi extends AxiosService {
  public list(query: QueryProjectParams = {}): Promise<ProjectListResponse> {
    return this.getWithParams<ProjectListResponse>(
      API_ENDPOINTS.PROJECTS.ROOT,
      params({ includeArchived: query.includeArchived }),
    );
  }

  public detail(id: string): Promise<Project> {
    return this.get<Project>(API_ENDPOINTS.PROJECTS.DETAIL(id));
  }

  public create(input: CreateProjectInput): Promise<Project> {
    return this.post<Project, CreateProjectInput>(API_ENDPOINTS.PROJECTS.ROOT, input);
  }

  public update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.patch<Project, UpdateProjectInput>(API_ENDPOINTS.PROJECTS.DETAIL(id), input);
  }

  /** Đặt dự án mặc định — dự án tự mở sau khi đăng nhập trên máy mới */
  public setDefault(id: string): Promise<Project> {
    return this.put<Project, Record<string, never>>(API_ENDPOINTS.PROJECTS.DEFAULT(id), {});
  }

  /** Lưu trữ / bỏ lưu trữ. Dữ liệu vẫn còn, chỉ ẩn khỏi bộ chọn dự án. */
  public setArchived(id: string, archived: boolean): Promise<Project> {
    return this.put<Project, { archived: boolean }>(API_ENDPOINTS.PROJECTS.ARCHIVE(id), {
      archived,
    });
  }

  public remove(id: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.PROJECTS.DETAIL(id));
  }
}

export const projectApi = new ProjectApi();
