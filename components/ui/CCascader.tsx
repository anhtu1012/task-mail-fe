/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Cascader, CascaderProps } from "antd";

interface CCascaderProps extends CascaderProps {
  mandatory?: boolean;
  full?: boolean;
}

const CCascader: React.FC<CCascaderProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <Cascader
      className={`c-cascader ${mandatory ? "c-cascader-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...(restProps as any)}
    />
  );
};

export default CCascader;
export type { CCascaderProps };
