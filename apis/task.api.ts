import { CompleteCardResponse } from "@/models/board";
import {
  CreateTaskInput,
  QueryTaskParams,
  Task,
  TaskListResponse,
  TaskStats,
  UpdateTaskInput,
} from "@/models/task";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

/** Loại bỏ field undefined/null/"" để không dính forbidNonWhitelisted / query rác */
const toSearchParams = (params: Record<string, unknown>): URLSearchParams => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  return search;
};

class TaskApi extends AxiosService {
  public async list(params: QueryTaskParams = {}): Promise<TaskListResponse> {
    return this.getWithParams<TaskListResponse>(
      API_ENDPOINTS.TASKS.ROOT,
      toSearchParams(params),
    );
  }

  /** `projectId` giới hạn thống kê trong một dự án; thiếu nó là tính cả tài khoản */
  public async stats(
    assigneeId?: string,
    projectId?: string,
  ): Promise<TaskStats> {
    return this.getWithParams<TaskStats>(
      API_ENDPOINTS.TASKS.STATS,
      toSearchParams({ assigneeId, projectId }),
    );
  }

  public async detail(id: string): Promise<Task> {
    return this.get<Task>(API_ENDPOINTS.TASKS.DETAIL(id));
  }

  public async create(input: CreateTaskInput): Promise<Task> {
    return this.post<Task, CreateTaskInput>(API_ENDPOINTS.TASKS.ROOT, input);
  }

  public async update(id: string, input: UpdateTaskInput): Promise<Task> {
    return this.patch<Task, UpdateTaskInput>(
      API_ENDPOINTS.TASKS.DETAIL(id),
      input,
    );
  }

  /**
   * Từ đợt bảng công việc cá nhân, endpoint này trả `{ completed, next }`
   * chứ không còn trả thẳng task — xem docs/backend/board-api-contract.md 4.5.
   */
  public async complete(id: string): Promise<CompleteCardResponse> {
    return this.patch<CompleteCardResponse, Record<string, never>>(
      API_ENDPOINTS.TASKS.COMPLETE(id),
      {},
    );
  }

  public async remove(id: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TASKS.DETAIL(id));
  }
}

export const taskApi = new TaskApi();
