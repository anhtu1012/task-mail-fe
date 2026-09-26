import Link from "next/link";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export const SUPPORT_EMAIL = "phamanhtu1012@gmail.com";
export const EFFECTIVE_DATE = "September 26, 2026";

/**
 * Khung chung cho trang pháp lý công khai (/privacy, /terms). Google OAuth
 * verification yêu cầu hai trang này truy cập được KHÔNG cần đăng nhập, nằm
 * cùng domain với trang chủ và được liên kết từ trang chủ.
 *
 * Viết tiếng Anh: người duyệt của Google đọc bản này. Có tóm tắt tiếng Việt
 * ở đầu cho người dùng.
 */
export function LegalLayout({
  title,
  summaryVi,
  children,
}: {
  title: string;
  summaryVi: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-[#0a436d]">
            <span className="grid place-items-center size-7 rounded-lg bg-[#0a436d] text-white">
              <Inbox size={16} />
            </span>
            TaskBox
          </Link>
          <nav className="flex gap-4 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-[#0a436d]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0a436d]">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{title}</h1>
        <p className="text-sm text-slate-500 mb-6">Effective date: {EFFECTIVE_DATE}</p>

        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700 mb-8">
          <strong className="block mb-1">Tóm tắt (Tiếng Việt)</strong>
          {summaryVi}
        </div>

        <article
          className="space-y-4 leading-relaxed text-[15px]
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-2
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-[#0a436d] [&_a]:underline"
        >
          {children}
        </article>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TaskBox · Contact:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
          {SUPPORT_EMAIL}
        </a>
      </footer>
    </div>
  );
}
