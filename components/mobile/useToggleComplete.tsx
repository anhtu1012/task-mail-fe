"use client";

import { useCallback } from "react";
import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import { CardSummary } from "@/models/board";
import { getApiErrorMessage } from "@/utils/client/apiError";

/**
 * Tick hoàn thành / mở lại ở những màn nằm NGOÀI bảng (tab Hôm nay, bảng
 * mobile dùng BoardStore nên không cần hook này). Không có lịch sử Ctrl+Z ở
 * đây, nên đền lại bằng nút "Hoàn tác" ngay trên thông báo.
 */
export function useToggleComplete() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    [["board"], ["tasks"], ["task-stats"]].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    );
  }, [queryClient]);

  return useCallback(
    async (card: CardSummary) => {
      const wasDone = card.completedAt !== null;
      try {
        if (wasDone) await boardApi.reopenCard(card.id);
        else await boardApi.completeCard(card.id);
        refresh();
        const key = `toggle-${card.id}`;
        message.open({
          key,
          type: "success",
          duration: 5,
          content: (
            <span className="inline-flex items-center gap-3">
              {wasDone ? "Đã mở lại việc" : "Đã hoàn thành"}
              <button
                type="button"
                className="border-0 bg-transparent p-0 font-semibold cursor-pointer"
                style={{ color: "#0a436d" }}
                onClick={() => {
                  message.destroy(key);
                  const revert = wasDone
                    ? boardApi.completeCard(card.id, true)
                    : boardApi.reopenCard(card.id, true);
                  revert.then(refresh).catch((e) => message.error(getApiErrorMessage(e)));
                }}
              >
                Hoàn tác
              </button>
            </span>
          ),
        });
      } catch (error) {
        message.error(getApiErrorMessage(error));
      }
    },
    [message, refresh],
  );
}
