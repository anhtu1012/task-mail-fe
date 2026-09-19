"use client";
/**
 * React Query hooks cho toàn bộ app Task.
 * Lưu ý backend rate-limit 20 req/60s -> staleTime hợp lý, không polling dồn dập.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { App } from "antd";
import { authApi } from "@/apis/auth.api";
import { taskApi } from "@/apis/task.api";
import { taskTypeApi } from "@/apis/task-type.api";
import { integrationApi } from "@/apis/integration.api";
import {
  CreateTaskInput,
  QueryTaskParams,
  SaveTaskTypeInput,
  UpdateTaskInput,
  isAdminRole,
} from "@/models/task";
import { useAppSelector } from "@/store/hooks";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { getCookie } from "@/utils/client/getCookie";

/**
 * Dự án đang mở, đọc thẳng từ Redux.
 *
 * Cố tình KHÔNG import `useCurrentProject` từ `hooks/useProjects`: file đó đã
 * import `useMe` từ đây, nối thêm chiều ngược lại là thành vòng import. Ở đây
 * chỉ cần đúng cái id; phần kiểm tra id còn hợp lệ hay không là việc của
 * `useCurrentProject` và của layout.
 */
function useProjectScope(): string | null {
  return useAppSelector((state) => state.project.currentProjectId);
}

export const QK = {
  me: ["me"] as const,
  tasks: (params?: QueryTaskParams) => ["tasks", params ?? {}] as const,
  task: (id: string) => ["task", id] as const,
  taskStats: (assigneeId?: string, projectId?: string | null) =>
    ["task-stats", assigneeId ?? "me", projectId ?? "none"] as const,
  taskTypes: ["task-types"] as const,
  mailAccounts: ["mail-accounts"] as const,
  zaloMe: ["zalo-me"] as const,
  zaloBot: ["zalo-bot-status"] as const,
};

// ==========================================
// AUTH
// ==========================================
export function useMe() {
  return useQuery({
    queryKey: QK.me,
    queryFn: () => authApi.me(),
    enabled: typeof window !== "undefined" && !!getCookie("accessToken"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ==========================================
// TASKS
// ==========================================
/**
 * Danh sách việc CỦA DỰ ÁN ĐANG MỞ.
 *
 * `projectId` được chèn ở đây chứ không ở từng trang: chỉ cần một trang quên
 * truyền là người dùng thấy việc của dự án khác. Nó cũng nằm trong queryKey,
 * nên đổi dự án là React Query coi như truy vấn khác hẳn, không tái dùng cache.
 *
 * Chưa chọn dự án thì truy vấn tắt (`enabled = false`) — thà không hiện gì còn
 * hơn hiện nhầm toàn bộ việc của mọi dự án.
 */
export function useTasks(params: QueryTaskParams, options?: { enabled?: boolean }) {
  const projectId = useProjectScope();
  const scoped: QueryTaskParams = { ...params, projectId: projectId ?? undefined };
  return useQuery({
    queryKey: QK.tasks(scoped),
    queryFn: () => taskApi.list(scoped),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev, // giữ data cũ khi đổi trang/filter -> không giật
    enabled: (options?.enabled ?? true) && !!projectId,
  });
}

export function useTaskStats(assigneeId?: string) {
  const projectId = useProjectScope();
  return useQuery({
    queryKey: QK.taskStats(assigneeId, projectId),
    queryFn: () => taskApi.stats(assigneeId, projectId ?? undefined),
    staleTime: 60 * 1000,
    enabled: !!projectId,
  });
}

/** Invalidate mọi cache liên quan task sau khi ghi */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    queryClient.invalidateQueries({ queryKey: ["task"] });
  };
}

/** Việc mới luôn rơi vào dự án đang mở, trừ khi form chỉ định dự án khác */
export function useCreateTask() {
  const { message } = App.useApp();
  const invalidate = useInvalidateTasks();
  const projectId = useProjectScope();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      taskApi.create({ ...input, projectId: input.projectId ?? projectId ?? undefined }),
    onSuccess: (task) => {
      message.success(`Đã tạo công việc ${task.code}`);
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useUpdateTask() {
  const { message } = App.useApp();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      taskApi.update(id, input),
    onSuccess: () => {
      message.success("Đã cập nhật công việc");
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useCompleteTask() {
  const { message } = App.useApp();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => taskApi.complete(id),
    onSuccess: ({ completed, next }) => {
      // `next` chỉ có khi việc được đặt lặp lại — báo luôn để người dùng biết
      // đã có thẻ mới, khỏi tưởng hệ thống tự nhân đôi việc
      message.success(
        next
          ? `${completed.code} đã hoàn thành 🎉 — đã tạo lượt kế tiếp ${next.code}`
          : `${completed.code} đã hoàn thành 🎉`,
      );
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useDeleteTask() {
  const { message } = App.useApp();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: () => {
      message.success("Đã xoá công việc");
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

// ==========================================
// TASK TYPES
// ==========================================
export function useTaskTypes() {
  return useQuery({
    queryKey: QK.taskTypes,
    queryFn: () => taskTypeApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTaskType() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: SaveTaskTypeInput }) =>
      id
        ? taskTypeApi.update(id, input)
        : taskTypeApi.create(input as Required<SaveTaskTypeInput>),
    onSuccess: (_, { id }) => {
      message.success(id ? "Đã cập nhật loại công việc" : "Đã tạo loại công việc");
      queryClient.invalidateQueries({ queryKey: QK.taskTypes });
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useDeleteTaskType() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskTypeApi.remove(id),
    onSuccess: () => {
      message.success("Đã xoá loại công việc");
      queryClient.invalidateQueries({ queryKey: QK.taskTypes });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

// ==========================================
// INTEGRATIONS
// ==========================================
export function useMailAccounts() {
  return useQuery({
    queryKey: QK.mailAccounts,
    queryFn: () => integrationApi.listMailAccounts(),
    staleTime: 60 * 1000,
  });
}

export function useRemoveMailAccount() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationApi.removeMailAccount(id),
    onSuccess: () => {
      message.success("Đã ngắt kết nối hộp thư");
      queryClient.invalidateQueries({ queryKey: QK.mailAccounts });
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useZaloLinkStatus() {
  return useQuery({
    queryKey: QK.zaloMe,
    queryFn: () => integrationApi.getZaloLinkStatus(),
    staleTime: 30 * 1000,
  });
}

export function useZaloBotStatus(enabled: boolean) {
  return useQuery({
    queryKey: QK.zaloBot,
    queryFn: () => integrationApi.getZaloBotStatus(),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export { isAdminRole };
