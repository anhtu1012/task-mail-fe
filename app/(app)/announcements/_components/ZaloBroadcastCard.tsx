"use client";

import { useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Input,
  Popconfirm,
  Radio,
  Segmented,
} from "antd";
import { FlaskConical, Megaphone, Send } from "lucide-react";
import { integrationApi } from "@/apis/integration.api";
import { useZaloRecipients } from "@/hooks/useTaskApp";
import { ZaloBotStatus, ZaloBroadcastResult } from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { RecipientPicker } from "./RecipientPicker";

// Khớp giới hạn sendMessage của Zalo Bot API (BE cũng validate).
const MAX_LENGTH = 2000;

type TemplateKey = "update" | "install" | "custom";

const TEMPLATES: Record<TemplateKey, (appUrl: string) => string> = {
  update: (appUrl) =>
    [
      "🚀 TaskBox vừa được cập nhật phiên bản mới!",
      "",
      "Có gì mới:",
      "• ",
      "",
      "Vui lòng tải lại trang (hoặc tắt hẳn rồi mở lại app) để dùng phiên bản mới nhất.",
      `👉 ${appUrl}`,
    ].join("\n"),
  install: (appUrl) =>
    [
      "📱 TaskBox đã có thể cài trên điện thoại như một ứng dụng!",
      "",
      "Cách cài (chỉ vài giây, không cần kho ứng dụng):",
      `• iPhone: mở ${appUrl} bằng Safari → bấm nút Chia sẻ → chọn "Thêm vào MH chính".`,
      `• Android: mở ${appUrl} bằng Chrome → bấm menu ⋮ → chọn "Cài đặt ứng dụng" (hoặc "Thêm vào màn hình chính").`,
      "",
      "Sau khi cài, mở TaskBox ngay từ màn hình chính để xem việc hôm nay và nhận nhắc hạn nhanh hơn.",
    ].join("\n"),
  custom: () => "",
};

type Props = {
  botStatus?: ZaloBotStatus;
};

export function ZaloBroadcastCard({ botStatus }: Props) {
  const { message } = App.useApp();
  const [template, setTemplate] = useState<TemplateKey>("update");
  // Card chỉ render sau khi useMe() trả về (client) nên window luôn có sẵn.
  const [content, setContent] = useState(() =>
    TEMPLATES.update(window.location.origin),
  );
  const [sending, setSending] = useState<"test" | "all" | null>(null);
  const [result, setResult] = useState<ZaloBroadcastResult | null>(null);

  const applyTemplate = (key: TemplateKey) => {
    setTemplate(key);
    setContent(TEMPLATES[key](window.location.origin));
    setResult(null);
  };

  const { data: recipientList = [], isLoading: recipientsLoading } =
    useZaloRecipients(true);
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const recipients =
    audience === "all"
      ? recipientList.length || (botStatus?.linkedUsers ?? 0)
      : selected.size;
  const trimmed = content.trim();
  const canSend = !!botStatus?.connected && trimmed.length > 0 && !sending;

  const send = async (testOnly: boolean) => {
    setSending(testOnly ? "test" : "all");
    setResult(null);
    try {
      const res = await integrationApi.broadcastZalo({
        message: trimmed,
        testOnly,
        userIds:
          !testOnly && audience === "selected" ? [...selected] : undefined,
      });
      setResult(res);
      if (testOnly) {
        if (res.sent) message.success("Đã gửi thử — kiểm tra Zalo của bạn");
        else message.error("Gửi thử thất bại");
      } else if (res.failed === 0) {
        message.success(`Đã gửi thông báo cho ${res.sent} người`);
      } else {
        message.warning(`Đã gửi ${res.sent}/${res.total}, ${res.failed} lỗi`);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSending(null);
    }
  };

  return (
    <Card
      variant="borderless"
      title={
        <span className="inline-flex items-center gap-2">
          <span className="grid place-items-center size-8 rounded-lg bg-amber-50 text-amber-500">
            <Megaphone size={17} />
          </span>
          Soạn thông báo
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {!botStatus?.connected && (
          <Alert
            type="warning"
            showIcon
            message="Bot Zalo đang mất kết nối — chưa thể gửi thông báo."
          />
        )}

        <Segmented<TemplateKey>
          value={template}
          onChange={applyTemplate}
          options={[
            { value: "update", label: "Cập nhật hệ thống" },
            { value: "install", label: "Tải app trên điện thoại" },
            { value: "custom", label: "Tự soạn" },
          ]}
        />

        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_LENGTH}
          showCount
          autoSize={{ minRows: 8, maxRows: 16 }}
          placeholder="Nhập nội dung thông báo…"
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">Người nhận</span>
            <Radio.Group
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              optionType="button"
              options={[
                { value: "all", label: "Tất cả đã liên kết Zalo" },
                { value: "selected", label: "Chọn người nhận" },
              ]}
            />
          </div>
          {audience === "selected" && (
            <RecipientPicker
              recipients={recipientList}
              loading={recipientsLoading}
              selected={selected}
              onChange={setSelected}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-sm text-slate-500">
            Sẽ gửi cho <b>{recipients}</b> người. Không lưu lịch sử gửi.
          </span>
          <div className="flex gap-2">
            <Button
              icon={<FlaskConical size={15} />}
              disabled={!canSend}
              loading={sending === "test"}
              onClick={() => send(true)}
            >
              Gửi thử cho tôi
            </Button>
            <Popconfirm
              title={`Gửi thông báo cho ${recipients} người?`}
              description="Tin nhắn sẽ được gửi ngay qua Zalo, không thể thu hồi."
              okText="Gửi ngay"
              cancelText="Huỷ"
              disabled={!canSend || recipients === 0}
              onConfirm={() => send(false)}
            >
              <Button
                type="primary"
                icon={<Send size={15} />}
                disabled={!canSend || recipients === 0}
                loading={sending === "all"}
              >
                {audience === "all"
                  ? "Gửi cho tất cả"
                  : `Gửi cho ${recipients} người`}
              </Button>
            </Popconfirm>
          </div>
        </div>

        {result && (
          <Alert
            type={result.failed ? "warning" : "success"}
            showIcon
            message={`Kết quả: gửi thành công ${result.sent}/${result.total}${
              result.failed ? `, lỗi ${result.failed}` : ""
            }`}
          />
        )}
      </div>
    </Card>
  );
}
