import { SaveTaskTypeInput, TaskType } from "@/models/task";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

class TaskTypeApi extends AxiosService {
  public async list(): Promise<TaskType[]> {
    return this.get<TaskType[]>(API_ENDPOINTS.TASK_TYPES.ROOT);
  }

  public async create(input: Required<SaveTaskTypeInput>): Promise<TaskType> {
    return this.post<TaskType, SaveTaskTypeInput>(
      API_ENDPOINTS.TASK_TYPES.ROOT,
      input,
    );
  }

  public async update(id: string, input: SaveTaskTypeInput): Promise<TaskType> {
    return this.patch<TaskType, SaveTaskTypeInput>(
      API_ENDPOINTS.TASK_TYPES.DETAIL(id),
      input,
    );
  }

  public async remove(id: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TASK_TYPES.DETAIL(id));
  }
}

export const taskTypeApi = new TaskTypeApi();
