/**
 * Markdown -> HTML, giới hạn đúng bằng thứ hệ thống này giữ được.
 *
 * VÌ SAO TỰ VIẾT thay vì kéo một thư viện: mô tả được lưu dưới dạng HTML và
 * backend lọc qua `sanitize-html` với danh sách thẻ đóng — h1–h6, p, br,
 * strong/em/u/s, sub/sup, ul/ol/li, blockquote, pre, code, a, img, iframe,
 * span, div. Mọi thẻ khác bị **vứt bỏ khi ghi**. Một thư viện Markdown đầy đủ
 * sẽ sinh ra `<table>`, `<hr>`, `<input type=checkbox>`… rồi người dùng lưu
 * xong mở lại thấy mất nội dung mà không hiểu vì sao. Hàm này chỉ sinh ra thứ
 * chắc chắn sống sót, và những cú pháp không có thẻ tương ứng thì **giữ lại
 * nội dung** dưới dạng khác chứ không im lặng đánh rơi.
 *
 * Hai chỗ cố tình khác chuẩn Markdown, đều vì cùng lý do trên:
 *   - bảng (`| a | b |`) -> khối `<pre>` giữ nguyên chữ, vì `<table>` bị lọc;
 *   - đường kẻ ngang (`---`) -> `<div>` có viền trên, vì `<hr>` bị lọc.
 *
 * Checkbox `- [x]` thành ký tự ☑/☐ trong một mục danh sách thường: Quill đánh
 * dấu checkbox bằng thuộc tính `data-list`, mà whitelist của backend chỉ cho
 * `data-checked` — nên checkbox "thật" cũng sẽ bị san phẳng lúc lưu. Dùng ký
 * tự thì nhìn thấy sao lưu ra vậy.
 */

/**
 * Thoát HTML cho phần NỘI DUNG.
 *
 * Cố tình không thoát cả tài liệu một lượt ở đầu hàm: làm vậy thì dấu ">" của
 * trích dẫn biến thành "&gt;" và dòng đó không còn khớp luật trích dẫn nữa —
 * lỗi này đã gặp thật lúc viết. Cấu trúc nhận diện trên chữ gốc, chỉ nội dung
 * mới bị thoát.
 */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Lọc URL: chặn scheme nguy hiểm, giữ mọi đường dẫn tương đối.
 *
 * Luật là "cấm những gì biết chắc nguy hiểm", không phải "chỉ cho vài dạng
 * quen mặt". Bản đầu làm ngược lại — chỉ nhận http/https/mailto và đường dẫn
 * mở đầu bằng `.` `/` `#` — nên một README thật với `[TÊN.md](thu-muc/TÊN.md)`
 * bị trả về nguyên chữ `[TÊN.md](thu-muc/TÊN.md)`, đúng lỗi "không đọc được".
 *
 * Có dấu hai chấm kiểu scheme thì phải là http/https/mailto; không có thì đó
 * là đường dẫn tương đối và cho qua. `javascript:`, `data:`, `file:` rơi vào
 * nhánh đầu và bị loại.
 */
const safeUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) return /^(https?|mailto)$/i.test(scheme[1]) ? trimmed : null;
  return trimmed;
};

/**
 * Định dạng trong một dòng: đậm, nghiêng, gạch ngang, mã, liên kết, ảnh.
 * Tự thoát HTML trước, nên thẻ sinh ra ở đây là thẻ duy nhất còn lại.
 */
function inline(raw: string): string {
  let out = escapeHtml(raw);

  // Mã trong dòng đi trước: nội dung bên trong không được hiểu là đậm/nghiêng
  const codeSlots: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_, code: string) => {
    codeSlots.push(`<code>${code}</code>`);
    return `\u0000${codeSlots.length - 1}\u0000`;
  });

  // Ảnh trước liên kết, vì cú pháp ảnh chỉ hơn liên kết một dấu "!"
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (whole, alt: string, url: string) => {
      const href = safeUrl(url);
      return href ? `<img src="${href}" alt="${alt}" />` : whole;
    },
  );

  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (whole, label: string, url: string) => {
      const href = safeUrl(url);
      return href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : whole;
    },
  );

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  // Nghiêng: đòi ký tự liền kề không phải dấu sao/gạch dưới để "a * b * c" và
  // tên_có_gạch_dưới không bị hiểu nhầm
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, "$1<em>$2</em>");

  return out.replace(/\u0000(\d+)\u0000/g, (_, index: string) => codeSlots[+index]);
}

