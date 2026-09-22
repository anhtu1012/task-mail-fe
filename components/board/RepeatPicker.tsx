"use client";
/**
 * Đặt luật lặp cho một việc.
 *
 * Backend đã tự sinh lượt kế tiếp khi việc được hoàn thành từ lâu, nhưng trước
 * đợt này giao diện chỉ *hiện* luật lặp chứ không có chỗ nào *đặt* nó — nghĩa
 * là tính năng có mà không ai dùng được.
 *
 * Hai quy ước cần nhớ khi đọc form này:
 *   - "kết thúc" là MỘT trong hai: sau N lượt, hoặc tới ngày X. Gửi cả hai thì
 *     backend áp cả hai và cái nào tới trước thì thắng, nên form chỉ cho chọn
 *     một để người dùng không phải đoán;
 *   - `remaining` là số lượt còn lại SAU lượt đang mở. Nhãn hiển thị vì thế nói
 *     "còn N lượt nữa", không phải "lặp N lần".
 */
import { useState } from "react";
import { Button, DatePicker, InputNumber, Segmented, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Repeat, X } from "lucide-react";
import { RepeatRule, WEEKDAY_LABELS, repeatText } from "@/models/board";
import { C } from "./ui";

type EndMode = "never" | "count" | "date";

const UNIT_OPTIONS = [
  { label: "Ngày", value: "DAY" as const },
  { label: "Tuần", value: "WEEK" as const },
  { label: "Tháng", value: "MONTH" as const },
];

export default function RepeatPicker({
  value,
  onChange,
  onClose,
}: {
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  onClose?: () => void;
}) {
  const [unit, setUnit] = useState<RepeatRule["unit"]>(value?.unit ?? "WEEK");
  const [interval, setInterval] = useState<number>(value?.interval ?? 1);
  const [weekdays, setWeekdays] = useState<number[]>(value?.weekdays ?? []);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(
    value?.dayOfMonth ?? null,
  );
  const [endMode, setEndMode] = useState<EndMode>(
    value?.remaining !== null && value?.remaining !== undefined
      ? "count"
      : value?.until
        ? "date"
        : "never",
  );
  const [count, setCount] = useState<number>(value?.remaining ?? 5);
  const [until, setUntil] = useState<Dayjs | null>(
    value?.until ? dayjs(value.until) : null,
  );

  const draft: RepeatRule = {
    unit,
    interval,
    weekdays: unit === "WEEK" ? weekdays : [],
    dayOfMonth: unit === "MONTH" ? dayOfMonth : null,
    remaining: endMode === "count" ? count : null,
    until: endMode === "date" && until ? until.toISOString() : null,
  };

  const toggleWeekday = (day: number) =>
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );

  return (
    <div className="flex flex-col gap-3" style={{ width: 288 }}>
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: C.neutral700 }}
        >
          <Repeat size={14} /> Lặp lại
        </span>
        {onClose && (
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid place-items-center size-6 rounded border-0 bg-transparent cursor-pointer"
            style={{ color: C.neutral500 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12.5px]" style={{ color: C.neutral500 }}>
          Mỗi
        </span>
        <InputNumber
          size="small"
          min={1}
          max={365}
          value={interval}
          onChange={(v) => setInterval(v ?? 1)}
          style={{ width: 64 }}
        />
        <Select
          size="small"
          value={unit}
          onChange={setUnit}
          options={UNIT_OPTIONS}
          style={{ flex: 1 }}
        />
      </div>

      {unit === "WEEK" && (
        <div>
          <div className="text-[11.5px] mb-1.5" style={{ color: C.neutral500 }}>
            Vào thứ — bỏ trống thì giữ đúng thứ của hạn hiện tại
          </div>
          <div className="flex gap-1">
            {/* Xếp T2 trước, CN cuối: đó là cách lịch Việt Nam đọc một tuần */}
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className="flex-1 h-7 rounded-md border-0 cursor-pointer text-[11.5px] font-semibold"
                style={{
                  background: weekdays.includes(day) ? C.primary : "#f1f5f9",
                  color: weekdays.includes(day) ? "#fff" : C.neutral700,
                }}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      )}

      {unit === "MONTH" && (
        <div className="flex items-center gap-2">
          <span className="text-[12.5px]" style={{ color: C.neutral500 }}>
            Vào ngày
          </span>
          <InputNumber
            size="small"
            min={1}
            max={31}
            placeholder="theo hạn"
            value={dayOfMonth}
            onChange={setDayOfMonth}
            style={{ width: 88 }}
          />
          <span className="text-[11.5px]" style={{ color: C.neutral500 }}>
            tháng ngắn hơn thì lùi về cuối tháng
          </span>
        </div>
      )}

      <div>
        <div className="text-[11.5px] mb-1.5" style={{ color: C.neutral500 }}>
          Kết thúc
        </div>
        <Segmented
          size="small"
          block
          value={endMode}
          onChange={(v) => setEndMode(v as EndMode)}
          options={[
            { label: "Không", value: "never" },
            { label: "Sau N lượt", value: "count" },
            { label: "Tới ngày", value: "date" },
          ]}
        />
        {endMode === "count" && (
          <div className="flex items-center gap-2 mt-2">
            <InputNumber
              size="small"
              min={1}
              max={999}
              value={count}
              onChange={(v) => setCount(v ?? 1)}
              style={{ width: 72 }}
            />
            <span className="text-[12px]" style={{ color: C.neutral500 }}>
              lượt nữa sau lượt này
            </span>
          </div>
        )}
        {endMode === "date" && (
          <DatePicker
            size="small"
            className="mt-2"
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            value={until}
            onChange={setUntil}
            placeholder="Chọn ngày dừng"
          />
        )}
      </div>

      <div
        className="rounded-lg px-2.5 py-2 text-[12.5px]"
        style={{ background: C.primary50, color: C.primary }}
      >
        {repeatText(draft)}
      </div>

      <div className="flex gap-2">
        {value && (
          <Button
            size="small"
            danger
            onClick={() => {
              onChange(null);
              onClose?.();
            }}
          >
            Bỏ lặp
          </Button>
        )}
        <Button
          type="primary"
          size="small"
          block
          disabled={endMode === "date" && !until}
          onClick={() => {
            onChange(draft);
            onClose?.();
          }}
        >
          Lưu
        </Button>
      </div>
    </div>
  );
}
