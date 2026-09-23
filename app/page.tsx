"use client";

import {
  ArrowRight,
  BellRing,
  Bot,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Columns3,
  FolderKanban,
  Inbox,
  Mail,
  MailCheck,
  Repeat,
  Sparkles,
  SquareKanban,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "mail" | "zalo" | "kanban" | "calendar"
  >("mail");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-[#0ea5e9]/20 selection:text-[#0a436d]">
      {/* ============================================================
          TOP NAVIGATION BAR
          ============================================================ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-10 rounded-xl bg-gradient-to-tr from-[#0a436d] to-[#0ea5e9] text-white shadow-md shadow-[#0a436d]/20">
              <Inbox size={22} />
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#0a436d] flex items-center gap-2">
                TaskBox
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                  Pro
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Từ Hộp Thư đến Hoàn Thành Công Việc
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-[#0a436d] transition-colors"
            >
              Tính năng cốt lõi
            </a>
            <a
              href="#integrations"
              className="hover:text-[#0a436d] transition-colors"
            >
              Gmail & Zalo Bot
            </a>
            <a
              href="#workflow"
              className="hover:text-[#0a436d] transition-colors"
            >
              Quy trình vận hành
            </a>
            <a href="#views" className="hover:text-[#0a436d] transition-colors">
              Giao diện làm việc
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-[#0a436d] px-4 py-2 rounded-lg transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold !text-white bg-gradient-to-r from-[#0a436d] to-[#0ea5e9] hover:from-[#083556] hover:to-[#0284c7] px-4.5 py-2.5 rounded-xl shadow-md shadow-[#0a436d]/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>Vào ứng dụng</span>
              <ArrowRight size={16} className="text-white" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-teal-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/70 text-sky-800 text-xs font-semibold mb-6 shadow-xs">
              <Sparkles size={14} className="text-sky-600 animate-pulse" />
              <span>
                Giải pháp Tự động hóa Việc làm từ Email & Nhắc lịch qua Zalo
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
              Làm chủ mọi công việc,{" "}
              <span className="bg-gradient-to-r from-[#0a436d] via-[#0d5a8f] to-[#0ea5e9] bg-clip-text text-transparent">
                không bao giờ trễ deadline.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
              Hệ thống quản trị công việc toàn diện: tự động biến email thành
              nhiệm vụ, trợ lý Zalo Bot cảnh báo deadline tức thì, trực quan hóa
              tiến độ bằng Kanban, Canvas và Lịch biểu thông minh.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-base font-bold !text-white bg-gradient-to-r from-[#0a436d] via-[#0d5a8f] to-[#0284c7] hover:from-[#083556] hover:to-[#0369a1] px-7 py-3.5 rounded-xl shadow-lg shadow-sky-900/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                style={{ color: "#ffffff" }}
              >
                <span style={{ color: "#ffffff" }}>
                  Bắt đầu trải nghiệm ngay
                </span>
                <ArrowRight size={18} className="text-white" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-base font-semibold text-slate-800 hover:text-[#0a436d] bg-white border border-slate-300 hover:border-slate-400 px-6 py-3.5 rounded-xl shadow-xs hover:bg-slate-50 transition-all"
                style={{ color: "#1e293b" }}
              >
                <span>Đăng nhập hệ thống</span>
              </Link>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/70 text-left">
              <div className="p-3">
                <div className="text-2xl font-bold text-[#0a436d]">100%</div>
                <div className="text-xs text-slate-500 font-medium">
                  Không bỏ sót email có việc
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-teal-600">
                  Real-time
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Nhắc hạn tự động qua Zalo
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-[#0a436d]">
                  4+ Views
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Kanban, Grid, Canvas, Lịch
                </div>
              </div>
              <div className="p-3">
                <div className="text-2xl font-bold text-sky-600">Đa dự án</div>
                <div className="text-xs text-slate-500 font-medium">
                  Phân quyền & theo dõi độc lập
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              HERO LIVE UI MOCKUP PREVIEW
              ============================================================ */}
          <div className="relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-slate-200/80 via-slate-100/50 to-white shadow-2xl border border-slate-200/90">
            {/* Window bar */}
            <div className="rounded-xl overflow-hidden bg-slate-900 shadow-inner">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-rose-500" />
                  <div className="size-3 rounded-full bg-amber-500" />
                  <div className="size-3 rounded-full bg-emerald-500" />
                  <span className="ml-3 font-mono text-[11px] text-slate-400">
                    https://taskbox.internal/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px]">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Đang đồng bộ Gmail & Zalo
                  </span>
                </div>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-6 bg-slate-50 text-slate-800">
                {/* Mockup App Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-[#0a436d] text-white">
                      <FolderKanban size={18} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Dự án: Triển khai Hệ thống ERP 2026
                      </h4>
                      <p className="text-xs text-slate-500">
                        18 công việc • 4 người tham gia • 85% đúng hạn
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-xs">
                      🔍 Tìm kiếm việc...
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-md bg-[#0a436d] text-white shadow-xs">
                      + Thêm việc mới
                    </span>
                  </div>
                </div>

                {/* Mockup Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  {/* Column 1: TODO */}
                  <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-slate-400" />
                        Chờ xử lý (2)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Card from Gmail */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            TSK-00104
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <Mail size={10} /> Từ Email
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-slate-800 line-clamp-2">
                          [TASK] Báo cáo soát xét hợp đồng đối tác tháng 09
                        </h5>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[10px]">
                            Khẩn cấp
                          </span>
                          <span>Hạn: 17:00 hôm nay</span>
                        </div>
                      </div>

                      {/* Card Normal */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            TSK-00105
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            <Repeat size={10} /> Lặp tuần
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-slate-800">
                          Sao lưu định kỳ cơ sở dữ liệu hệ thống
                        </h5>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            Bình thường
                          </span>
                          <span>Hạn: Thứ 6</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: IN PROGRESS */}
                  <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-100">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-sky-500" />
                        Đang làm (1)
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-sky-200 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          TSK-00098
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[10px]">
                          Ưu tiên cao
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-800">
                        Nâng cấp bộ cân bằng tải & tối ưu hoá truy vấn
                      </h5>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full w-3/4" />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                        <span>3/4 việc con xong</span>
                        <span className="text-sky-700 font-semibold">75%</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: DONE */}
                  <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Hoàn thành (2)
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-emerald-200/80 shadow-xs opacity-90">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          TSK-00091
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 size={12} /> Đúng hạn
                        </span>
                      </div>
                      <h5 className="text-xs font-medium text-slate-600 line-through">
                        Cấu hình bảo mật OAuth2 & xác thực 2 lớp
                      </h5>
                      <div className="text-[11px] text-slate-400 mt-2">
                        Đã xong lúc 10:30
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphism Badge: Gmail Sync */}
            <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl items-center gap-3 max-w-xs animate-bounce duration-1000">
              <span className="grid place-items-center size-10 rounded-xl bg-red-100 text-red-600 shrink-0">
                <MailCheck size={20} />
              </span>
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  Gmail Auto-Sync
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-slate-500">
                  Phát hiện email có{" "}
                  <code className="text-red-600 font-semibold">[TASK]</code> →
                  Đã tạo task tự động!
                </div>
              </div>
            </div>

            {/* Floating Glassmorphism Badge: Zalo Bot Reminder */}
            <div className="hidden sm:flex absolute -top-6 -right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl items-center gap-3 max-w-xs">
              <span className="grid place-items-center size-10 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                <Bot size={20} />
              </span>
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  Zalo Assistant Bot
                  <span className="text-[10px] text-blue-600 font-normal">
                    vừa gửi
                  </span>
                </div>
                <div className="text-slate-600">
                  &ldquo;🔔 Bạn có 1 việc khẩn sắp đến hạn trong 2 giờ
                  tới!&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CORE PILLARS (GIÁ TRỊ CỐT LÕI)
          ============================================================ */}
      <section
        id="features"
        className="py-20 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0a436d] mb-3">
              Tính năng đột phá
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tất cả những gì bạn cần để quản trị công việc thông minh
            </h3>
            <p className="text-slate-600 mt-3">
              Không chỉ là danh sách việc làm đơn thuần, TaskBox kết nối dữ liệu
              từ mọi nguồn và tự động nhắc bạn đúng thời điểm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all group">
              <div className="grid place-items-center size-12 rounded-xl bg-red-100 text-red-600 mb-5 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Biến Email thành Task
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Chỉ cần gửi email kèm tiêu đề [TASK], hệ thống tự động bóc tách
                nội dung, người gửi và deadline để chuyển thành thẻ công việc
                tức thì.
              </p>
              <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                <span>Google OAuth2 An toàn</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all group">
              <div className="grid place-items-center size-12 rounded-xl bg-blue-100 text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                <Bot size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Trợ lý Zalo Bot Nhắc việc
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Liên kết tài khoản Zalo với mã OTP đơn giản. Bot tự động nhắn
                tin nhắc deadline trước 24h, 2h và cảnh báo khi có nguy cơ trễ
                hạn.
              </p>
              <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <span>Nhắc việc 24/7 tức thì</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all group">
              <div className="grid place-items-center size-12 rounded-xl bg-emerald-100 text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                <SquareKanban size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Kanban & Bảng Tự do Canvas
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Kéo thả công việc giữa các giai đoạn, tùy biến nhãn dán, hỗ trợ
                vẽ tư duy bằng canvas Konva và nạp danh sách việc từ tệp
                Markdown.
              </p>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span>Trực quan hóa luồng việc</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all group">
              <div className="grid place-items-center size-12 rounded-xl bg-purple-100 text-purple-600 mb-5 group-hover:scale-110 transition-transform">
                <Repeat size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Lịch Thông minh & Lặp Định kỳ
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Thuật toán dự phóng việc lặp theo ngày/tuần/tháng. Xem lịch theo
                Tháng, Tuần, Ngày và Agenda; phân biệt rõ Task có hạn và Event
                theo giờ.
              </p>
              <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                <span>Không sót việc định kỳ</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          INTERACTIVE DEMO / WORKFLOW SECTION
          ============================================================ */}
      <section id="integrations" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0a436d] mb-3">
              Chi tiết Tích hợp Chuyên sâu
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Khám phá trải nghiệm thực tế trên từng tính năng
            </h3>
            <p className="text-slate-600 mt-2">
              Bấm vào các thẻ dưới đây để xem cách TaskBox tự động hóa từng giai
              đoạn công việc.
            </p>

            {/* Tab controls */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-200/80 mt-6 gap-1 flex-wrap justify-center">
              <button
                onClick={() => setActiveTab("mail")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "mail"
                    ? "bg-white text-[#0a436d] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mail size={15} /> Tự động hóa Gmail
              </button>
              <button
                onClick={() => setActiveTab("zalo")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "zalo"
                    ? "bg-white text-[#0a436d] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bot size={15} /> Nhắc việc Zalo Bot
              </button>
              <button
                onClick={() => setActiveTab("kanban")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "kanban"
                    ? "bg-white text-[#0a436d] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Columns3 size={15} /> Bảng Kanban
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "calendar"
                    ? "bg-white text-[#0a436d] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={15} /> Lịch biểu & Lặp
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-4xl mx-auto">
            {activeTab === "mail" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-4">
                    <MailCheck size={14} /> Email-to-Task Engine
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">
                    Không bao giờ thất lạc yêu cầu gửi qua Email
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Kết nối 1 chạm:</strong> Đăng nhập Gmail qua
                        Google OAuth2 an toàn, hỗ trợ nhiều tài khoản email cùng
                        lúc.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Bộ lọc [TASK] thông minh:</strong> Tự động lọc
                        thư có tag [TASK], giữ nguyên nội dung chi tiết, định
                        dạng và tệp đính kèm.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Truy vết nguồn gốc:</strong> Trên thẻ việc luôn
                        có liên kết đưa bạn quay lại đúng luồng email gốc chỉ
                        với 1 click.
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Visual Graphic */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 font-mono text-xs">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 text-slate-400">
                    <Mail size={16} className="text-red-500" />
                    <span>Hộp thư đến: khanh.do@company.com</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3 shadow-xs">
                    <div className="text-slate-500 text-[11px]">
                      Người gửi: sep@company.com
                    </div>
                    <div className="font-bold text-slate-800 my-1 text-[13px]">
                      [TASK] Hoàn thiện báo cáo tài chính quý 3 trước 17h thứ 6
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Gửi kèm file: KeHoachTaiChinh_Q3.xlsx
                    </div>
                  </div>
                  <div className="text-center my-2 text-sky-600 font-bold flex items-center justify-center gap-1">
                    <span>⬇️ Tự động chuyển thành</span>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg text-sky-950 font-sans shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-sky-800">
                        TSK-00109
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                        Khẩn cấp
                      </span>
                    </div>
                    <div className="text-xs font-bold">
                      Hoàn thiện báo cáo tài chính quý 3
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Hạn chót: 17:00 Thứ 6 này
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "zalo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4">
                    <Bot size={14} /> Trợ lý Ảo Zalo Bot
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">
                    Nhắc hạn tận tay trên ứng dụng Zalo quen thuộc
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Ghép nối siêu tốc:</strong> Nhận mã liên kết OTP
                        6 số, nhắn cho Zalo Bot để kích hoạt chỉ trong 10 giây.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Cảnh báo đa cấp:</strong> Tự động thông báo khi
                        có người giao việc mới, nhắc trước 24 giờ và trước 2 giờ
                        hạn chót.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Không làm phiền:</strong> Tin nhắn súc tích,
                        đính kèm đường dẫn xem chi tiết công việc ngay trên điện
                        thoại.
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Visual Graphic */}
                <div className="bg-[#e8f1fb] rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-blue-200/80">
                    <div className="size-8 rounded-full bg-blue-600 text-white grid place-items-center font-bold text-xs">
                      Z
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        TaskBox Assistant Bot
                      </div>
                      <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                        Trực tuyến
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-800 max-w-[90%]">
                      <div className="font-bold text-blue-700 flex items-center gap-1 mb-1">
                        <BellRing size={13} /> NHẮC NHỞ DEADLINE SẮP ĐẾN
                      </div>
                      <div>
                        Bạn có công việc cần hoàn thành trong{" "}
                        <strong>2 giờ tới</strong>:
                      </div>
                      <div className="my-1.5 p-2 bg-slate-50 rounded border border-slate-200 font-medium">
                        📌 <strong>TSK-00104:</strong> Soát xét hợp đồng đối tác
                        tháng 09
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hạn chót: <strong>Hôm nay, 17:00</strong>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-800 max-w-[90%]">
                      <div className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                        ✨ GIAO VIỆC MỚI
                      </div>
                      <div>
                        Anh Tuấn vừa gán bạn vào công việc:{" "}
                        <strong>Nâng cấp bộ cân bằng tải</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "kanban" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold mb-4">
                    <SquareKanban size={14} /> Không gian Kanban & Canvas
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">
                    Kéo thả trực quan, tối ưu hóa quy trình làm việc
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>4 Cột chuẩn hóa:</strong> Chờ xử lý, Đang làm,
                        Hoàn thành và Đã huỷ giúp quản lý trạng thái minh bạch.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Độ ưu tiên màu sắc:</strong> 4 mức ưu tiên (Khẩn
                        cấp, Cao, Bình thường, Thấp) giúp bạn luôn tập trung vào
                        việc quan trọng nhất.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Canvas & Markdown:</strong> Thỏa sức phác thảo ý
                        tưởng trên bảng Konva tự do và nạp nhanh danh mục việc
                        từ file Markdown.
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Visual Graphic */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                    <span>Cột: Đang thực hiện</span>
                    <span className="text-[11px] text-sky-600 font-normal">
                      Kéo thả để đổi cột
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border-2 border-dashed border-sky-400 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">
                        TSK-00098
                      </span>
                      <span className="text-sky-600 font-bold text-[10px]">
                        Đang kéo...
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      Nâng cấp bộ cân bằng tải & tối ưu hoá truy vấn
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="text-[11px] text-slate-500">
                        Ưu tiên cao
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">
                        TSK-00102
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Bình thường
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      Kiểm thử bảo mật định kỳ API Gateway
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold mb-4">
                    <Calendar size={14} /> Smart Recurrence & Calendar
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">
                    Lập kế hoạch dài hạn với thuật toán dự phóng thông minh
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>
                          Dự phóng việc lặp (Recurrence projection):
                        </strong>{" "}
                        Nhìn thấy trước toàn bộ các lượt lặp trong tương lai
                        trên lịch mà không làm rác cơ sở dữ liệu.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Linh hoạt quy tắc lặp:</strong> Cấu hình theo
                        ngày, các thứ trong tuần (ví dụ: T2, T4, T6) hoặc theo
                        ngày cố định trong tháng.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-teal-600 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>4 Chế độ hiển thị:</strong> Tháng, Tuần, Ngày
                        (Timeline) và Agenda danh sách sự kiện chi tiết.
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Visual Graphic */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200 mb-3 text-slate-800">
                    <span>Lịch công tác & Sự kiện tuần này</span>
                    <span className="text-[11px] text-purple-600 font-semibold">
                      Tháng 09/2026
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-500 text-[11px]">
                        Thứ 2
                      </div>
                      <div className="mt-1 text-[11px] p-1 rounded bg-blue-50 text-blue-800 font-semibold truncate">
                        Họp đầu tuần
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border-2 border-purple-400">
                      <div className="font-bold text-purple-800 text-[11px]">
                        Hôm nay (T4)
                      </div>
                      <div className="mt-1 text-[11px] p-1 rounded bg-purple-50 text-purple-900 font-semibold truncate">
                        Báo cáo Q3 (Email)
                      </div>
                      <div className="mt-1 text-[10px] text-rose-600 font-bold">
                        Hạn 17:00
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-500 text-[11px]">
                        Thứ 6
                      </div>
                      <div className="mt-1 text-[11px] p-1 rounded bg-slate-100 text-slate-700 font-semibold truncate">
                        Sao lưu DB (Lặp)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          WORKFLOW 4-STEPS (SƠ ĐỒ QUY TRÌNH 4 BƯỚC)
          ============================================================ */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0a436d] mb-3">
              Quy trình khép kín
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Từ ý tưởng đến khi hoàn tất chỉ với 4 bước đơn giản
            </h3>
            <p className="text-slate-600 mt-2">
              Luồng dữ liệu đồng bộ và tự động giúp đội ngũ của bạn tiết kiệm
              hàng giờ mỗi tuần.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#0a436d] to-[#0d5a8f] text-white grid place-items-center font-bold text-lg mb-5 shadow-lg shadow-[#0a436d]/20">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Tiếp nhận & Đồng bộ
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tạo task thủ công hoặc tự động nạp từ email Gmail có gắn thẻ
                [TASK] vào dự án thích hợp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#0d5a8f] to-[#0ea5e9] text-white grid place-items-center font-bold text-lg mb-5 shadow-lg shadow-[#0ea5e9]/20">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Phân loại & Lập kế hoạch
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gán mức độ ưu tiên, người phụ trách (assignee), thiết lập hạn
                chót và quy tắc lặp định kỳ.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-teal-500 text-white grid place-items-center font-bold text-lg mb-5 shadow-lg shadow-teal-500/20">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Thực thi & Tự động nhắc
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kéo thả trên Kanban, trợ lý Zalo Bot tự động gửi tin nhắc nhở
                khi hạn chót đến gần.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white grid place-items-center font-bold text-lg mb-5 shadow-lg shadow-emerald-600/20">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Đo lường & Hoàn thành
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đánh giá tỷ lệ hoàn thành đúng hạn (ON_TIME) và xuất báo cáo
                thống kê hiệu suất chi tiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CALL TO ACTION (CTA BANNER)
          ============================================================ */}
      <section className="py-16 bg-gradient-to-br from-[#0a436d] via-[#0d5a8f] to-[#0ea5e9] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-sky-200 text-xs font-semibold mb-6">
            <Zap size={14} /> Sẵn sàng bứt phá hiệu suất công việc
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Bắt đầu làm chủ công việc cùng TaskBox ngay hôm nay
          </h2>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Trải nghiệm nền tảng quản lý công việc hiện đại, kết nối Gmail và
            Zalo Bot tự động, bảo mật và hoàn toàn miễn phí.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-base font-bold text-[#0a436d] bg-white hover:bg-slate-100 px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
              style={{ color: "#0a436d" }}
            >
              <span style={{ color: "#0a436d" }}>Vào không gian làm việc</span>
              <ArrowRight size={18} style={{ color: "#0a436d" }} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-base font-semibold !text-white bg-white/20 hover:bg-white/30 border border-white/40 px-7 py-3.5 rounded-xl transition-all"
              style={{ color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>Đăng nhập / Đăng ký</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <span className="grid place-items-center size-7 rounded-lg bg-sky-600 text-white">
              <Inbox size={16} />
            </span>
            TaskBox
            <span className="text-slate-500 font-normal text-xs ml-2">
              © {new Date().getFullYear()} TaskBox Platform. All rights
              reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors"
            >
              Bảng điều khiển
            </Link>
            <Link
              href="/integrations"
              className="hover:text-white transition-colors"
            >
              Tích hợp Gmail & Zalo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
