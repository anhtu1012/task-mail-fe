"use client";

/**
 * Cài đặt thông báo Zalo của chính người dùng: tin việc mới, các mốc nhắc
 * trước hạn, và bản tóm tắt hằng ngày.
 *
 * Hợp đồng: task-mail-be/API_REFERENCE.md mục 6b.1. Backend quét nhắc hạn mỗi
 * 5 phút nên chỉ cho chọn mốc trong danh sách cố định, giờ tóm tắt bước 5 phút.
 */
import { useMemo, useState } from "react";
import { Alert, Button, Select, Skeleton, Switch, TimePicker, Typography } from "antd";
import dayjs from "dayjs";
import { Save } from "lucide-react";
import {
  useNotificationPreference,
  useSaveNotificationPreference,
} from "@/hooks/useTaskApp";
import {
  MAX_REMINDER_OFFSETS,
  NotificationPreference,
  NotificationPreferenceInput,
  REMINDER_OFFSET_CHOICES,
} from "@/models/task";

const TIME_FORMAT = "HH:mm";

/** Nhãn cho mốc lạ (mặc định lấy từ env backend có thể không nằm trong danh sách) */
function offsetLabel(minutes: number): string {
  const known = REMINDER_OFFSET_CHOICES.find((c) => c.value === minutes);
  if (known) return known.label;
  if (minutes % 1440 === 0) return `${minutes / 1440} ngày`;
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${minutes} phút`;
}

const toInput = (p: NotificationPreference): NotificationPreferenceInput => ({
  newTaskEnabled: p.newTaskEnabled,
  reminderOffsets: [...p.reminderOffsets].sort((a, b) => b - a),
  digestEnabled: p.digestEnabled,
  digestTime: p.digestTime,
});

const sameInput = (a: NotificationPreferenceInput, b: NotificationPreferenceInput) =>
  a.newTaskEnabled === b.newTaskEnabled &&
  a.digestEnabled === b.digestEnabled &&
  a.digestTime === b.digestTime &&
  [...a.reminderOffsets].sort().join() === [...b.reminderOffsets].sort().join();

export default function ZaloNotificationSettings({ linked }: { linked: boolean }) {
  const { data, isLoading } = useNotificationPreference();

  if (isLoading || !data) return <Skeleton active paragraph={{ rows: 3 }} />;

  // `key` dựng lại form khi dữ liệu server đổi (vừa lưu xong) — khỏi đồng bộ
  // state bằng useEffect.
  return <SettingsForm key={data.updatedAt ?? "default"} saved={data} linked={linked} />;
}

function SettingsForm({
  saved,
  linked,
}: {
  saved: NotificationPreference;
  linked: boolean;
}) {
  const save = useSaveNotificationPreference();
  const initial = useMemo(() => toInput(saved), [saved]);
  const [draft, setDraft] = useState<NotificationPreferenceInput>(initial);
  const dirty = !sameInput(draft, initial);

  const offsetOptions = useMemo(() => {
    const options = REMINDER_OFFSET_CHOICES.map((c) => ({
      value: c.value,
      label: `Trước ${c.label}`,
    }));
    // Mốc mặc định ngoài danh sách vẫn phải hiện được tên
    for (const v of draft.reminderOffsets) {
      if (!options.some((o) => o.value === v)) {
        options.push({ value: v, label: `Trước ${offsetLabel(v)}` });
      }
    }
    return options.sort((a, b) => a.value - b.value);
  }, [draft.reminderOffsets]);

  return (
    <div className="flex flex-col gap-4">
      {!linked && (
        <Alert
          type="info"
          showIcon
          title="Cài đặt chỉ có tác dụng sau khi bạn liên kết Zalo ở trên."
        />
      )}

      <SettingRow
        title="Việc mới được giao"
        description="Nhắn Zalo ngay khi có người giao việc cho bạn (hoặc việc tạo từ email)."
      >
        <Switch
          checked={draft.newTaskEnabled}
          onChange={(v) => setDraft((d) => ({ ...d, newTaskEnabled: v }))}
        />
      </SettingRow>

      <SettingRow
        title="Nhắc trước hạn"
        description={`Chọn tối đa ${MAX_REMINDER_OFFSETS} mốc. Mỗi mốc nhắc một lần; bỏ trống = không nhắc hạn.`}
      >
        <Select
          mode="multiple"
          allowClear
          maxCount={MAX_REMINDER_OFFSETS}
          placeholder="Không nhắc"
          style={{ minWidth: 260, maxWidth: "100%" }}
          value={draft.reminderOffsets}
          options={offsetOptions}
          onChange={(values: number[]) =>
            setDraft((d) => ({ ...d, reminderOffsets: values }))
          }
        />
      </SettingRow>

      <SettingRow
        title="Tóm tắt hằng ngày"
        description="Mỗi ngày một tin: việc quá hạn và việc đến hạn hôm nay. Không có việc thì không nhắn."
      >
        <div className="flex items-center gap-3">
          <Switch
            checked={draft.digestEnabled}
            onChange={(v) => setDraft((d) => ({ ...d, digestEnabled: v }))}
          />
          <TimePicker
            format={TIME_FORMAT}
            minuteStep={5}
            allowClear={false}
            needConfirm={false}
            disabled={!draft.digestEnabled}
            value={dayjs(draft.digestTime, TIME_FORMAT)}
            onChange={(t) =>
              t && setDraft((d) => ({ ...d, digestTime: t.format(TIME_FORMAT) }))
            }
          />
        </div>
      </SettingRow>

      <div className="flex items-center justify-end gap-3">
        {saved.source === "default" && !dirty && (
          <Typography.Text type="secondary" className="text-xs">
            Đang dùng mặc định hệ thống
          </Typography.Text>
        )}
        <Button disabled={!dirty} onClick={() => setDraft(initial)}>
          Hoàn tác
        </Button>
        <Button
          type="primary"
          icon={<Save size={15} />}
          disabled={!dirty}
          loading={save.isPending}
          onClick={() => save.mutate(draft)}
        >
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
