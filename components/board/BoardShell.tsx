"use client";

import { useEffect } from "react";
import { useBoard } from "./BoardStore";
import { BoardWorkspace } from "./BoardWorkspace";
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
  const { fullscreen, setFullscreen, paletteOpen } = useBoard();

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
        <BoardWorkspace />
      </div>
    </div>
  );
}
