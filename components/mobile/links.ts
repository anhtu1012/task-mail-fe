"use client";

import { useQuery } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import { BOARD_QUERY_KEY } from "@/components/board/BoardStore";
import { useCurrentProject } from "@/hooks/useProjects";

/**
 * id bảng của dự án đang mở. Dùng chung khoá cache với BoardProvider nên hầu như
 * không tốn thêm lượt gọi — mở bảng rồi là có sẵn.
 */
export function useBoardId(): string | null {
  const { projectId } = useCurrentProject();
  const { data } = useQuery({
    queryKey: BOARD_QUERY_KEY,
    queryFn: () => boardApi.snapshot(projectId ?? undefined),
    enabled: !!projectId,
    staleTime: 30_000,
  });
  return data?.board.id ?? null;
}

/**
 * Link tới trang chi tiết thẻ, kèm nơi quay về khi đóng. Không có `back` thì
 * đóng thẻ là về bảng — đúng cho desktop, nhưng trên mobile mở thẻ từ tab
 * "Hôm nay" hay "Ghi chú" thì phải quay lại đúng tab đó.
 */
export function cardHref(boardId: string, cardId: string, back?: string): string {
  const base = `/boards/${boardId}/cards/${cardId}`;
  return back ? `${base}?back=${encodeURIComponent(back)}` : base;
}
