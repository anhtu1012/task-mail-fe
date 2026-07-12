"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import type { NavGroup, UserInfo } from "./_types/types";
import SidebarHeader from "./_components/SidebarHeader";
import CollapsibleNavItem from "./_components/CollapsibleNavItem";
import UserDropdown from "./_components/UserDropdown";
import styles from "./AppSidebar.module.scss";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface AppSidebarProps {
  navGroups: NavGroup[];
  user?: UserInfo;
  companyName?: string;
  companyPlan?: string;
  /** Controlled: sidebar collapsed state */
  collapsed: boolean;
  /** Controlled: toggle callback */
  onToggleCollapsed: () => void;
}

const defaultUser: UserInfo = {
  name: "Task Admin",
  email: "admin@Task.vn",
};

/* ------------------------------------------------------------------ */
/*  Main sidebar component (controlled)                                */
/* ------------------------------------------------------------------ */
const AppSidebar: React.FC<AppSidebarProps> = ({
  navGroups,
  user = defaultUser,
  companyName = "Task",
  companyPlan = "Enterprise",
  collapsed,
  onToggleCollapsed,
}) => {
  const router = useRouter();
  const activeKey = usePathname().split("/").filter(Boolean).pop() || "";

  const handleSelect = (key: string, href?: string) => {
    if (href && href !== "#") {
      router.push(href);
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      {/* Company header */}
      <SidebarHeader
        companyName={companyName}
        companyPlan={companyPlan}
        collapsed={collapsed}
      />

      {/* Navigation */}
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.title} className={styles.navGroup}>
            {!collapsed && (
              <span className={styles.navGroupTitle}>{group.title}</span>
            )}
            {collapsed && <div className={styles.navGroupDivider} />}
            <div className={styles.navGroupItems}>
              {group.items.map((item) =>
                item.children && item.children.length > 0 ? (
                  <CollapsibleNavItem
                    key={item.key}
                    item={item}
                    activeKey={activeKey}
                    collapsed={collapsed}
                    onSelect={handleSelect}
                  />
                ) : (
                  <Link
                    key={item.key}
                    href={item.href || "#"}
                    className={`${styles.navItem} ${
                      activeKey === item.key ? styles.navItemActive : ""
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navItemIcon}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className={styles.navItemLabel}>
                          {item.label}
                        </span>
                        {item.href && (
                          <ChevronRight
                            size={14}
                            className={styles.navItemArrow}
                          />
                        )}
                      </>
                    )}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        className={styles.collapseToggle}
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && <span className={styles.collapseLabel}>Thu gọn</span>}
      </button>

      {/* User section */}
      <UserDropdown user={user} collapsed={collapsed} />
    </aside>
  );
};

export default AppSidebar;
