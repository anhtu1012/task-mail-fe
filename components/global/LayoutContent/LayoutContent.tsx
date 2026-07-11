/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import styles from "./LayoutContent.module.scss";

type LayoutType =
  | "full"
  | "split-h"
  | "split-v"
  | "grid"
  | "dashboard"
  | "sidebar-main"
  | "three-columns"
  | "holy-grail"
  | "sticky-header"
  | "card-with-sidebar";

interface LayoutContentProps {
  children: React.ReactNode;
  type?: LayoutType;
  gap?: number | string;
  columns?: number | string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * LayoutContent Component
 * A flexible layout system for organizing content in various configurations.
 */
const LayoutContent: React.FC<LayoutContentProps> = ({
  children,
  type = "full",
  gap,
  columns,
  className = "",
  style,
  id,
}) => {
  const containerClasses = [
    styles.layoutContainer,
    styles[`type-${type}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const customStyle: React.CSSProperties = {
    ...style,
    ...(gap !== undefined &&
      ({ "--layout-gap": typeof gap === "number" ? `${gap}px` : gap } as any)),
    ...(columns !== undefined && ({ "--layout-columns": columns } as any)),
  };

  return (
    <div id={id} className={containerClasses} style={customStyle}>
      {children}
    </div>
  );
};

interface LayoutSectionProps {
  children: React.ReactNode;
  className?: string;
  flex?: number | string;
  width?: string | number;
  height?: string | number;
  area?: string;
  style?: React.CSSProperties;
}

/**
 * LayoutSection Component
 * Use this to wrap individual sections within a LayoutContent.
 */
export const LayoutSection: React.FC<LayoutSectionProps> = ({
  children,
  className = "",
  flex,
  width,
  height,
  area,
  style,
}) => {
  const sectionStyle: React.CSSProperties = {
    ...style,
    flex: flex,
    width: width,
    height: height,
    gridArea: area,
  };

  return (
    <div
      className={`${styles.layoutSection} ${className}`}
      style={sectionStyle}
    >
      {children}
    </div>
  );
};

export default LayoutContent;
