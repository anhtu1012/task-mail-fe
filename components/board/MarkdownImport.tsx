"use client";
/**
 * Nhập Markdown vào phần mô tả: chọn tệp `.md` hoặc dán thẳng chữ.
 *
 * Vì sao cần: mô tả lưu dưới dạng HTML (Quill), nên tài liệu `.md` — thứ người
 * ta viết sẵn ở nơi khác rồi mang sang — trước đây dán vào chỉ ra một khối chữ
 * thô, mất hết tiêu đề và danh sách.
 *
 * Có bản xem trước là bắt buộc, không phải trang trí: bộ chuyển chỉ sinh ra
 * những thẻ backend giữ lại (xem `utils/client/markdown.ts`), nên vài cú pháp
 * ra khác kỳ vọng — bảng thành khối chữ, checkbox thành ký tự ☑/☐. Thấy trước
 * khi chèn thì không ai bị bất ngờ sau khi lưu.
 */
import { useRef, useState } from "react";
import { Button, Modal, Segmented, Upload } from "antd";
import type { UploadProps } from "antd";
import { FileText, Upload as UploadIcon } from "lucide-react";
import { markdownToHtml } from "@/utils/client/markdown";
import { RichTextEditor } from "./RichTextEditor";
import { C } from "./ui";

type Mode = "append" | "replace";

export default function MarkdownImport({
  open,
  hasExisting,
  onClose,
  onInsert,
}: {
  open: boolean;
  /** Mô tả hiện tại có chữ hay chưa — quyết định có hỏi "chèn hay thay" không */
  hasExisting: boolean;
  onClose: () => void;
  onInsert: (html: string, mode: Mode) => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>(hasExisting ? "append" : "replace");
  const [fileName, setFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const html = text.trim() ? markdownToHtml(text) : "";

  /**
   * Đọc tệp ngay trên máy, KHÔNG tải lên đâu cả — hệ thống không có kho tệp,
   * và nội dung `.md` thường là tài liệu nội bộ.
   */
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      setFileName(file.name);
    };
    reader.readAsText(file);
    // Trả false để antd không tự gửi request nào
    return false;
  };

  const close = () => {
    setText("");
    setFileName(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Nhập Markdown vào mô tả"
      width={880}
      destroyOnHidden
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px]" style={{ color: C.mutedForeground }}>
            Bảng chuyển thành khối chữ giữ nguyên, checkbox thành ☑/☐ — đó là giới
            hạn của định dạng lưu trữ, không phải lỗi.
          </span>
          <div className="flex items-center gap-2">
            <Button onClick={close}>Huỷ</Button>
            <Button
              type="primary"
              disabled={!html}
              onClick={() => {
                onInsert(html, mode);
                close();
              }}
            >
              {mode === "append" ? "Chèn vào cuối" : "Thay toàn bộ mô tả"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Upload accept=".md,.markdown,.txt" beforeUpload={beforeUpload} showUploadList={false}>
            <Button icon={<UploadIcon size={15} />}>Chọn tệp .md</Button>
          </Upload>
          {fileName && (
            <span
              className="inline-flex items-center gap-1.5 text-[12.5px]"
              style={{ color: C.neutral700 }}
            >
              <FileText size={13} /> {fileName}
            </span>
          )}
          {hasExisting && (
            <Segmented
              size="small"
              className="ml-auto"
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              options={[
                { label: "Chèn vào cuối", value: "append" },
                { label: "Thay toàn bộ", value: "replace" },
              ]}
            />
          )}
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px]" style={{ color: C.mutedForeground }}>
              Markdown
            </span>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"# Tiêu đề\n\n- việc cần làm\n- **quan trọng**\n\nDán nội dung .md vào đây..."}
              className="w-full resize-none rounded-lg px-3 py-2.5 text-[13px] outline-none font-mono"
              style={{
                border: `1px solid ${C.border}`,
                color: C.foreground,
                height: 360,
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px]" style={{ color: C.mutedForeground }}>
              Xem trước — đúng thứ sẽ được lưu
            </span>
            <div
              className="rounded-lg overflow-auto px-3 py-2"
              style={{ border: `1px solid ${C.border}`, height: 360 }}
            >
              {html ? (
                <RichTextEditor readOnly value={html} />
              ) : (
                <span className="text-[13px]" style={{ color: C.mutedForeground }}>
                  Chưa có nội dung để xem trước.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
