"use client";
/**
 * React Query + Redux hooks cho Dự án.
 *
 * `useCurrentProject()` là hook quan trọng nhất trong file: mọi trang, mọi
 * truy vấn task/board đều lấy `projectId` từ đây. Nó cũng tự dọn lựa chọn cũ
 * trong ba trường hợp dễ sinh dữ liệu "ma":
 *   1. đổi tài khoản trên cùng trình duyệt (id dự án cũ thuộc người khác);
 *   2. dự án đang mở đã bị xoá;
 *   3. dự án đang mở vừa bị lưu trữ.
 * Cả ba đều dẫn tới `needsSelection = true` -> layout đẩy về /select-project.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { projectApi } from "@/apis/project.api";
import {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/models/project";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCurrentProject, setCurrentProject } from "@/store/slices/project";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { getCookie } from "@/utils/client/getCookie";
import { useMe } from "./useTaskApp";

export const PROJECT_QK = {
  all: ["projects"] as const,
  list: (includeArchived: boolean) => ["projects", { includeArchived }] as const,
};

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: PROJECT_QK.list(includeArchived),
    queryFn: () => projectApi.list({ includeArchived }),
    enabled: typeof window !== "undefined" && !!getCookie("accessToken"),
    // Danh sách dự án hiếm khi đổi — đừng tốn lượt gọi trong trần 20 req/60s
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export type CurrentProject = {
  projectId: string | null;
  project: Project | null;
  projects: Project[];
  isLoading: boolean;
  /** Lỗi tải danh sách dự án — backend sập, mất mạng... */
  error: unknown;
  /** true = phải đưa người dùng sang trang chọn dự án */
  needsSelection: boolean;
  /** true = người dùng chưa có dự án nào -> mời tạo dự án đầu tiên */
  isEmpty: boolean;
  refetch: () => void;
};

export function useCurrentProject(): CurrentProject {
  const dispatch = useAppDispatch();
  const { data: me } = useMe();
  const { data, isLoading, error, refetch } = useProjects();

  const { currentProjectId, ownerUserId } = useAppSelector((s) => s.project);
  const projects = useMemo(() => data?.items ?? [], [data]);

  // Lựa chọn cũ thuộc tài khoản khác -> vứt bỏ trước khi kịp dùng để gọi API
  const staleOwner = !!currentProjectId && !!me && ownerUserId !== me.id;
  const project = staleOwner
    ? null
    : (projects.find((p) => p.id === currentProjectId) ?? null);

  useEffect(() => {
    if (staleOwner) {
      dispatch(clearCurrentProject());
      return;
    }
    // Chỉ dọn khi danh sách đã tải xong, nếu không sẽ xoá nhầm lúc đang tải
    if (currentProjectId && !isLoading && data && !project) {
      dispatch(clearCurrentProject());
    }
  }, [staleOwner, currentProjectId, isLoading, data, project, dispatch]);

  return {
    projectId: project?.id ?? null,
    project,
    projects,
    isLoading,
    error,
    // Cố tình KHÔNG đòi `data` phải có: tải lỗi (backend sập, mất mạng) cũng
    // phải đẩy về trang chọn dự án. Đó là nơi duy nhất nói được cho người dùng
    // biết vì sao không vào được, thay vì để họ nhìn một màn hình trống.
    needsSelection: !isLoading && !project,
    isEmpty: !isLoading && !!data && projects.length === 0,
    refetch: () => void refetch(),
  };
}

/**
 * Đổi dự án đang mở.
 *
 * Xoá sạch cache của task/board chứ không chỉ đánh dấu cũ: dữ liệu dự án trước
 * mà còn nằm lại trong cache thì người dùng sẽ thấy việc của dự án A trong vài
 * trăm mili giây sau khi đã chuyển sang B — nhìn như lộ dữ liệu.
 */
export function useSwitchProject() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  return useCallback(
    (projectId: string) => {
      if (!me) return;
      dispatch(setCurrentProject({ projectId, userId: me.id }));
      ["tasks", "task", "task-stats", "board", "agenda"].forEach((key) =>
        queryClient.removeQueries({ queryKey: [key] }),
      );
    },
    [dispatch, me, queryClient],
  );
}

/** Dùng khi đăng xuất — để lần đăng nhập sau phải chọn lại */
export function useClearProject() {
  const dispatch = useAppDispatch();
  return useCallback(() => dispatch(clearCurrentProject()), [dispatch]);
}

// ==========================================
// GHI
// ==========================================
function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PROJECT_QK.all });
}

export function useCreateProject() {
  const { message } = App.useApp();
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectApi.create(input),
    onSuccess: (project) => {
      message.success(`Đã tạo dự án ${project.name}`);
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useUpdateProject() {
  const { message } = App.useApp();
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectApi.update(id, input),
    onSuccess: () => {
      message.success("Đã cập nhật dự án");
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useSetDefaultProject() {
  const { message } = App.useApp();
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id: string) => projectApi.setDefault(id),
    onSuccess: (project) => {
      message.success(`${project.name} là dự án mặc định khi đăng nhập`);
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useArchiveProject() {
  const { message } = App.useApp();
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      projectApi.setArchived(id, archived),
    onSuccess: (_, { archived }) => {
      message.success(archived ? "Đã lưu trữ dự án" : "Đã mở lại dự án");
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}

export function useDeleteProject() {
  const { message } = App.useApp();
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      message.success("Đã xoá dự án");
      invalidate();
    },
    onError: (error) => message.error(getApiErrorMessage(error)),
  });
}
