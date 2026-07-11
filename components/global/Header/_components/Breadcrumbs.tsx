"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "../_types/types";
import styles from "../AppHeader.module.scss";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs — Renders a breadcrumb trail from an array of items.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol className={styles.breadcrumbList}>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${crumb.label}-${index}`}
              className={styles.breadcrumbItem}
            >
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className={styles.breadcrumbSeparator}
                />
              )}
              {crumb.icon && (
                <span className={styles.breadcrumbIcon}>{crumb.icon}</span>
              )}
              {crumb.href && !isLast ? (
                <a
                  href={crumb.href}
                  className={`${styles.breadcrumbLink} ${styles.breadcrumbLinkClickable}`}
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={`${styles.breadcrumbLink} ${
                    isLast ? styles.breadcrumbLinkActive : ""
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
