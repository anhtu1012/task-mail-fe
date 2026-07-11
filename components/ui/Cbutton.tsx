"use client";

import React from "react";
import { Button, ButtonProps } from "antd";

interface CButtonProps extends Omit<ButtonProps, "type"> {
  /**
   * Button type. Extended to support semantic status types.
   */
  type?:
    | ButtonProps["type"]
    | "success"
    | "warning"
    | "error"
    | "info"
    | "secondary"
    | "dark"
    | "light"
    | "gradient";
  /**
   * If true, the button will take up the full width of its container.
   * Equivalent to Ant Design's `block` prop.
   */
  full?: boolean;
}

/**
 * CButton - A customized Ant Design Button with premium styling and additional props.
 * Supports a `full` prop which maps to Ant Design's `block`.
 * Updated for Ant Design v6 standards with semantic status support.
 */
const CButton: React.FC<CButtonProps> = ({
  full = false,
  className = "",
  children,
  block,
  type = "default",
  iconPosition,
  iconPlacement,
  ...restProps
}) => {
  // In Ant Design v6, iconPosition is deprecated in favor of iconPlacement
  const mergedIconPlacement = iconPlacement || iconPosition;

  // Determine if it's a custom semantic type
  const semanticTypes = ["success", "warning", "error", "info", "secondary", "dark", "light", "gradient"];
  const isSemanticType = semanticTypes.includes(type as string);
  
  // Map semantic types to Antd types/props
  // Most semantic types use 'primary' style which we then override with CSS
  const antdType = isSemanticType ? "primary" : (type as ButtonProps["type"]);
  const isError = type === "error";

  return (
    <Button
      className={`c-button ${isSemanticType ? `c-button-${type}` : ""} ${className}`.trim()}
      type={antdType}
      danger={isError || restProps.danger}
      block={full || block}
      iconPlacement={mergedIconPlacement}
      {...restProps}
    >
      {children}
    </Button>
  );
};

export default CButton;
