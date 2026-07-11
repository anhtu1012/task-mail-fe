"use client";

import React from "react";
import { Switch, SwitchProps } from "antd";

interface CSwitchProps extends SwitchProps {
  /** Color variant for the switch */
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  /** Optional label to display next to the switch */
  label?: React.ReactNode;
  /** Label placement */
  labelPlacement?: "start" | "end";
  mandatory?: boolean;
  full?: boolean;
}

/**
 * CSwitch - A customized Ant Design Switch with premium styling.
 * Supports semantic color variants and optional labels.
 */
const CSwitch: React.FC<CSwitchProps> = ({
  variant = "default",
  label,
  labelPlacement = "end",
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  const switchEl = (
    <Switch
      className={`c-switch ${variant !== "default" ? `c-switch-${variant}` : ""} ${className}`.trim()}
      style={style}
      {...restProps}
    />
  );

  if (!label) return switchEl;

  return (
    <div className={`c-switch-wrapper c-switch-label-${labelPlacement}`}>
      {labelPlacement === "start" && <span className="c-switch-label">{label}</span>}
      {switchEl}
      {labelPlacement === "end" && <span className="c-switch-label">{label}</span>}
    </div>
  );
};

export default CSwitch;
export type { CSwitchProps };
