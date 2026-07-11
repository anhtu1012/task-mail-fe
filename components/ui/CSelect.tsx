"use client";

import React from "react";
import { Select, SelectProps } from "antd";

interface CSelectProps extends SelectProps {
  /** If true, applies mandatory/required field styling */
  mandatory?: boolean;
  /** If true, the select takes full width */
  full?: boolean;
}

/**
 * CSelect - A customized Ant Design Select with premium styling.
 * Supports `mandatory` for required field indication and `full` for full-width layout.
 */
const CSelect: React.FC<CSelectProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  classNames,
  ...restProps
}) => {
  return (
    <Select
      className={`c-select ${mandatory ? "c-select-mandatory" : ""} ${className}`.trim()}
      classNames={{
        ...classNames,
        popup: {
          ...classNames?.popup,
          root: `c-select-dropdown ${classNames?.popup?.root ?? ""}`.trim(),
        },
      }}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CSelect;
export type { CSelectProps };
