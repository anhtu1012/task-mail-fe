"use client";

import React from "react";
import { Transfer, TransferProps } from "antd";

interface CTransferProps extends TransferProps {
  /** If true, applies a compact styling */
  compact?: boolean;
}

const CTransfer: React.FC<CTransferProps> = ({
  compact = false,
  className = "",
  ...restProps
}) => {
  return (
    <Transfer
      className={`c-transfer ${compact ? "c-transfer-compact" : ""} ${className}`.trim()}
      {...restProps}
    />
  );
};

export default CTransfer;
export type { CTransferProps };
