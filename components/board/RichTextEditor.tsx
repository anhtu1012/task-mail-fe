"use client";

/**
 * Trình soạn thảo mô tả công việc (Quill, theme snow).
 *
 * Làm giống dự án task-management: toolbar đầy đủ, chèn được ảnh và kéo đổi
 * kích thước ảnh, nội dung lưu dưới dạng HTML.
 *
 * Vài điểm bắt buộc khi dùng Quill trong Next App Router:
 *   - phải nạp động với ssr:false, vì Quill đụng `document` ngay lúc import;
 *   - module imageResize chỉ được đăng ký MỘT lần, nếu không mỗi lần mở lại
 *     modal sẽ đăng ký chồng và Quill ném lỗi;
 *   - CSP của dự án chỉ cho `img-src 'self' data: blob:` nên ảnh chèn vào phải
 *     là data: URI (Quill mặc định làm vậy khi chọn file) — dán link ảnh ngoài
 *     domain sẽ bị trình duyệt chặn, đây là giới hạn của cấu hình bảo mật,
 *     không phải lỗi trình soạn thảo.
 */
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import "./quill-theme.css";

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import("react-quill-new");
    const { default: ImageResize } = await import("quill-image-resize-module-react");

    if (Quill && !Quill.imports["modules/imageResize"]) {
      Quill.register("modules/imageResize", ImageResize);
    }
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] grid place-items-center text-[13px] text-[#808080]">
        Đang tải trình soạn thảo...
      </div>
    ),
  },
);

/** Toolbar đầy đủ — giữ đúng thứ tự nhóm như bản tham chiếu */
const TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link", "image", "video"],
  ["clean"],
];

export const QUILL_FORMATS = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "list",
  "indent",
  "align",
  "blockquote",
  "code-block",
  "link",
  "image",
  "video",
];

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  /** Chiều cao vùng soạn thảo (không tính toolbar) */
  minHeight?: number;
  /** Chỉ hiển thị: ẩn toolbar, ẩn khung, không sửa được */
  readOnly?: boolean;
  /** Đặt con trỏ vào ngay khi hiện ra — dùng khi vừa bấm để sửa */
  autoFocus?: boolean;
};

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Thêm mô tả chi tiết... (hỗ trợ tiêu đề, danh sách, checkbox, link, ảnh, khối mã)",
  minHeight = 220,
  readOnly = false,
  autoFocus = false,
}: Props) {
  const modules = useMemo(
    () =>
      readOnly
        ? { toolbar: false }
        : {
            toolbar: TOOLBAR,
            // matchVisual: false -> dán từ Word/Google Docs không kéo theo style rác
            clipboard: { matchVisual: false },
            imageResize: { parchment: null, modules: ["Resize", "DisplaySize"] },
          },
    [readOnly],
  );

  const wrapRef = useRef<HTMLDivElement>(null);

  // Quill nạp động nên lúc mount vùng soạn thảo chưa tồn tại — đợi nó dựng xong
  // rồi mới đặt con trỏ, nếu không focus() rơi vào khoảng không.
  useEffect(() => {
    if (!autoFocus || readOnly) return;
    let stop = false;
    const tryFocus = () => {
      if (stop) return;
      const editor = wrapRef.current?.querySelector<HTMLElement>(".ql-editor");
      if (editor) editor.focus();
      else requestAnimationFrame(tryFocus);
    };
    requestAnimationFrame(tryFocus);
    return () => {
      stop = true;
    };
  }, [autoFocus, readOnly]);

  // Ở chế độ đọc: bấm vào link mở tab mới và không nổi bọt ra ngoài
  useEffect(() => {
    if (!readOnly) return;
    const el = wrapRef.current;
    if (!el) return;
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(target.href, "_blank", "noopener,noreferrer");
      }
    };
    el.addEventListener("click", handleLinkClick);
    return () => el.removeEventListener("click", handleLinkClick);
  }, [readOnly]);

  return (
    <div
      ref={wrapRef}
      className={`taskEditor${readOnly ? " taskEditorReadOnly" : ""}`}
      style={{ ["--editor-min-h" as string]: `${minHeight}px` }}
    >
      <ReactQuill
        theme="snow"
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={QUILL_FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}
