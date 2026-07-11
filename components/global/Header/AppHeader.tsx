"use client";

import React, { useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { clearShipData } from "@/store/slices/shipDataSlice";
import type { NavGroup } from "@/components/global/Sidebar/_types/types";
import type { BreadcrumbItem } from "./_types/types";
import { autoBuildBreadcrumbs, findNavChain } from "./utils";
import Breadcrumbs from "./_components/Breadcrumbs";
import SearchBar from "./_components/SearchBar";
import styles from "./AppHeader.module.scss";

import { useWindowMode } from "@/contexts/WindowModeContext";
import { CSegmented } from "@/components/ui";
import { Layout, AppWindow } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface AppHeaderProps {
  /** Manual breadcrumbs — if provided, auto-generation is skipped */
  breadcrumbs?: BreadcrumbItem[];
  /** NavGroups for auto-generating breadcrumbs from pathname */
  navGroups?: NavGroup[];
  /** Root label for first breadcrumb */
  rootLabel?: string;
  /** Root path for the module */
  rootPath?: string;
  /** Toggle sidebar callback */
  onToggleSidebar?: () => void;
  /** Extra content rendered on the right side */
  extra?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AppHeader: React.FC<AppHeaderProps> = ({
  breadcrumbs: manualBreadcrumbs,
  navGroups = [],
  rootLabel = "Dashboard",
  rootPath = "/ca",
  onToggleSidebar,
  extra,
}) => {
  const pathname = usePathname();
  const { layoutMode, setLayoutMode } = useWindowMode();

  // Auto breadcrumbs: use manual if provided, otherwise auto-build
  const breadcrumbs =
    manualBreadcrumbs ??
    autoBuildBreadcrumbs(pathname, navGroups, rootLabel, rootPath);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {onToggleSidebar && (
          <button
            className={styles.sidebarToggle}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* Separator */}
        {onToggleSidebar && breadcrumbs.length > 0 && (
          <div className={styles.headerSeparator} />
        )}

        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className={styles.headerRight}>
        <CSegmented
          value={layoutMode}
          onChange={(val) => setLayoutMode(val as "normal" | "desktop")}
          options={[
            {
              label: (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  title="Chế độ thường"
                >
                  <Layout size={14} />
                  <span>Thường</span>
                </div>
              ),
              value: "normal",
            },
            {
              label: (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  title="Chế độ đa nhiệm cửa sổ"
                >
                  <AppWindow size={14} />
                  <span>Đa nhiệm</span>
                </div>
              ),
              value: "desktop",
            },
          ]}
        />
        <SearchBar />
        {extra}
      </div>
    </header>
  );
};

export default AppHeader;
