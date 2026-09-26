"use client";
/**
 * React Query hooks cho toàn bộ app Task.
 * Lưu ý backend rate-limit 20 req/60s -> staleTime hợp lý, không polling dồn dập.
 */
import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { App } from "antd";
import { authApi } from "@/apis/auth.api";
import { boardApi } from "@/apis/board.api";
import { taskApi } from "@/apis/task.api";
import { userApi } from "@/apis/user.api";
import { taskTypeApi } from "@/apis/task-type.api";
import { integrationApi } from "@/apis/integration.api";
import {
  CreateTaskInput,
  QueryTaskParams,
  SaveTaskTypeInput,
  Task,
  TaskListResponse,
  TaskStatus,
  UpdateTaskInput,
  isAdminRole,
} from "@/models/task";
import { BoardLabel, BoardSnapshot } from "@/models/board";
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
  zaloRecipients: ["zalo-bot-recipients"] as const,
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

/**
 * NƠI DUY NHẤT quyết định "ghi xong thì làm mới những gì".
 *
 * Một công việc hiện ở năm màn khác nhau — Công việc, Kanban, Lịch, Tổng quan,
 * Bảng — và tất cả đọc từ những khoá cache khác nhau. Trước đây mỗi màn tự
 * viết danh sách khoá cần làm mới, và không màn nào nhớ tới `["board"]`: hoàn
 * thành một việc ở trang Công việc thì mở Bảng vẫn thấy thẻ chưa xong, tới khi
 * hết 30 giây staleTime mới tự sửa. Gom về một hàm để không bao giờ lệch nữa.
 *
 * `["projects"]` cũng nằm trong danh sách: thẻ dự án hiện số việc đang mở và
 * trễ hạn, hoàn thành một việc là hai con số đó sai ngay.
 */
export function useInvalidateTaskData() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    [
      ["tasks"],
      ["task"],
      ["task-stats"],
      ["board"], // gồm snapshot, agenda và tìm kiếm của bảng
      ["projects"],
    ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
  }, [queryClient]);
}

/** Tên cũ — giữ lại để không phải sửa hết chỗ gọi trong một lần */
const useInvalidateTasks = useInvalidateTaskData;

/**
 * Sửa TẠI CHỖ mọi trang danh sách việc đang nằm trong cache.
 *
 * Dùng cho cập nhật lạc quan: người dùng bấm xong thấy đổi ngay, không phải
 * chờ một vòng mạng rồi chờ thêm một vòng tải lại. Trả về ảnh chụp cache trước
 * khi sửa để `onError` hoàn nguyên.
 */
function patchTaskLists(
  queryClient: ReturnType<typeof useQueryClient>,
  fn: (task: Task) => Task | null,
): [readonly unknown[], TaskListResponse | undefined][] {
  const entries = queryClient.getQueriesData<TaskListResponse>({
    queryKey: ["tasks"],
  });
  entries.forEach(([key, value]) => {
    if (!value) return;
    const items = value.items
      .map((task) => fn(task))
      .filter((task): task is Task => task !== null);
    queryClient.setQueryData<TaskListResponse>(key, {
      ...value,
      items,
      total: value.total - (value.items.length - items.length),
    });
  });
  return entries;
}

function restoreTaskLists(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: [readonly unknown[], TaskListResponse | undefined][],
) {
  snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
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

/**
 * Hoàn thành việc — cập nhật lạc quan.
 *
 * Backend đang bị giới hạn 20 yêu cầu/60 giây nên một vòng ghi rồi tải lại có
 * thể mất vài trăm mili giây tới vài giây. Chờ chừng đó mới đổi giao diện thì
 * người dùng bấm lại lần nữa vì tưởng hụt. Đổi cache trước, hỏng thì hoàn nguyên.
 */
export function useCompleteTask() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => taskApi.complete(id),
    onMutate: (id) =>
      patchTaskLists(queryClient, (task) =>
        task.id === id
          ? {
              ...task,
              status: TaskStatus.DONE,
              completedAt: new Date().toISOString(),
            }
          : task,
      ),
    onError: (error, _id, snapshot) => {
      if (snapshot) restoreTaskLists(queryClient, snapshot);
      message.error(getApiErrorMessage(error));
    },
    onSuccess: ({ completed, next }) => {
      // `next` chỉ có khi việc được đặt lặp lại — báo luôn để người dùng biết
      // đã có thẻ mới, khỏi tưởng hệ thống tự nhân đôi việc
      message.success(
        next
          ? `${completed.code} đã hoàn thành — đã tạo lượt kế tiếp ${next.code}`
          : `${completed.code} đã hoàn thành`,
      );
      invalidate();
    },
  });
}

