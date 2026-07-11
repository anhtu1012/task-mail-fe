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

  public async stats(assigneeId?: string): Promise<TaskStats> {
    return this.getWithParams<TaskStats>(
      API_ENDPOINTS.TASKS.STATS,
      toSearchParams({ assigneeId }),
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

  public async complete(id: string): Promise<Task> {
    return this.patch<Task, Record<string, never>>(
      API_ENDPOINTS.TASKS.COMPLETE(id),
      {},
    );
  }

  public async remove(id: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TASKS.DETAIL(id));
  }
}

export const taskApi = new TaskApi();
