"use client";

import React from "react";
import { TreeSelect, TreeSelectProps } from "antd";

interface CTreeSelectProps extends TreeSelectProps {
  mandatory?: boolean;
  full?: boolean;
}

const CTreeSelect: React.FC<CTreeSelectProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <TreeSelect
      className={`c-treeselect ${mandatory ? "c-treeselect-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CTreeSelect;
export type { CTreeSelectProps };
