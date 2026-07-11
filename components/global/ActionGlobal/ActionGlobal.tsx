/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button, Tooltip } from "antd";
import * as LucideIcons from "lucide-react";
import styles from "./ActionGlobal.module.scss";
import ActionFilterModal from "./ActionFilterModal";

import { FormFieldSchema } from "../FormDynamic/FormDynamic";

export type FilterField = FormFieldSchema;

/**
 * Cấu hình cho mỗi hành động (action) trong ActionGlobal
 */
export interface ActionGlobalItem {
  id: string;
  label: string;
  /** Tên icon từ lucide-react (ví dụ: 'Save', 'Trash', 'Plus') */
  icon?: keyof typeof LucideIcons;
  /** Loại button (Ant Design & Task Semantic Types) */
  type?:
    | "primary"
    | "default"
    | "dashed"
    | "link"
    | "text"
    | "success"
    | "warning"
    | "error"
    | "danger"
    | "info"
    | "secondary"
    | "dark"
    | "light"
    | "gradient";
  /** Vô hiệu hóa button */
  disabled?: boolean;
  /** Ẩn button */
  hidden?: boolean;
  /** Có phải là đường kẻ dọc phân cách không */
  isDivider?: boolean;
  /** Tooltip khi hover */
  tooltip?: string;
  /**
   * Phím tắt kết hợp với Ctrl (ví dụ: "S" → Ctrl+S, "N" → Ctrl+N).
   * Sẽ hiển thị badge phím tắt trên button và lắng nghe keyboard event toàn cục.
   */
  shortcut?: string;
  /** Key dùng để phân biệt khi xử lý onAction, hoặc dùng trực tiếp onClick */
  onClick?: () => void;
  /** Trạng thái active (dùng cho các nút toggle/chế độ) */
  isActive?: boolean;
  /** Component tuỳ chỉnh (nếu có, sẽ bỏ qua render button mặc định) */
  component?: React.ReactNode;
}

interface ActionGlobalProps {
  /** Danh sách cấu hình actions (thường được lấy từ JSON/state của mỗi màn hình) */
  actions: ActionGlobalItem[];
  /** Hàm callback chung khi một action được click (nếu không dùng onClick riêng trong config) */
  onAction?: (actionId: string, action: ActionGlobalItem) => void;
  className?: string;

  /** Hiển thị nút bộ lọc (mặc định: true) */
  showFilter?: boolean;
  /** Phím tắt Ctrl + ? để mở bộ lọc (mặc định: "F") */
  filterShortcut?: string;
  /** Cấu hình các trường dữ liệu cho bộ lọc JSON */
  filterConfig?: FilterField[];
  /** Giá trị mặc định cho bộ lọc */
  filterInitialValues?: Record<string, any>;
  /** Callback khi người dùng ấn Áp dụng bộ lọc */
  onFilterApply?: (filterData: Record<string, any>) => void;
}

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Badge phím tắt dùng trong Tooltip: Ctrl + X */
function ShortcutBadge({ shortcut }: { shortcut: string }) {
  return (
    <span className={styles.shortcutBadge}>
      <span className={styles.shortcutKey}>Ctrl</span>
      <span className={styles.shortcutPlus}>+</span>
      <span className={styles.shortcutKey}>{shortcut.toUpperCase()}</span>
    </span>
  );
}

/** Chip key nhỏ gọn hiển thị inline trong nút chế độ Đầy đủ */
function ShortcutChip({ shortcut }: { shortcut: string }) {
  return <span className={styles.shortcutChip}>{shortcut.toUpperCase()}</span>;
}

export type DisplayMode = "simple" | "full";

