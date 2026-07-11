"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Activity,
  MonitorCheck,
  LayoutGrid,
  Ship,
  RefreshCw,
  Compass,
  HardHat,
  History,
  BarChart3,
  Network,
  Receipt,
  ShieldCheck,
  Cpu,
  TrendingUp,
  ScanEye,
  Search,
  ChevronRight,
  AppWindow,
} from "lucide-react";
import CModal from "@/components/ui/CModal";
import { CButton, CSegmented } from "@/components/ui";
import styles from "./SubsystemModal.module.scss";

interface SubsystemModalProps {
  open: boolean;
  onClose: () => void;
}

// Module list data matching page.tsx
const rawModules = [
  {
    moduleCode: "CA",
    moduleName: "Category",
    sort: 0,
    parent: "Management",
  },
  {
    moduleCode: "OM",
    moduleName: "Operation Management",
    sort: 1,
    parent: "Operation",
  },
  {
    moduleCode: "MC",
    moduleName: "Monitoring and Control",
    sort: 2,
    parent: "Operation",
  },
  {
    moduleCode: "YARD",
    moduleName: "Yard Planning",
    sort: 3,
    parent: "Planning",
  },
  {
    moduleCode: "SHIP",
    moduleName: "Ship Planning",
    sort: 4,
    parent: "Planning",
  },
  {
    moduleCode: "CD",
    moduleName: "Change Data",
    sort: 5,
    parent: "Management",
  },
  {
    moduleCode: "BERTH",
    moduleName: "Berth Planning",
    sort: 6,
    parent: "Planning",
  },
  {
    moduleCode: "SO",
    moduleName: "Site Operation",
    sort: 6,
    parent: "Operation",
  },
  {
    moduleCode: "HIS",
    moduleName: "His Viewer",
    sort: 7,
    parent: "Management",
  },
  {
    moduleCode: "RP",
    moduleName: "Statistical Report",
    sort: 8,
    parent: "Management",
  },
  {
    moduleCode: "EDI",
    moduleName: "Electronic Data Interchange",
    sort: 9,
    parent: "Operation",
  },
  {
    moduleCode: "BILLING",
    moduleName: "Billing",
    sort: 10,
    parent: "Operation",
  },
  {
    moduleCode: "SA",
    moduleName: "System Administrator",
    sort: 11,
    parent: "Management",
  },
];

// Lucide icon mapping
const getModuleIcon = (code: string) => {
  switch (code.toUpperCase()) {
    case "CA":
      return FolderOpen;
    case "OM":
      return Activity;
    case "MC":
      return MonitorCheck;
    case "YARD":
      return LayoutGrid;
    case "SHIP":
      return Ship;
    case "CD":
      return RefreshCw;
    case "BERTH":
      return Compass;
    case "SO":
      return HardHat;
    case "HIS":
      return History;
    case "RP":
      return BarChart3;
    case "EDI":
      return Network;
    case "BILLING":
      return Receipt;
    case "SA":
      return ShieldCheck;
    case "AE":
      return Cpu;
    case "PP":
      return TrendingUp;
    case "OI":
      return ScanEye;
    default:
      return FolderOpen;
  }
};

// Premium bright-theme color configuration
const getCategoryTheme = (parent: string) => {
  switch (parent.toLowerCase()) {
    case "management":
      return {
        primary: "#0d9488", // Cyber Teal
        bg: "rgba(13, 148, 136, 0.08)",
        bgLight: "rgba(13, 148, 136, 0.03)",
        text: "#0d9488",
        glow: "rgba(20, 184, 166, 0.25)",
        badgeBg: "rgba(13, 148, 136, 0.06)",
        label: "Quản Lý Hệ Thống",
      };
    case "planning":
      return {
        primary: "#c57205ff", // Royal Violet
        bg: "rgba(139, 92, 246, 0.08)",
        bgLight: "rgba(139, 92, 246, 0.03)",
        text: "#c57205ff",
        glow: "rgba(167, 139, 250, 0.25)",
        badgeBg: "rgba(139, 92, 246, 0.06)",
        label: "Kế Hoạch & Thiết Lập",
      };
    case "operation":
      return {
        primary: "#0284c7", // Ocean Blue
        bg: "rgba(2, 132, 199, 0.08)",
        bgLight: "rgba(2, 132, 199, 0.03)",
        text: "#0284c7",
        glow: "rgba(56, 189, 248, 0.25)",
        badgeBg: "rgba(2, 132, 199, 0.06)",
        label: "Vận Hành Hiện Trường",
      };
    case "artificial intelligence":
      return {
        primary: "#ec4899", // Cyber Pink
        bg: "rgba(236, 72, 153, 0.08)",
        bgLight: "rgba(236, 72, 153, 0.03)",
        text: "#db2777",
        glow: "rgba(244, 114, 182, 0.25)",
        badgeBg: "rgba(236, 72, 153, 0.06)",
        label: "AI & Tự Động Hóa",
      };
    default:
      return {
        primary: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        bgLight: "rgba(100, 116, 139, 0.03)",
        text: "#64748b",
        glow: "rgba(100, 116, 139, 0.2)",
        badgeBg: "rgba(100, 116, 139, 0.06)",
        label: "Khác",
      };
  }
};

const CATEGORIES_LIST = [
  { parent: "Management", label: "Quản Lý Hệ Thống" },
  { parent: "Planning", label: "Kế Hoạch & Thiết Lập" },
  { parent: "Operation", label: "Vận Hành Hiện Trường" },
  { parent: "Artificial Intelligence", label: "AI & Tự Động Hóa" },
];

