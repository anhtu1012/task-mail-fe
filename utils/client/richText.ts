/**
 * Tiện ích cho nội dung rich text (HTML do Quill sinh ra).
 *
 * Tách khỏi RichTextEditor.tsx vì file đó import CSS của Quill và next/dynamic —
 * store và bộ lọc chỉ cần 2 hàm thuần này, không nên kéo theo cả trình soạn thảo.
 */

/**
 * Quill coi ô trống là "<p><br></p>" chứ không phải chuỗi rỗng.
 * Không lọc thì mọi việc đều bị tính là "có mô tả" và thẻ nào cũng hiện icon mô tả.
 */
export const isRichTextEmpty = (html?: string | null): boolean => {
  if (!html) return true;
  return (
    html
      .replace(/<(br|p|div|span|h[1-6]|ul|ol|li)[^>]*>/gi, "")
      .replace(/<\/(br|p|div|span|h[1-6]|ul|ol|li)>/gi, "")
      .replace(/&nbsp;/gi, "")
      .trim() === ""
  );
};

/** Bóc thẻ HTML để lấy chữ thuần — dùng khi tìm kiếm, KHÔNG dùng để render */
export const richTextToPlain = (html?: string | null): string =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
