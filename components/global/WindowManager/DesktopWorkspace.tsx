"use client";

import { useWindowMode } from "@/contexts/WindowModeContext";
import {
  Clock,
  Grid3X3,
  LogOut,
  Moon,
  Sun,
  UserCheck,
  LayoutGrid,
  Layers,
  Columns,
  Rows,
  Minimize2,
  Maximize2,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import styles from "./DesktopWorkspace.module.scss";
import MdiWindow from "./MdiWindow";
import ModuleRenderer from "./windowComponents";

export const DesktopWorkspace: React.FC = () => {
  const {
    windows,
    setWindows,
    minimizeWindow,
    focusWindow,
    activeWindowId,
    theme,
    toggleTheme,
  } = useWindowMode();

  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);

  // Time & Date effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setDateString(
        now.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click & ESC to close context menu
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("contextmenu", closeMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTaskbarItemClick = (winId: string, isMin: boolean) => {
    if (isMin) {
      focusWindow(winId);
    } else if (activeWindowId === winId) {
      minimizeWindow(winId);
    } else {
      focusWindow(winId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Show context menu if right clicked on the desktop background/grid overlay/glow orbs
    const isWorkspaceBackground =
      target.classList.contains(styles.desktopWrapper) ||
      target.classList.contains(styles.desktopGridOverlay) ||
      target.classList.contains(styles.glowOrb1) ||
      target.classList.contains(styles.glowOrb2);

    if (isWorkspaceBackground) {
      e.preventDefault();
      e.stopPropagation();

      const menuWidth = 230;
      const menuHeight = 280; // Safe height estimation of the menu items

      let x = e.clientX;
      let y = e.clientY;

      // Subtract bottom taskbar (48px) and add a safe padding
      const maxUsableHeight = window.innerHeight - 48;

      // Flip or shift positions if context menu overflows the viewport edges
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > maxUsableHeight) {
        y = maxUsableHeight - menuHeight - 10;
      }

      // Safeguard against negative coordinates
      x = Math.max(10, x);
      y = Math.max(10, y);

      setContextMenu({
        visible: true,
        x,
        y,
      });
    } else {
      setContextMenu(null);
    }
  };

  // Window arrangement algorithms
  const arrangeWindows = (
    layoutType: "grid" | "cascade" | "sideBySide" | "stacked",
  ) => {
    if (!desktopRef.current || windows.length === 0) return;

    const rect = desktopRef.current.getBoundingClientRect();
    const desktopWidth = rect.width;
    // Account for taskbar height (48px)
    const desktopHeight = rect.height - 48;

    const count = windows.length;
    let newWindows = [...windows];

    const margin = 20;
    const startX = margin;
    const startY = margin;
    const availWidth = desktopWidth - margin * 2;
    const availHeight = desktopHeight - margin * 2;

    if (layoutType === "cascade") {
      const baseWidth = Math.min(availWidth * 0.6, 800);
      const baseHeight = Math.min(availHeight * 0.65, 550);
      const offset = 30;

      newWindows = windows.map((win, idx) => {
        const maxOffsetCols =
          Math.floor((availWidth - baseWidth) / offset) || 1;
        const maxOffsetRows =
          Math.floor((availHeight - baseHeight) / offset) || 1;
        const offsetIndex = idx % Math.min(maxOffsetCols, maxOffsetRows, 8);

        const x = startX + offsetIndex * offset;
        const y = startY + offsetIndex * offset;

        return {
          ...win,
          x,
          y,
          w: baseWidth,
          h: baseHeight,
          isMinimized: false,
          isMaximized: false,
          zIndex: 20 + idx,
        };
      });
    } else if (layoutType === "grid") {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);

      const cellWidth = Math.floor(availWidth / cols);
      const cellHeight = Math.floor(availHeight / rows);

      newWindows = windows.map((win, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = startX + col * cellWidth + 6;
        const y = startY + row * cellHeight + 6;
        const w = cellWidth - 12;
        const h = cellHeight - 12;

        return {
          ...win,
          x,
          y,
          w: Math.max(w, 350),
          h: Math.max(h, 220),
          isMinimized: false,
          isMaximized: false,
          zIndex: 20 + idx,
        };
      });
    } else if (layoutType === "sideBySide") {
      const cellWidth = Math.floor(availWidth / count);

      newWindows = windows.map((win, idx) => {
        const x = startX + idx * cellWidth + 6;
        const y = startY + 6;
        const w = cellWidth - 12;
        const h = availHeight - 12;

        return {
          ...win,
          x,
          y,
          w: Math.max(w, 300),
          h: Math.max(h, 200),
          isMinimized: false,
          isMaximized: false,
          zIndex: 20 + idx,
        };
      });
    } else if (layoutType === "stacked") {
      const cellHeight = Math.floor(availHeight / count);

      newWindows = windows.map((win, idx) => {
        const x = startX + 6;
        const y = startY + idx * cellHeight + 6;
        const w = availWidth - 12;
        const h = cellHeight - 12;

        return {
          ...win,
          x,
          y,
          w: Math.max(w, 350),
          h: Math.max(h, 180),
          isMinimized: false,
          isMaximized: false,
          zIndex: 20 + idx,
        };
      });
    }

    setWindows(newWindows);
  };

  const minimizeAll = () => {
    setWindows((prev) => prev.map((win) => ({ ...win, isMinimized: true })));
  };

  const restoreAll = () => {
    setWindows((prev) =>
      prev.map((win) => ({ ...win, isMinimized: false, isMaximized: false })),
    );
  };

  return (
    <div
      ref={desktopRef}
      className={`${styles.desktopWrapper} ${theme === "light" ? styles.themeLight : ""}`}
      onContextMenu={handleContextMenu}
    >
      {/* High-tech grid visual overlay */}
      <div className={styles.desktopGridOverlay} />

      {/* Grid wallpaper elements */}
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      {/* Windows Layer */}
      <div className={styles.windowsContainer}>
        {windows.map((win) => (
          <MdiWindow key={win.id} window={win}>
            <ModuleRenderer moduleCode={win.moduleCode} title={win.title} />
          </MdiWindow>
        ))}
      </div>

      {/* Bottom Taskbar/Dock */}
      <div className={styles.taskbar}>
        <div className={styles.taskbarLeft}>
          <button
            className={`${styles.startBtn} ${startMenuOpen ? styles.startBtnActive : ""}`}
            onClick={() => setStartMenuOpen((o) => !o)}
            title="Hệ thống Task"
          >
            <Grid3X3 size={16} />
            <span>Task Launcher</span>
          </button>
        </div>

        {/* Taskbar Active windows list */}
        <div className={styles.taskbarCenter}>
          <div className={styles.taskList}>
            {windows.map((win) => {
              const isActive = activeWindowId === win.id && !win.isMinimized;
              return (
                <button
                  key={win.id}
                  className={`${styles.taskItem} ${isActive ? styles.taskItemActive : ""} ${
                    win.isMinimized ? styles.taskItemMinimized : ""
                  }`}
                  onClick={() =>
                    handleTaskbarItemClick(win.id, win.isMinimized)
                  }
                  title={win.title}
                >
                  <span className={styles.taskDot} />
                  <span className={styles.taskTitle}>{win.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Taskbar clock and stats */}
        <div className={styles.taskbarRight}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={
              theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
            }
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme === "light" ? "#f59e0b" : "#94a3b8",
              padding: "6px",
              borderRadius: "50%",
              transition: "all 0.15s ease",
            }}
          >
            {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className={styles.taskbarDivider} />

          <div className={styles.clockWidget}>
            <Clock size={13} style={{ color: "#00f0ff" }} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <span className={styles.timeText}>{timeString}</span>
              <span className={styles.dateText}>{dateString}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Start launcher Menu dropdown */}
      {startMenuOpen && (
        <>
          <div
            className={styles.startMenuBackdrop}
            onClick={() => setStartMenuOpen(false)}
          />
          <div className={styles.startMenu}>
            <div className={styles.startMenuHeader}>
              <div className={styles.avatar}>PAT</div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#f8fafc",
                    fontSize: "14px",
                  }}
                >
                  Phạm Anh Tú
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Task Administrator
                </div>
              </div>
            </div>

            <div className={styles.startMenuBody}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#475569",
                  padding: "4px 8px",
                  textTransform: "uppercase",
                }}
              >
                Phân hệ nghiệp vụ
              </div>
            </div>

            <div className={styles.startMenuFooter}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                <UserCheck size={14} />
                <span>Quyền: devtu</span>
              </div>
              <button
                className={styles.logoutBtn}
                onClick={() => window.location.reload()}
              >
                <LogOut size={13} />
                <span>Restart</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Custom Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div
          className={`${styles.contextMenu} ${theme === "light" ? styles.themeLight : ""}`}
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.menuHeader}>Sắp xếp cửa sổ</div>

          <button
            className={styles.menuItem}
            onClick={() => {
              arrangeWindows("grid");
              setContextMenu(null);
            }}
          >
            <LayoutGrid size={15} />
            <span>Tự động chia lưới (Grid)</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              arrangeWindows("cascade");
              setContextMenu(null);
            }}
          >
            <Layers size={15} />
            <span>Xếp lớp bậc thang (Cascade)</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              arrangeWindows("sideBySide");
              setContextMenu(null);
            }}
          >
            <Columns size={15} />
            <span>Chia cột song song (Vertical)</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              arrangeWindows("stacked");
              setContextMenu(null);
            }}
          >
            <Rows size={15} />
            <span>Chia hàng song song (Horizontal)</span>
          </button>

          <div className={styles.menuDivider} />

          <button
            className={styles.menuItem}
            onClick={() => {
              restoreAll();
              setContextMenu(null);
            }}
          >
            <Maximize2 size={15} />
            <span>Khôi phục tất cả</span>
          </button>

          <button
            className={`${styles.menuItem} ${styles.dangerItem}`}
            onClick={() => {
              minimizeAll();
              setContextMenu(null);
            }}
          >
            <Minimize2 size={15} />
            <span>Thu nhỏ tất cả</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopWorkspace;
