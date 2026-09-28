/**
 * Tải snapshot bảng và nhân tiện nạp sẵn cache dự án / loại việc / nhãn.
 *
 * `/boards/me/full?include=projects,taskTypes` trả luôn đúng dữ liệu của
 * `GET /projects?includeArchived=false` và `GET /task-types` (cùng cấu trúc),
 * còn `labels` thì `/full` vốn đã có. Đổ chúng vào đúng khoá cache của
 * `useProjects` / `useTaskTypes` / `useBoardLabels` thì các hook đó thấy dữ
 * liệu còn tươi và KHÔNG tự gọi endpoint riêng nữa — component không phải sửa.
 *
 * Mục đích là bớt request (mỗi request giữ một kết nối DB phía backend), không
 * phải cho nhanh hơn. Xem task-mail-be/docs/fe-bootstrap-endpoint.md.
 *
 * Mọi nơi dùng `BOARD_QUERY_KEY` phải đi qua hàm này, để một lần refetch nào
 * cũng làm tươi luôn ba cache kia.
 */
import type { QueryClient } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import { BoardSnapshot } from "@/models/board";
import { PROJECT_QK } from "./useProjects";
import { QK, boardLabelsKey } from "./useTaskApp";

export async function loadBoardSnapshot(
  queryClient: QueryClient,
  projectId: string | undefined,
): Promise<BoardSnapshot> {
  const { projects, taskTypes, ...snapshot } = await boardApi.snapshotWith(
    ["projects", "taskTypes"],
    projectId,
  );

  if (projects) {
    queryClient.setQueryData(PROJECT_QK.list(false), projects);
  }
  if (taskTypes) {
    queryClient.setQueryData(QK.taskTypes, taskTypes);
  }
  if (projectId) {
    queryClient.setQueryData(boardLabelsKey(projectId), snapshot.labels);
  }

  return snapshot;
}