const ActionGlobal: React.FC<ActionGlobalProps> = ({
  actions = [],
  onAction,
  className,
  showFilter = true,
  filterShortcut = "F",
  filterConfig = [],
  filterInitialValues,
  onFilterApply,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("simple");
  const isFullMode = displayMode === "full";
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Tìm portal root sau khi DOM sẵn sàng (bất đồng bộ để tránh cascading render warning)
  useEffect(() => {
    if (!mounted) return;

    let timerId: NodeJS.Timeout;
    let retries = 0;

    const checkPortal = () => {
      const el = document.getElementById("action-global-portal-root");
      if (el) {
        setPortalRoot(el);
      } else if (retries < 20) {
        retries++;
        timerId = setTimeout(checkPortal, 50);
      } else {
        console.warn(
          "ActionGlobal: Không tìm thấy #action-global-portal-root trong DOM.",
        );
      }
    };

    checkPortal();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [mounted]);

  // ── Global keyboard shortcut listener ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (
        ["input", "textarea", "select"].includes(tag) ||
        target.isContentEditable
      ) {
        return;
      }

      if (!e.ctrlKey) return;

      const key = e.key.toUpperCase();

      if (
        showFilter &&
        filterShortcut &&
        key === filterShortcut.toUpperCase()
      ) {
        e.preventDefault();
        setIsFilterOpen((prev) => !prev);
        return;
      }

      const matchedAction = actions.find(
        (a) =>
          !a.hidden &&
          !a.disabled &&
          !a.isDivider &&
          a.shortcut &&
          a.shortcut.toUpperCase() === key,
      );

      if (matchedAction) {
        e.preventDefault();
        if (matchedAction.onClick) {
          matchedAction.onClick();
        } else if (onAction) {
          onAction(matchedAction.id, matchedAction);
        }
      }
    },
    [actions, onAction, showFilter, filterShortcut],
  );

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  // ───────────────────────────────────────────────────────────────────────────

  if (!mounted || !portalRoot) return null;

  const visibleActions = actions.filter((a) => !a.hidden);

  if (visibleActions.length === 0 && !showFilter) return null;

  // ── Render một action item ────────────────────────────────────────────────
  const renderAction = (action: ActionGlobalItem, index: number) => {
    if (action.isDivider) {
      return (
        <div key={action.id || `div-${index}`} className={styles.divider} />
      );
    }

    if (action.component) {
      return (
        <React.Fragment key={action.id || `comp-${index}`}>
          {action.component}
        </React.Fragment>
      );
    }

    const IconComponent = action.icon
      ? (LucideIcons[action.icon] as React.ElementType)
      : null;

    const handleClick = () => {
      if (action.onClick) {
        action.onClick();
      } else if (onAction) {
        onAction(action.id, action);
      }
    };

    const isErrorOrDanger = action.type === "error" || action.type === "danger";

    const semanticTypes = [
      "success",
      "warning",
      "error",
      "danger",
      "info",
      "secondary",
      "dark",
      "light",
      "gradient",
    ];
    const isSemanticType = action.type && semanticTypes.includes(action.type);

    if (!isFullMode) {
      // ── Chế độ GỌN: flat icon-only + tooltip ─────────────────────────
      let btnClass = styles.actionBtn;
      if (isErrorOrDanger) {
        btnClass += ` ${styles.actionBtnError}`;
      } else if (action.type && isSemanticType) {
        const typeCapitalized =
          action.type.charAt(0).toUpperCase() + action.type.slice(1);
        const variantClass = styles[`actionBtn${typeCapitalized}`];
        if (variantClass) {
          btnClass += ` ${variantClass}`;
        }
      }

      if (action.isActive) {
        btnClass += ` ${styles.actionBtnActive}`;
      }

      const antdType = isSemanticType ? "text" : action.type || "text";

      return (
        <Tooltip
          key={action.id}
          title={
            <span className={styles.tooltipContent}>
              <span>{action.tooltip || action.label}</span>
              {action.shortcut && <ShortcutBadge shortcut={action.shortcut} />}
            </span>
          }
          placement="bottom"
          mouseEnterDelay={0.4}
        >
          <Button
            type={antdType as any}
            danger={isErrorOrDanger}
            disabled={action.disabled}
            icon={
              IconComponent ? (
                <IconComponent size={15} strokeWidth={1.8} />
              ) : undefined
            }
            onClick={handleClick}
            className={btnClass}
          />
        </Tooltip>
      );
    }

    // ── Chế độ ĐẦY ĐỦ: variant chip button ──────────────────────────
    let btnClass = styles.actionBtnFull;
    if (isErrorOrDanger) {
      btnClass += ` ${styles.actionBtnFullError}`;
    } else if (action.type && isSemanticType) {
      const typeCapitalized =
        action.type.charAt(0).toUpperCase() + action.type.slice(1);
      const variantClass = styles[`actionBtnFull${typeCapitalized}`];
      if (variantClass) {
        btnClass += ` ${variantClass}`;
      }
    }

    if (action.isActive) {
      btnClass += ` ${styles.actionBtnFullActive}`;
    }

    const antdType = isSemanticType ? "default" : action.type || "default";

    const btn = (
      <Button
        key={action.id}
        type={antdType as any}
        danger={isErrorOrDanger}
        disabled={action.disabled}
        icon={
          IconComponent ? (
            <IconComponent size={13} strokeWidth={1.8} />
          ) : undefined
        }
        onClick={handleClick}
        className={btnClass}
      >
        <span className={styles.actionLabel}>{action.label}</span>
        {action.shortcut && <ShortcutChip shortcut={action.shortcut} />}
      </Button>
    );

    if (action.tooltip) {
      return (
        <Tooltip
          key={action.id}
          title={
            <span className={styles.tooltipContent}>
              <span>{action.tooltip}</span>
              {action.shortcut && <ShortcutBadge shortcut={action.shortcut} />}
            </span>
          }
          placement="bottom"
          mouseEnterDelay={0.4}
        >
          {btn}
        </Tooltip>
      );
    }

    return <React.Fragment key={action.id}>{btn}</React.Fragment>;
  };

  // ── Render nút Bộ lọc ────────────────────────────────────────────────────
  const renderFilter = () => {
    if (!showFilter) return null;

    if (!isFullMode) {
      return (
        <>
          {visibleActions.length > 0 && <div className={styles.divider} />}
          <Tooltip
            title={
              <span className={styles.tooltipContent}>
                <span>Bộ lọc</span>
                {filterShortcut && <ShortcutBadge shortcut={filterShortcut} />}
              </span>
            }
            placement="bottom"
            mouseEnterDelay={0.4}
          >
            <Button
              type="text"
              icon={
                <LucideIcons.SlidersHorizontal size={15} strokeWidth={1.8} />
              }
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`${styles.actionBtn} ${isFilterOpen ? styles.filterActive : ""}`}
            />
          </Tooltip>
        </>
      );
    }

    return (
      <>
        {visibleActions.length > 0 && <div className={styles.divider} />}
        <Button
          type="default"
          icon={<LucideIcons.SlidersHorizontal size={13} strokeWidth={1.8} />}
          onClick={() => setIsFilterOpen((v) => !v)}
          className={`${styles.actionBtnFull} ${isFilterOpen ? styles.filterActive : ""}`}
        >
          <span className={styles.actionLabel}>Bộ lọc</span>
          {filterShortcut && <ShortcutChip shortcut={filterShortcut} />}
        </Button>
      </>
    );
  };

  const content = (
    <>
      <div className={`${styles.actionGlobalContainer} ${className || ""}`}>
        {/* ── Vùng actions — cuộn ngang nếu tràn ─────────────────────────── */}
        <div className={styles.actionsArea}>
          {visibleActions.map((action, index) => renderAction(action, index))}
          {renderFilter()}
        </div>

        {/* ── Vùng toggle cố định bên phải ──────────────────────────────── */}
        <div className={styles.toggleArea}>
          <div
            className={styles.modeToggle}
            role="group"
            aria-label="Chế độ hiển thị"
          >
            <button
              className={`${styles.modeBtn} ${!isFullMode ? styles.modeBtnActive : ""}`}
              onClick={() => setDisplayMode("simple")}
              aria-pressed={!isFullMode}
              title="Gọn — chỉ hiện icon"
            >
              <LucideIcons.LayoutGrid size={11} strokeWidth={2} />
              Gọn
            </button>
            <button
              className={`${styles.modeBtn} ${isFullMode ? styles.modeBtnActive : ""}`}
              onClick={() => setDisplayMode("full")}
              aria-pressed={isFullMode}
              title="Đầy đủ — hiện nhãn và phím tắt"
            >
              <LucideIcons.AlignLeft size={11} strokeWidth={2} />
              Đầy đủ
            </button>
          </div>
        </div>
      </div>

      <ActionFilterModal
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(values) => {
          onFilterApply?.(values);
          setIsFilterOpen(false);
        }}
        config={filterConfig}
        initialValues={filterInitialValues}
      />
    </>
  );

  return createPortal(content, portalRoot);
};

export default ActionGlobal;
