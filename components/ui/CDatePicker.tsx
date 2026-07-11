"use client";

import React from "react";
import { DatePicker } from "antd";
import type { DatePickerProps, RangePickerProps } from "antd/lib/date-picker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface CDatePickerProps extends Omit<DatePickerProps, "onChange" | "value"> {
  mandatory?: boolean;
  full?: boolean;
  value?: string | Dayjs | null;
  onChange?: (isoString: string | null, dateString: string) => void;
}

const CDatePicker: React.FC<CDatePickerProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  format = "DD/MM/YYYY HH:mm:ss",
  value,
  onChange,
  ...restProps
}) => {
  const dayjsValue =
    value == null
      ? undefined
      : typeof value === "string"
        ? dayjs(value)
        : value;

  const handleChange: DatePickerProps["onChange"] = (date, dateString) => {
    const singleDate = Array.isArray(date) ? date[0] : date;
    const singleString = Array.isArray(dateString) ? dateString[0] : dateString;
    onChange?.(singleDate ? singleDate.toISOString() : null, singleString as string);
  };

  return (
    <DatePicker
      format={format}
      value={dayjsValue}
      onChange={handleChange}
      className={`c-datepicker ${mandatory ? "c-datepicker-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  CRangePicker                                                       */
/* ------------------------------------------------------------------ */
type RangeValue = [string | null, string | null] | null;

interface CRangePickerProps extends Omit<
  RangePickerProps,
  "onChange" | "value"
> {
  mandatory?: boolean;
  full?: boolean;
  value?: RangeValue | [Dayjs | null, Dayjs | null] | null;
  onChange?: (isoRange: RangeValue, dateStrings: [string, string]) => void;
}

const CRangePicker: React.FC<CRangePickerProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  format = "DD/MM/YYYY HH:mm:ss",
  value,
  onChange,
  ...restProps
}) => {
  const toDay = (v: string | Dayjs | null | undefined): Dayjs | null => {
    if (v == null) return null;
    return typeof v === "string" ? dayjs(v) : v;
  };

  const dayjsValue: [Dayjs | null, Dayjs | null] | undefined =
    value == null ? undefined : [toDay(value[0]), toDay(value[1])];

  const handleChange: RangePickerProps["onChange"] = (dates, dateStrings) => {
    if (!onChange) return;
    const iso: RangeValue = dates
      ? [dates[0]?.toISOString() ?? null, dates[1]?.toISOString() ?? null]
      : null;
    onChange(iso, dateStrings as [string, string]);
  };

  return (
    <RangePicker
      format={format}
      value={dayjsValue}
      onChange={handleChange}
      className={`c-datepicker c-rangepicker ${mandatory ? "c-datepicker-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CDatePicker;
export { CRangePicker };
export type { CDatePickerProps, CRangePickerProps };
