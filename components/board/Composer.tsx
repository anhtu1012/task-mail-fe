"use client";

/**
 * Ô nhập nhanh: gõ một dòng tự nhiên, hệ thống tự tách hạn / ưu tiên / nhãn /
 * thời lượng và hiện ngay bản xem trước bên dưới.
 *
 * Bản xem trước là phần quan trọng nhất: đoán ngầm mà không cho người dùng thấy
 * mình đoán gì thì họ sẽ không bao giờ tin và quay lại mở form.
 *
 * Enter = lưu · Shift+Enter = xuống dòng · Esc = huỷ · click ra ngoài = huỷ (khi chưa gõ).
 */
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Clock, LoaderCircle, Tag, Timer, X, Zap } from "lucide-react";
import { PRIORITY_META } from "@/models/task";
import { QUICK_ADD_HINTS, quickParse } from "@/utils/client/quickParse";
import { useBoardMeta } from "./BoardStore";
import { G, fmtShort } from "./ui";
import styles from "./board.module.scss";

type Props = {
  placeholder: string;
  submitLabel: string;
  /**
   * Trả về Promise thì ô nhập tự khoá và hiện vòng quay tới khi xong. Trả về
   * `void` vẫn chạy bình thường (ô đặt tên danh sách dùng kiểu này).
   */
  onSubmit: (value: string) => void | Promise<void>;
  onCancel: () => void;
  /** Bật bản xem trước (ô thêm thẻ) — ô đặt tên danh sách thì tắt */
  parse?: boolean;
  autoFocus?: boolean;
};

export function Composer({
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  parse = false,
  autoFocus = true,
}: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { labels } = useBoardMeta();
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Click ra ngoài thì đóng — chỉ khi chưa gõ gì, tránh mất chữ đang soạn
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node) && !value.trim()) onCancel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onCancel, value]);

  const parsed = useMemo(
    () => (parse && value.trim() ? quickParse(value) : null),
    [parse, value],
  );

  const parsedLabels = useMemo(
    () =>
      parsed
        ? parsed.labelSlugs
            .map((slug) => labels.find((l) => l.slug === slug))
            .filter((l): l is NonNullable<typeof l> => !!l)
        : [],
    [parsed, labels],
  );

  const hasPreview =
    !!parsed &&
    (!!parsed.deadline ||
      !!parsed.priority ||
      parsedLabels.length > 0 ||
      parsed.estimateMinutes !== null);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || saving) return;

    /*
     * Xoá ô ngay chứ không đợi máy chủ: ô mờ ở trong cột đã gánh phần "đang
     * lưu", còn ở đây người dùng cần gõ tiếp việc thứ hai ngay lập tức. Đây là
     * ô nhập liên tiếp — bắt chờ từng việc một thì nhập mười việc thành cực hình.
     */
    setValue("");
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.focus();
    }

    const result = onSubmit(trimmed);
    if (!(result instanceof Promise)) return;
    setSaving(true);
    try {
      await result;
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div ref={wrapRef} className="flex flex-col gap-2">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          grow(e.target);
        }}
        onKeyDown={onKeyDown}
        className={`${styles.glassInput} w-full resize-none px-2.5 py-2 text-[13.5px]`}
      />

      {/* Bản xem trước những gì hệ thống đã hiểu */}
      {hasPreview && parsed && (
        <div
          className="rounded-lg px-2 py-1.5 flex flex-col gap-1"
          style={{ background: "rgba(255,255,255,.14)", border: `1px solid ${G.line}` }}
        >
          <div className="text-[12.5px] font-medium" style={{ color: G.text }}>
            {parsed.title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {parsed.deadline && (
              <Chip icon={<Clock size={11} />}>{fmtShort(parsed.deadline)}</Chip>
            )}
            {parsed.priority && (
              <Chip
                icon={<Zap size={11} />}
                color={PRIORITY_META[parsed.priority].color}
              >
                {PRIORITY_META[parsed.priority].label}
              </Chip>
            )}
            {parsedLabels.map((l) => (
              <Chip key={l.id} icon={<Tag size={11} />} color={l.color}>
                {l.name}
              </Chip>
            ))}
            {parsed.estimateMinutes !== null && (
              <Chip icon={<Timer size={11} />}>{parsed.estimateMinutes} phút</Chip>
            )}
          </div>
        </div>
      )}

      {/* Gợi ý cú pháp — chỉ hiện khi ô còn trống, không che lúc đang gõ */}
      {parse && !value.trim() && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 px-0.5">
          {QUICK_ADD_HINTS.map((h) => (
            <span key={h.syntax} className="text-[11px]" style={{ color: G.textMuted }}>
              <code
                className="px-1 rounded"
                style={{ background: G.fill, color: G.textSoft }}
              >
                {h.syntax}
              </code>{" "}
              {h.meaning}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium
            border-0 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          style={{ background: "rgba(190,224,244,.92)", color: "#062b47" }}
        >
          {submitLabel}
        </button>

        {/* Việc trước còn đang gửi — ô vẫn gõ tiếp được, chỉ là nói cho biết */}
        {saving && (
          <span
            className="inline-flex items-center gap-1.5 text-[12px]"
            style={{ color: G.textMuted }}
          >
            <LoaderCircle size={13} className="animate-spin" />
            Đang lưu...
          </span>
        )}
        <button
          type="button"
          aria-label="Huỷ"
          onClick={onCancel}
          className="grid place-items-center size-8 rounded-lg border-0 bg-transparent cursor-pointer hover:bg-white/15"
          style={{ color: G.textMuted }}
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

function Chip({
  icon,
  children,
  color,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[11px] font-medium"
      style={{
        color: G.text,
        background: color ? `${color}55` : G.fill,
        border: `1px solid ${color ? `${color}aa` : G.line}`,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
