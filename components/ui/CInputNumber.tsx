"use client";

import React from "react";
import { InputNumber, InputNumberProps, Space } from "antd";

interface CInputNumberProps extends InputNumberProps {
  /** If true, applies mandatory/required field styling */
  mandatory?: boolean;
  /** If true, the input takes full width */
  full?: boolean;
  /**
   * Hiển thị dấu phân cách hàng nghìn bằng dấu phẩy và thập phân bằng dấu chấm
   * (vd: 12,872.57). Mặc định tắt để không ảnh hưởng các ô số dạng định danh.
   */
  thousandSeparator?: boolean;
}

/** Format hàng nghìn (,) + giữ phần thập phân (.) — vd "12872.57" → "12,872.57". */
const groupThousands = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === "") return "";
  const [intPart, decPart] = String(value).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
};

/**
 * CInputNumber - A customized Ant Design InputNumber with premium styling.
 */
const CInputNumber: React.FC<CInputNumberProps> = ({
  mandatory = false,
  full = false,
  thousandSeparator = true,
  className = "",
  style,
  addonBefore,
  addonAfter,
  formatter,
  parser,
  precision,
  ...restProps
}) => {
  // Extract custom props so they don't get passed to Ant Design component
  const { ...antdProps } = restProps;

  // Bật thousandSeparator → mặc định 2 chữ số thập phân (vẫn cho ghi đè precision).
  const resolvedPrecision = precision ?? (thousandSeparator ? 2 : undefined);

  // Ưu tiên formatter/parser do người dùng truyền; nếu không, bật theo thousandSeparator.
  const resolvedFormatter =
    formatter ?? (thousandSeparator ? (v) => groupThousands(v) : undefined);
  const resolvedParser =
    parser ??
    (thousandSeparator
      ? (((v?: string) =>
          (v ?? "").replace(/,/g, "")) as InputNumberProps["parser"])
      : undefined);
  const hasAddon = addonBefore !== undefined || addonAfter !== undefined;
  const inputClassName =
    `c-input-number ${mandatory ? "c-input-number-mandatory" : ""} ${className}`.trim();
  const inputStyle = { width: full ? "100%" : undefined, ...style };

  const input = (
    <InputNumber
      className={inputClassName}
      style={inputStyle}
      formatter={resolvedFormatter}
      parser={resolvedParser}
      precision={resolvedPrecision}
      {...antdProps}
    />
  );

  if (!hasAddon) return input;

  return (
    <Space.Compact
      className="c-input-number-compact"
      style={{ width: full ? "100%" : undefined }}
    >
      {addonBefore !== undefined && (
        <span className="c-input-number-addon">{addonBefore}</span>
      )}
      {input}
      {addonAfter !== undefined && (
        <span className="c-input-number-addon">{addonAfter}</span>
      )}
    </Space.Compact>
  );
};

export default CInputNumber;
export type { CInputNumberProps };
