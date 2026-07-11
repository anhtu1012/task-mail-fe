/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Input, InputProps } from "antd";

/**
 * Chuẩn hoá chuỗi thành "mã": bỏ dấu tiếng Việt → viết HOA → chỉ giữ chữ/số.
 *
 * @param raw          giá trị thô người dùng gõ/paste
 * @param allowLetters cho phép chữ cái A-Z (mặc định true)
 * @param allowDigits  cho phép chữ số 0-9 (mặc định true)
 */
export const toCodeValue = (
  raw: string,
  allowLetters = true,
  allowDigits = true,
): string => {
  let v = (raw ?? "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu kết hợp (huyền/sắc/hỏi/ngã/nặng…)
    .toUpperCase();

  const allowed = `${allowLetters ? "A-Z" : ""}${allowDigits ? "0-9" : ""}`;
  if (allowed) v = v.replace(new RegExp(`[^${allowed}]`, "g"), "");
  return v;
};

interface CCodeInputProps extends Omit<InputProps, "onChange"> {
  /** If true, the input takes full width */
  full?: boolean;
  /** Cho phép chữ cái A-Z (mặc định true) */
  allowLetters?: boolean;
  /** Cho phép chữ số 0-9 (mặc định true) */
  allowDigits?: boolean;
  /** Nhận giá trị đã chuẩn hoá (HOA, không dấu, chỉ chữ/số) */
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * CCodeInput — ô nhập "mã": tự động viết HOA, bỏ dấu tiếng Việt, chỉ chữ + số.
 * Dùng cho mã tuyến / mã code… Trả giá trị đã chuẩn hoá qua onChange(value, e).
 */
const CCodeInput = React.forwardRef<any, CCodeInputProps>(
  (
    {
      full = false,
      allowLetters = true,
      allowDigits = true,
      className = "",
      style,
      onChange,
      ...restProps
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const code = toCodeValue(e.target.value, allowLetters, allowDigits);
      e.target.value = code; // đồng bộ DOM với giá trị đã lọc
      onChange?.(code, e);
    };

    return (
      <Input
        ref={ref}
        className={`c-input c-code-input ${className}`.trim()}
        style={{ width: full ? "100%" : undefined, ...style }}
        {...restProps}
        onChange={handleChange}
      />
    );
  },
);
CCodeInput.displayName = "CCodeInput";

export default CCodeInput;
export type { CCodeInputProps };
