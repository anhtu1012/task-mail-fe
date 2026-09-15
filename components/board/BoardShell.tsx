"use client";

import { useEffect } from "react";
import { Spin } from "antd";
import { RotateCw, TriangleAlert } from "lucide-react";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { useBoard } from "./BoardStore";
import { BoardWorkspace } from "./BoardWorkspace";
import { G } from "./ui";
import styles from "./board.module.scss";

/**
 * Khung của bảng.
 *
 * Mặc định tràn hết vùng Content của layout hệ thống (bù padding 24px bằng
 * margin âm). Bật "Toàn màn hình" (nút trên thanh công cụ, hoặc phím F) thì
 * chuyển sang position:fixed phủ luôn sidebar và header — thoát bằng Esc.
 * Lựa chọn này được nhớ lại cho lần mở sau.
 */
export function BoardShell() {
  const { fullscreen, setFullscreen, paletteOpen, isLoading, error, refetch } = useBoard();

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      // Esc lúc bảng lệnh đang mở là để đóng bảng lệnh, không phải thoát toàn màn hình
      if (e.key === "Escape" && !paletteOpen) setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, setFullscreen, paletteOpen]);

  return (
    <div className={`${styles.boardRoot} ${fullscreen ? styles.boardFullscreen : ""}`}>
      {/* Lớp phủ tối trên ảnh nền — thiếu nó thì chữ trắng trên kính không đọc được */}
      <div className={styles.backdrop} />

      <div className={`${styles.boardLayer} flex flex-col`}>
        {error ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
        ) : isLoading ? (
          <LoadingState />
        ) : (
          <BoardWorkspace />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Spin size="large" />
        <span className="text-[13px]" style={{ color: G.textMuted }}>
          Đang tải bảng công việc...
        </span>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 grid place-items-center px-6">
      <div
        className={`${styles.glassPanel} max-w-[420px] w-full px-6 py-6 text-center flex flex-col items-center gap-3`}
      >
        <span
          className="grid place-items-center size-12 rounded-full"
          style={{ background: G.dangerFill, color: G.danger }}
        >
          <TriangleAlert size={22} />
        </span>
        <div className="font-semibold text-[15px]" style={{ color: G.text }}>
          Không tải được bảng công việc
        </div>
        <div className="text-[13px] leading-relaxed" style={{ color: G.textMuted }}>
          {message}
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border-0 cursor-pointer
            text-[13px] font-medium"
          style={{ background: "rgba(190,224,244,.92)", color: "#062b47" }}
        >
          <RotateCw size={15} /> Thử lại
        </button>
      </div>
    </div>
  );
}
