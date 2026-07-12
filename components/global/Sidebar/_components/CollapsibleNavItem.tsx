"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import type { NavItem } from "../_types/index";
import styles from "../AppSidebar.module.scss";

interface CollapsibleNavItemProps {
  item: NavItem;
  activeKey: string;
  collapsed: boolean;
  onSelect: (key: string, href?: string) => void;
}

const CollapsibleNavItem: React.FC<CollapsibleNavItemProps> = ({
  item,
  activeKey,
  collapsed,
  onSelect,
}) => {
  const [open, setOpen] = useState(true);

  // In collapsed mode, only show icon (tooltip can be added later)
  if (collapsed) {
    return (
      <button
        className={styles.navItem}
        onClick={() => setOpen((o) => !o)}
        title={item.label}
      >
        <span className={styles.navItemIcon}>{item.icon}</span>
      </button>
    );
  }

  return (
    <div className={styles.collapsible}>
      <button
        className={`${styles.navItem} ${styles.navItemParent} ${
          open ? styles.navItemParentOpen : ""
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.navItemIcon}>{item.icon}</span>
        <span className={styles.navItemLabel}>{item.label}</span>
        <ChevronRight
          size={14}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>

      {open && item.children && (
        <div className={styles.subItems}>
          {item.children.map((child) => (
            <Link
              key={child.key}
              href={child.href || "#"}
              className={`${styles.navItem} ${styles.subItem} ${
                activeKey === child.key ? styles.navItemActive : ""
              }`}
            >
              <span className={styles.navItemLabel}>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsibleNavItem;
