"use client";

import React from "react";
import { Segmented, SegmentedProps } from "antd";

export interface CSegmentedProps extends SegmentedProps {
  /**
   * If true, the segmented control will take up the full width of its container.
   * Equivalent to Ant Design's `block` prop.
   */
  full?: boolean;
}

/**
 * CSegmented - A customized Ant Design Segmented component with premium styling.
 */
const CSegmented: React.FC<CSegmentedProps> = ({
  full = false,
  className = "",
  block,
  ...restProps
}) => {
  return (
    <Segmented
      className={`c-segmented ${className}`.trim()}
      block={full || block}
      {...restProps}
    />
  );
};

export default CSegmented;
