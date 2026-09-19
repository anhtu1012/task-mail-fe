"use client";

/**
 * Mỗi DỰ ÁN có đúng một bảng, nên trang này chỉ tải bảng của dự án đang mở rồi
 * chuyển hướng thẳng vào. Giữ lại route để sau này một dự án mở nhiều bảng thì
 * đây là chỗ liệt kê, không phải dựng lại từ đầu.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { boardApi } from "@/apis/board.api";
import { useCurrentProject } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/utils/client/apiError";

export default function BoardsIndexPage() {
  const router = useRouter();
  const { projectId } = useCurrentProject();
  const { data, error } = useQuery({
    queryKey: ["board", "snapshot"],
    queryFn: () => boardApi.snapshot(projectId ?? undefined),
    enabled: !!projectId,
  });

  const boardId = data?.board.id;
  useEffect(() => {
    if (boardId) router.replace(`/boards/${boardId}`);
  }, [boardId, router]);

  if (error) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <div>
          <div className="font-semibold text-[15px] text-[#333]">
            Không tải được bảng công việc
          </div>
          <div className="text-[13px] text-[#808080] mt-1">
            {getApiErrorMessage(error)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid place-items-center py-20">
      <Spin size="large" />
    </div>
  );
}
