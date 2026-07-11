"use client";

import React from "react";
import { Tag, TagProps } from "antd";

type CTagStatus =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "default";

interface CTagProps extends Omit<TagProps, "color"> {
  /** Semantic status driving the premium color styling */
  status?: CTagStatus;
  /** If true, renders a softer (light background) variant */
  soft?: boolean;
  /** Native Ant Design color (overrides `status` styling when provided) */
  color?: TagProps["color"];
}

/**
 * CTag - A customized Ant Design Tag with premium STOS styling.
 * Use `status` for semantic states (e.g. "success" for Hoạt động, "default" for Khoá).
 * Falls back to native Ant Design `color` when provided.
 */
const CTag: React.FC<CTagProps> = ({
  status = "default",
  soft = false,
  color,
  className = "",
  children,
  ...restProps
}) => {
  return (
    <Tag
      color={color}
      className={`c-tag c-tag-${status} ${soft ? "c-tag-soft" : ""} ${className}`.trim()}
      {...restProps}
    >
      {children}
    </Tag>
  );
};

export default CTag;
export type { CTagProps, CTagStatus };
