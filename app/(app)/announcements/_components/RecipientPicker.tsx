"use client";

import { useMemo, useState } from "react";
import { Checkbox, Empty, Input, Skeleton } from "antd";
import dayjs from "dayjs";
import { Search } from "lucide-react";
import { ZaloRecipient } from "@/models/task";

type Props = {
  recipients: ZaloRecipient[];
  loading?: boolean;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
};

/** Danh sách checkbox người đã liên kết Zalo — có ô tìm và "Chọn tất cả". */
export function RecipientPicker({
  recipients,
  loading,
  selected,
  onChange,
}: Props) {
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return q
      ? recipients.filter((r) => r.email.toLowerCase().includes(q))
      : recipients;
  }, [recipients, keyword]);

  // "Chọn tất cả" áp cho danh sách đang lọc, giữ nguyên lựa chọn ngoài bộ lọc
  const visibleSelected = visible.filter((r) => selected.has(r.userId)).length;
  const allVisibleChecked =
    visible.length > 0 && visibleSelected === visible.length;

  const toggleAllVisible = (checked: boolean) => {
    const next = new Set(selected);
    visible.forEach((r) =>
      checked ? next.add(r.userId) : next.delete(r.userId),
    );
    onChange(next);
  };

  const toggle = (userId: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(userId);
    else next.delete(userId);
    onChange(next);
  };

  if (loading) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!recipients.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có ai liên kết Zalo"
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2">
        <Checkbox
          checked={allVisibleChecked}
          indeterminate={visibleSelected > 0 && !allVisibleChecked}
          disabled={!visible.length}
          onChange={(e) => toggleAllVisible(e.target.checked)}
        >
          Chọn tất cả{keyword.trim() ? " (đang lọc)" : ""}
        </Checkbox>
        <span className="text-sm text-slate-500">
          Đã chọn <b>{selected.size}</b>/{recipients.length}
        </span>
        <Input
          allowClear
          size="small"
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Tìm theo email…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="ml-auto"
          style={{ maxWidth: 240 }}
        />
      </div>

      <div className="max-h-72 overflow-y-auto">
        {visible.length ? (
          visible.map((r) => (
            <label
              key={r.userId}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
            >
              <Checkbox
                checked={selected.has(r.userId)}
                onChange={(e) => toggle(r.userId, e.target.checked)}
              />
              <span className="min-w-0 flex-1 truncate">{r.email}</span>
              <span className="shrink-0 text-xs text-slate-400">
                Liên kết {dayjs(r.linkedAt).format("DD/MM/YYYY")}
              </span>
            </label>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-slate-400">
            Không tìm thấy email phù hợp
          </div>
        )}
      </div>
    </div>
  );
}
