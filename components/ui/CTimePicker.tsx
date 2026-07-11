"use client";

import React from "react";
import { TimePicker } from "antd";
import type { TimePickerProps, TimeRangePickerProps } from "antd/lib/time-picker";

const { RangePicker } = TimePicker;

interface CTimePickerProps extends TimePickerProps {
  mandatory?: boolean;
  full?: boolean;
}

const CTimePicker: React.FC<CTimePickerProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <TimePicker
      className={`c-timepicker ${mandatory ? "c-timepicker-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

interface CTimeRangePickerProps extends TimeRangePickerProps {
  mandatory?: boolean;
  full?: boolean;
}

const CTimeRangePicker: React.FC<CTimeRangePickerProps> = ({
  mandatory = false,
  full = false,
  className = "",
  style,
  ...restProps
}) => {
  return (
    <RangePicker
      className={`c-timepicker c-timerangepicker ${mandatory ? "c-timepicker-mandatory" : ""} ${className}`.trim()}
      style={{ width: full ? "100%" : undefined, ...style }}
      {...restProps}
    />
  );
};

export default CTimePicker;
export { CTimeRangePicker };
export type { CTimePickerProps, CTimeRangePickerProps };
