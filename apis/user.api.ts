/**
 * Danh bạ người dùng — chỉ để giao việc.
 *
 * Backend giới hạn ADMIN/SUPER_ADMIN: người dùng thường gọi sẽ nhận 403, và
 * họ cũng không cần — `POST /tasks` bỏ qua `assigneeId` của họ và luôn giao
 * việc cho chính họ.
 */
import { UserSummary } from "@/models/task";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

class UserApi extends AxiosService {
  /** Người đang ACTIVE, đã sắp theo email phía backend */
  public list(): Promise<UserSummary[]> {
    return this.get<UserSummary[]>(API_ENDPOINTS.USERS.ROOT);
  }
}

export const userApi = new UserApi();
