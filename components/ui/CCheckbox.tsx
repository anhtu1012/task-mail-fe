"use client";

import React from "react";
import { Checkbox, CheckboxProps } from "antd";
import type { CheckboxGroupProps } from "antd/lib/checkbox";

const { Group } = Checkbox;

interface CCheckboxProps extends CheckboxProps {
  /** Custom label color variant */
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  mandatory?: boolean;
  full?: boolean;
}

/**
 * CCheckbox - A customized Ant Design Checkbox with premium styling.
 */
const CCheckbox: React.FC<CCheckboxProps> = ({
  variant = "default",
  mandatory,
  full,
  className = "",
  ...restProps
}) => {
  return (
    <Checkbox
      className={`c-checkbox ${variant !== "default" ? `c-checkbox-${variant}` : ""} ${className}`.trim()}
      {...restProps}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  CCheckboxGroup                                                     */
/* ------------------------------------------------------------------ */
interface CCheckboxGroupProps extends CheckboxGroupProps {
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  mandatory?: boolean;
  full?: boolean;
}

const CCheckboxGroup: React.FC<CCheckboxGroupProps> = ({
  layout = "horizontal",
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <Group
      className={`c-checkbox-group c-checkbox-group-${layout} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CCheckbox;
export { CCheckboxGroup };
export type { CCheckboxProps, CCheckboxGroupProps };
