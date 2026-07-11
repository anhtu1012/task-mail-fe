"use client";

import React from "react";
import { AutoComplete, AutoCompleteProps } from "antd";

interface CAutoCompleteProps extends AutoCompleteProps {
  mandatory?: boolean;
  full?: boolean;
}

const CAutoComplete: React.FC<CAutoCompleteProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <AutoComplete
      className={`c-autocomplete ${mandatory ? "c-autocomplete-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CAutoComplete;
export type { CAutoCompleteProps };