export function useDeleteTask() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    // Biến mất ngay khỏi danh sách; lỗi thì hiện lại đúng chỗ cũ
    onMutate: (id) =>
      patchTaskLists(queryClient, (task) => (task.id === id ? null : task)),
    onSuccess: () => {
      message.success("Đã xoá công việc");
      invalidate();
    },
    onError: (error, _id, snapshot) => {
      if (snapshot) restoreTaskLists(queryClient, snapshot);
      message.error(getApiErrorMessage(error));
    },
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
// NGƯỜI DÙNG
// ==========================================
/**
 * Danh sách người để gán việc, kèm cách tra id -> email.
 *
 * Chỉ bật cho ADMIN: endpoint trả 403 với người thường, gọi rồi nuốt lỗi chỉ
 * tổ tốn một request và một dòng đỏ trong console.
 *
 * `labelFor` trả lại chính id khi chưa tra được — thà hiện chuỗi id còn hơn
 * hiện ô trống làm người dùng tưởng việc không có ai nhận.
 */
export function useAssignableUsers(enabled: boolean) {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.list(),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const users = useMemo(() => query.data ?? [], [query.data]);
  const emailById = useMemo(
    () => new Map(users.map((u) => [u.id, u.email])),
    [users],
  );

  return {
    users,
    isLoading: query.isLoading,
    labelFor: (id?: string | null) => (id ? (emailById.get(id) ?? id) : ""),
  };
}

// ==========================================
// NHÃN
// ==========================================
/**
 * Nhãn của dự án đang mở, tra theo id.
 *
 * `/tasks` chỉ trả `labelIds`; tên và màu nằm ở `/boards/me/labels`. Cố tình
 * không nhét tên+màu vào từng task: một nhãn dùng ở 200 việc thì cùng một
 * chuỗi bị gửi lại 200 lần.
 *
 * Nhãn thuộc BẢNG, mà mỗi dự án một bảng — nên khoá cache có `projectId`, đổi
 * dự án là tra bảng khác.
 */
export function useBoardLabels() {
  const projectId = useProjectScope();
  const query = useQuery({
    queryKey: ["board", "labels", projectId],
    queryFn: () => boardApi.labels(projectId ?? undefined),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const labelById = useMemo(
    () => new Map((query.data ?? []).map((label) => [label.id, label])),
    [query.data],
  );

  return { labels: query.data ?? [], labelById };
}

export function useCreateBoardLabel() {
  const queryClient = useQueryClient();
  const projectId = useProjectScope();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (input: { name: string; color: string; icon?: string | null }) => {
      const cachedLabels = queryClient.getQueryData<BoardLabel[]>(["board", "labels", projectId]);
      let boardId = cachedLabels?.[0]?.boardId;
      if (!boardId) {
        const snap = queryClient.getQueryData<BoardSnapshot>(["board", "snapshot"]);
        boardId = snap?.board?.id;
      }
      if (!boardId) {
        const snap = await boardApi.snapshot(projectId ?? undefined);
        boardId = snap.board.id;
      }
      return boardApi.createLabel(boardId, input);
    },
    onSuccess: (newLabel) => {
      message.success(`Đã tạo nhãn "${newLabel.name}"`);
      queryClient.setQueryData<BoardLabel[]>(
        ["board", "labels", projectId],
        (old) => (old ? [...old, newLabel] : [newLabel]),
      );
      queryClient.setQueryData<BoardSnapshot>(["board", "snapshot"], (snap) => {
        if (!snap) return snap;
        return {
          ...snap,
          labels: [...snap.labels, newLabel],
        };
      });
      queryClient.invalidateQueries({ queryKey: ["board", "labels"] });
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

export function useZaloRecipients(enabled: boolean) {
  return useQuery({
    queryKey: QK.zaloRecipients,
    queryFn: () => integrationApi.listZaloRecipients(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export { isAdminRole };
