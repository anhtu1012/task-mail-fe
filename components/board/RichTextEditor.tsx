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

/** URL bắt đầu bằng http(s):// hoặc www. — dừng ở khoảng trắng */
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"]+/gi;
/** Dấu câu dính cuối thường không thuộc link: "xem https://a.com." */
const TRAILING_PUNCT = /[.,;:!?)\]}'"]+$/;

type QuillLike = {
  on: (
    event: "text-change",
    handler: (delta: { ops: DeltaOp[] }, old: unknown, source: string) => void,
  ) => void;
  getText: (index: number, length: number) => string;
  getFormat: (index: number, length: number) => Record<string, unknown>;
  formatText: (index: number, length: number, name: string, value: string, source: string) => void;
};
type DeltaOp = { insert?: unknown; retain?: number; delete?: number; attributes?: Record<string, unknown> };

/**
 * Tự nhận link khi dán hoặc gõ.
 *
 * Bắt ở `text-change` chứ không ở clipboard matcher: Quill 2 dán chữ thuần
 * (`text/plain`, thứ trình duyệt đưa ra khi copy từ thanh địa chỉ) mà không
 * chạy matcher nào cả. Ở đây mọi lần chèn chữ do người dùng đều đi qua:
 *   - chèn nhiều ký tự (dán) -> quét cả đoạn vừa chèn;
 *   - gõ một khoảng trắng / xuống dòng -> xét cái từ ngay trước nó.
 * Định dạng bằng source "api" để không tự kích hoạt lại chính handler này.
 */
class AutoLink {
  constructor(quill: QuillLike) {
    const linkify = (start: number, text: string) => {
      for (const m of text.matchAll(URL_RE)) {
        const url = m[0].replace(TRAILING_PUNCT, "");
        if (url.length < 5) continue;
        const at = start + (m.index ?? 0);
        const fmt = quill.getFormat(at, url.length);
        // Đã là link, hoặc nằm trong khối mã (link ở đó là chữ, không bấm được)
        if (fmt.link || fmt["code-block"]) continue;
        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        quill.formatText(at, url.length, "link", href, "api");
      }
    };

    quill.on("text-change", (delta, _old, source) => {
      if (source !== "user") return;
      // Đợi Quill phát xong sự kiện hiện tại rồi mới sửa tài liệu
      queueMicrotask(() => scan(delta));
    });

    const scan = (delta: { ops: DeltaOp[] }) => {
      let index = 0;
      for (const op of delta.ops) {
        if (op.retain !== undefined) {
          index += op.retain;
          continue;
        }
        if (op.delete !== undefined) continue;
        if (typeof op.insert !== "string") {
          index += 1; // ảnh / video chiếm một ô
          continue;
        }
        const inserted = op.insert;
        if (!op.attributes?.link) {
          if (inserted.length > 1) {
            linkify(index, inserted);
          } else if (/\s/.test(inserted)) {
            // Từ ngay trước khoảng trắng vừa gõ
            const from = Math.max(0, index - 2000);
            const before = quill.getText(from, index - from);
            const word = before.match(/\S+$/)?.[0];
            if (word) linkify(index - word.length, word);
          }
        }
        index += inserted.length;
      }
    };
  }
}

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import("react-quill-new");
    const { default: ImageResize } = await import("quill-image-resize-module-react");

    if (Quill && !Quill.imports["modules/imageResize"]) {
      Quill.register("modules/imageResize", ImageResize);
    }
    if (Quill && !Quill.imports["modules/autoLink"]) {
      Quill.register("modules/autoLink", AutoLink);
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
            autoLink: true,
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
