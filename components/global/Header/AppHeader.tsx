"use client";

import React, { useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/components/global/Sidebar/_types/types";
import type { BreadcrumbItem } from "./_types/types";
import { autoBuildBreadcrumbs, findNavChain } from "./utils";
import Breadcrumbs from "./_components/Breadcrumbs";
import SearchBar from "./_components/SearchBar";
import styles from "./AppHeader.module.scss";

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
  /** Toggle sidebar callback (desktop: collapse/expand) */
  onToggleSidebar?: () => void;
  /** Mở sidebar off-canvas trên mobile (dưới 768px) */
  onOpenMobile?: () => void;
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
  onOpenMobile,
  extra,
}) => {
  const pathname = usePathname();

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
            onClick={() => {
              const isMobile = window.matchMedia("(max-width: 768px)").matches;
              if (isMobile) {
                onOpenMobile?.();
              } else {
                onToggleSidebar();
              }
            }}
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
        <SearchBar />
        {extra}
      </div>
    </header>
  );
};

export default AppHeader;