const SubsystemModal: React.FC<SubsystemModalProps> = ({ open, onClose }) => {
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to check if a module matches search query
  const isModuleMatching = (item: (typeof rawModules)[0]) => {
    if (!searchQuery.trim()) return true;
    return (
      item.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.parent.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Helper to check if a category has any matches
  const categoryHasMatches = (parent: string) => {
    if (!searchQuery.trim()) return true;
    const columnModules = rawModules.filter(
      (m) => m.parent.toLowerCase() === parent.toLowerCase(),
    );
    return columnModules.some(isModuleMatching);
  };

  // All categories that actually contain at least 1 module (constant list)
  const activeCategories = useMemo(() => {
    return CATEGORIES_LIST.filter((cat) =>
      rawModules.some(
        (m) => m.parent.toLowerCase() === cat.parent.toLowerCase(),
      ),
    );
  }, []);

  const totalMatches = useMemo(() => {
    return rawModules.filter(isModuleMatching).length;
  }, [searchQuery]);

  // Responsive columns helper
  const getColsClass = (count: number) => {
    switch (count) {
      case 3:
        return styles.gridCols3;
      case 2:
        return styles.gridCols2;
      case 1:
        return styles.gridCols1;
      case 4:
      default:
        return styles.gridCols4;
    }
  };

  const renderModuleCard = (item: (typeof rawModules)[0]) => {
    const theme = getCategoryTheme(item.parent);
    const IconComp = getModuleIcon(item.moduleCode);
    const matches = isModuleMatching(item);

    const cardClass = `${styles.moduleCard} ${
      searchQuery.trim() && !matches ? styles.moduleCardDimmed : ""
    }`.trim();

    return (
      <Link
        href={`/${item.moduleCode.toLowerCase()}`}
        key={item.moduleCode}
        className={cardClass}
        style={
          {
            "--theme-color": theme.primary,
            "--icon-bg": theme.bg,
            "--badge-bg": theme.badgeBg,
            "--glow-color": theme.glow,
            textDecoration: "none",
          } as React.CSSProperties
        }
        onClick={onClose}
      >
        <div className={styles.cardLeft}>
          <div className={styles.iconBox}>
            <IconComp size={22} className={styles.iconElement} />
          </div>
        </div>

        <div className={styles.cardRight}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitle}>{item.moduleName}</h3>
            <span
              className={styles.categoryTag}
              style={{ color: theme.primary, backgroundColor: theme.badgeBg }}
            >
              {item.moduleCode}
            </span>
          </div>

          <div className={styles.cardStatusRow}>
            <div className={styles.statusIndicator}>
              <span
                className={`${styles.indicatorDot} ${styles.statusActive}`}
              />
              <span>Sẵn sàng</span>
            </div>

            <span className={styles.arrowIndicator}>
              Truy cập <ChevronRight size={10} />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <CModal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnHidden
      centered
      premium={false}
      zIndex={2000}
    >
      <div className={styles.modalContainer}>
        {/* Modal Header containing Search and Switcher */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <h2>
              <span>Task</span> Phân Hệ Nghiệp Vụ
            </h2>
            <p>
              Chọn phân hệ nghiệp vụ SNP Terminal Operating System để chuyển đổi
              nhanh.
            </p>
          </div>

          <div className={styles.modalControls}>
            <div className={styles.viewSelector}>
              <CSegmented
                value={viewMode}
                onChange={(val) => setViewMode(val as "grouped" | "flat")}
                options={[
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        title="Hiển thị phân loại theo nhóm nghiệp vụ"
                      >
                        <LayoutGrid size={14} />
                        <span>Phân nhóm</span>
                      </div>
                    ),
                    value: "grouped",
                  },
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        title="Hiển thị tất cả dạng lưới phẳng"
                      >
                        <AppWindow size={14} />
                        <span>Lưới phẳng</span>
                      </div>
                    ),
                    value: "flat",
                  },
                ]}
              />
            </div>

            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm phân hệ..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.trim() && totalMatches === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: "4px",
                    color: "#ef4444",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Không tìm thấy phân hệ!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Board for Module Selection */}
        {viewMode === "grouped" ? (
          <div
            className={`${styles.dashboardGrid} ${getColsClass(
              activeCategories.length,
            )}`}
          >
            {activeCategories.map((cat) => {
              const theme = getCategoryTheme(cat.parent);
              const columnModules = rawModules.filter(
                (m) => m.parent.toLowerCase() === cat.parent.toLowerCase(),
              );

              const hasMatches = categoryHasMatches(cat.parent);
              const columnClass = `${styles.categoryColumn} ${
                searchQuery.trim()
                  ? hasMatches
                    ? styles.categoryColumnHighlighted
                    : styles.categoryColumnDimmed
                  : ""
              }`.trim();

              return (
                <div
                  key={cat.parent}
                  className={columnClass}
                  style={
                    {
                      "--column-theme-color": theme.primary,
                      "--column-bg-light": theme.bgLight,
                      "--column-border-light": theme.bg,
                      "--column-glow-color": theme.glow,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.columnHeader}>
                    <div className={styles.columnTitle}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: theme.primary,
                          boxShadow: `0 0 6px ${theme.primary}`,
                        }}
                      />
                      <span>{theme.label}</span>
                    </div>
                    <span className={styles.columnCount}>
                      {columnModules.length}
                    </span>
                  </div>
                  <div className={styles.columnBody}>
                    {columnModules.map((item) => renderModuleCard(item))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.flatGrid}>
            {rawModules.map((item) => renderModuleCard(item))}
          </div>
        )}
      </div>
    </CModal>
  );
};

export default SubsystemModal;
