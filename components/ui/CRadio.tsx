"use client";

import React from "react";
import { Radio, RadioProps, RadioGroupProps } from "antd";

interface CRadioProps extends RadioProps {
  mandatory?: boolean;
  full?: boolean;
}

const CRadio: React.FC<CRadioProps> & { Group: React.FC<RadioGroupProps & { full?: boolean; mandatory?: boolean }> } = ({
  className = "",
  mandatory,
  full,
  ...restProps
}) => {
  return <Radio className={`c-radio ${className}`.trim()} {...restProps} />;
};

const CRadioGroup: React.FC<RadioGroupProps & { full?: boolean; mandatory?: boolean }> = ({
  className = "",
  full = false,
  mandatory = false,
  style,
  ...restProps
}) => {
  return (
    <Radio.Group 
      className={`c-radio-group ${className}`.trim()} 
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps} 
    />
  );
};

CRadio.Group = CRadioGroup;

export default CRadio;
export { CRadioGroup };
export type { CRadioProps };
