"use client";

import { useEffect, useState } from "react";
import { App, Button, Dropdown, Input, Modal, Tooltip } from "antd";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import type { Filters } from "@/app/(app)/tasks/page";

const STORAGE_KEY = "taskflow.tasks.filterPresets";

/** Bản filter đã serialize để lưu localStorage (Dayjs -> ISO string) */
type SavedPreset = {
  id: string;
  name: string;
  filters: Omit<Filters, "range"> & {
    range?: [string | null, string | null] | null;
  };
};

function loadPresets(): SavedPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPreset[]) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: SavedPreset[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function serializeFilters(filters: Filters): SavedPreset["filters"] {
  return {
    ...filters,
    range: filters.range
      ? [
          filters.range[0]?.toISOString() ?? null,
          filters.range[1]?.toISOString() ?? null,
        ]
      : filters.range,
  };
}

function deserializeFilters(saved: SavedPreset["filters"]): Filters {
  return {
    ...saved,
    range: saved.range
      ? [
          saved.range[0] ? dayjs(saved.range[0]) : null,
          saved.range[1] ? dayjs(saved.range[1]) : null,
        ]
      : saved.range,
  };
}

export default function TaskFilterPresets({
  filters,
  onApply,
}: {
  filters: Filters;
  onApply: (filters: Filters) => void;
}) {
  const { message } = App.useApp();
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const hasActiveFilters = Object.entries(filters).some(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  const handleSave = () => {
    const name = presetName.trim();
    if (!name) return;
    const next = [
      ...presets.filter((p) => p.name !== name),
      { id: `preset-${Date.now()}`, name, filters: serializeFilters(filters) },
    ];
    setPresets(next);
    savePresets(next);
    setSaveModalOpen(false);
    setPresetName("");
    message.success(`Đã lưu bộ lọc "${name}"`);
  };

  const handleDelete = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresets(next);
  };

  return (
    <>
      <Dropdown
        trigger={["click"]}
        menu={{
          items:
            presets.length > 0
              ? presets.map((p) => ({
                  key: p.id,
                  label: (
                    <div className="flex items-center justify-between gap-4">
                      <span onClick={() => onApply(deserializeFilters(p.filters))}>
                        {p.name}
                      </span>
                      <Trash2
                        size={13}
                        className="text-slate-400 hover:text-red-500 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                      />
                    </div>
                  ),
                }))
              : [{ key: "empty", label: "Chưa có bộ lọc đã lưu", disabled: true }],
        }}
      >
        <Button icon={<Bookmark size={14} />}>
          Bộ lọc đã lưu <ChevronDown size={14} />
        </Button>
      </Dropdown>
      <Tooltip title={hasActiveFilters ? "Lưu bộ lọc hiện tại" : "Chọn ít nhất 1 điều kiện lọc trước"}>
        <Button
          disabled={!hasActiveFilters}
          onClick={() => setSaveModalOpen(true)}
        >
          Lưu bộ lọc
        </Button>
      </Tooltip>

      <Modal
        title="Lưu bộ lọc hiện tại"
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSave}
        okButtonProps={{ disabled: !presetName.trim() }}
        okText="Lưu"
        cancelText="Huỷ"
      >
        <Input
          autoFocus
          placeholder="Tên bộ lọc, ví dụ: Task khẩn cấp của tôi"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onPressEnter={handleSave}
        />
      </Modal>
    </>
  );
}