type ListFrame = {
  tag: "ul" | "ol";
  indent: number;
  /** Đang có một <li> chưa đóng ở mức này — danh sách con phải nằm trong nó */
  liOpen: boolean;
};

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  const listStack: ListFrame[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];

  /**
   * Đóng mọi mức danh sách sâu hơn `toIndent`.
   *
   * Danh sách con nằm BÊN TRONG `<li>` của mục cha. Viết
   * `<ul><li>a</li><ul>…</ul></ul>` là HTML sai — trình duyệt tha nhưng Quill
   * dựng lại sẽ ra mức thụt đầu dòng lạ, và đó là thứ người dùng nhìn thấy.
   */
  const closeLists = (toIndent = -1) => {
    while (listStack.length && listStack[listStack.length - 1].indent > toIndent) {
      const frame = listStack.pop()!;
      if (frame.liOpen) html.push("</li>");
      html.push(`</${frame.tag}>`);
      const parent = listStack[listStack.length - 1];
      if (parent?.liOpen) {
        html.push("</li>");
        parent.liOpen = false;
      }
    }
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushQuote();
    closeLists();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // ----- khối mã ```
    const fence = line.match(/^\s*```(.*)$/);
    if (fence) {
      flushAll();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      html.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    // ----- dòng trống: kết thúc đoạn/trích dẫn, nhưng KHÔNG đóng danh sách
    // (danh sách có dòng trống giữa các mục vẫn là một danh sách)
    if (!line.trim()) {
      flushParagraph();
      flushQuote();
      continue;
    }

    // ----- bảng: gom trọn khối rồi giữ nguyên chữ trong <pre>
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushAll();
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].trim());
        i += 1;
      }
      i -= 1;
      html.push(`<pre><code>${escapeHtml(rows.join("\n"))}</code></pre>`);
      continue;
    }

    // ----- đường kẻ ngang
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flushAll();
      html.push(
        '<div style="border-top:1px solid rgba(15,23,42,.12); margin:12px 0"></div>',
      );
      continue;
    }

    // ----- tiêu đề
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      continue;
    }

    // ----- trích dẫn
    const quoted = line.match(/^\s*>\s?(.*)$/);
    if (quoted) {
      flushParagraph();
      closeLists();
      quote.push(quoted[1]);
      continue;
    }
    flushQuote();

    // ----- mục danh sách (có/không có checkbox, lồng theo thụt đầu dòng)
    const item = line.match(/^(\s*)(?:([-*+])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      flushParagraph();
      const indent = item[1].replace(/\t/g, "  ").length;
      const tag: "ul" | "ol" = item[2] ? "ul" : "ol";

      closeLists(indent);
      let top = listStack[listStack.length - 1];

      if (!top || top.indent < indent) {
        // Xuống mức sâu hơn: để ngỏ <li> của cha để danh sách con chui vào
        listStack.push({ tag, indent, liOpen: false });
        html.push(`<${tag}>`);
      } else if (top.tag !== tag) {
        // Cùng mức thụt nhưng đổi kiểu (gạch đầu dòng -> đánh số): đóng cái cũ
        if (top.liOpen) html.push("</li>");
        html.push(`</${listStack.pop()!.tag}>`);
        listStack.push({ tag, indent, liOpen: false });
        html.push(`<${tag}>`);
      } else if (top.liOpen) {
        html.push("</li>");
        top.liOpen = false;
      }
      top = listStack[listStack.length - 1];

      const checkbox = item[4].match(/^\[([ xX])\]\s*(.*)$/);
      const content = checkbox
        ? `${checkbox[1].toLowerCase() === "x" ? "☑" : "☐"} ${checkbox[2]}`
        : item[4];
      html.push(`<li>${inline(content)}`);
      top.liOpen = true;
      continue;
    }
    closeLists();

    // ----- còn lại là văn xuôi
    paragraph.push(line.trim());
  }

  flushAll();
  return html.join("");
}

/**
 * Đoán xem một đoạn chữ có phải Markdown không, để còn hỏi người dùng có muốn
 * chuyển hay không. Cố tình dè dặt: thà bỏ sót còn hơn tự ý đổi định dạng thứ
 * người ta vừa dán.
 */
export function looksLikeMarkdown(text: string): boolean {
  const signals = [
    /^#{1,6}\s+\S/m, // tiêu đề
    /^\s*[-*+]\s+\S/m, // gạch đầu dòng
    /^\s*\d+[.)]\s+\S/m, // danh sách đánh số
    /```/, // khối mã
    /\*\*[^*]+\*\*/, // đậm
    /\[[^\]]+\]\([^)]+\)/, // liên kết
    /^\s*>\s+\S/m, // trích dẫn
    /^\s*\|.*\|\s*$/m, // bảng
  ];
  return signals.filter((re) => re.test(text)).length >= 2;
}
