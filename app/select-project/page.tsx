"use client";
/**
 * Màn hình chọn dự án — cửa vào bắt buộc sau khi đăng nhập.
 *
 * Nằm NGOÀI nhóm route `(app)` là có chủ đích: layout của `(app)` đẩy người
 * dùng về đây khi chưa chọn dự án, nên nếu trang này nằm trong đó thì thành
 * vòng chuyển hướng vô tận. Đổi lại, trang tự lo phần canh cổng đăng nhập.
 *
 * Ba tình huống trang phải xử lý:
 *   - có dự án mặc định và người dùng chưa chọn gì -> vào thẳng, không bắt bấm;
 *   - có nhiều dự án -> hiện lưới thẻ để chọn;
 *   - chưa có dự án nào -> mời tạo dự án đầu tiên.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Empty, Input, Spin, Typography } from "antd";
import {
  ArrowRight,
  ClipboardList,
  LogOut,
  Plus,
  RotateCw,
  Search,
  Star,
  TriangleAlert,
} from "lucide-react";
import { authApi } from "@/apis/auth.api";
import ProjectIcon from "@/app/(app)/_components/ProjectIcon";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import { useMe } from "@/hooks/useTaskApp";
import {
  useClearProject,
  useCurrentProject,
  useSwitchProject,
} from "@/hooks/useProjects";
import { Project } from "@/models/project";
import { clearThemeSession } from "@/contexts/ThemeContext";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { getCookie } from "@/utils/client/getCookie";

/**
 * Trang đầu tiên sau khi vào dự án: điện thoại vào thẳng tab "Hôm nay" (Tổng
 * quan không có trên thanh tab mobile), máy tính vào Tổng quan như cũ. Cùng
 * ngưỡng 768px với `useIsMobile`.
 */
function landingPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  return window.matchMedia("(max-width: 767.98px)").matches ? "/today" : "/dashboard";
}

export default function SelectProjectPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const { project, projects, isLoading, isEmpty, error, refetch } =
    useCurrentProject();
  const switchProject = useSwitchProject();
  const clearProject = useClearProject();

  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  /** Người dùng chủ động vào đây để đổi dự án -> đừng tự động nhảy đi */
  const [manual] = useState(() => !!project);

  // Canh cổng: trang này ngoài nhóm (app) nên không hưởng guard của layout đó
  useEffect(() => {
    if (!getCookie("accessToken")) router.replace("/login");
  }, [router]);

  // Có sẵn dự án mặc định thì vào luôn — bắt bấm thêm một lần là thừa
  useEffect(() => {
    if (manual || isLoading || !me || project) return;
    const fallback = projects.find((p) => p.isDefault);
    if (fallback) {
      switchProject(fallback.id);
      router.replace(landingPath());
    }
  }, [manual, isLoading, me, project, projects, switchProject, router]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw),
    );
  }, [projects, keyword]);

  const enter = (p: Project) => {
    switchProject(p.id);
    router.replace(landingPath());
  };

  const logout = async () => {
    await authApi.logoutSession();
    clearThemeSession();
    clearProject();
    router.replace("/login");
  };

  return (
    <div className="app-themed-bg min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-[1000px]">
        {/* Đầu trang */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-11 rounded-xl bg-[#0a436d] text-white">
              <ClipboardList size={22} />
            </span>
            <div>
              <div className="text-[19px] font-bold text-[#0f172a] leading-tight">
                Chọn dự án
              </div>
              <div className="text-[13px] text-[#64748b]">
                {me?.email ?? "…"} — công việc, bảng và lịch đều tính theo dự án
                bạn chọn
              </div>
            </div>
          </div>
          <Button icon={<LogOut size={15} />} onClick={logout}>
            Đăng xuất
          </Button>
        </div>

        {isLoading && !projects.length ? (
          <div className="grid place-items-center py-24">
            <Spin size="large" />
          </div>
        ) : error && !projects.length ? (
          /* Không tải được danh sách: nói rõ vì sao, đừng để màn hình trống */
          <div className="rounded-2xl bg-white/85 border border-[#e2e8f0] py-16 px-6 text-center">
            <span className="inline-grid place-items-center size-12 rounded-full bg-[#fef2f2] text-[#e63946] mb-4">
              <TriangleAlert size={24} />
            </span>
            <div className="font-semibold text-[15px] text-[#0f172a]">
              Không tải được danh sách dự án
            </div>
            <div className="text-[13px] text-[#64748b] mt-1 mb-5">
              {getApiErrorMessage(error)}
            </div>
            <Button icon={<RotateCw size={15} />} onClick={refetch}>
              Thử lại
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="rounded-2xl bg-white/85 border border-[#e2e8f0] py-16">
            <Empty
              description={
                <div className="text-[#475569]">
                  Bạn chưa có dự án nào. Tạo dự án đầu tiên để bắt đầu.
                </div>
              }
            >
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => setFormOpen(true)}
              >
                Tạo dự án đầu tiên
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <Input
                allowClear
                size="large"
                prefix={<Search size={16} color="#94a3b8" />}
                placeholder="Tìm dự án theo tên hoặc mã"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ maxWidth: 360 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<Plus size={16} />}
                onClick={() => setFormOpen(true)}
              >
                Dự án mới
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => enter(p)}
                  className="group text-left rounded-2xl border border-[#e2e8f0] bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-[#0ea5e9] hover:shadow-[0_18px_38px_-26px_rgba(10,67,109,0.65)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="grid place-items-center size-11 rounded-xl text-white"
                      style={{ background: p.color }}
                    >
                      <ProjectIcon name={p.icon} size={20} />
                    </span>
                    {p.isDefault && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#f59e0b]">
                        <Star size={13} fill="#f59e0b" /> Mặc định
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-[15px] text-[#0f172a] truncate">
                    {p.name}
                  </div>
                  <div className="text-[12.5px] text-[#94a3b8] mb-3">
                    {p.code}
                  </div>
                  <div className="text-[13px] text-[#64748b] line-clamp-2 min-h-[38px]">
                    {p.description || "Chưa có mô tả"}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f1f5f9]">
                    <div className="flex gap-4 text-[12.5px]">
                      <span className="text-[#475569]">
                        <b>{p.stats?.openTasks ?? 0}</b> đang mở
                      </span>
                      {!!p.stats?.overdueTasks && (
                        <span className="text-[#e63946]">
                          <b>{p.stats.overdueTasks}</b> trễ hạn
                        </span>
                      )}
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-[#cbd5e1] transition group-hover:text-[#0ea5e9] group-hover:translate-x-1"
                    />
                  </div>
                </button>
              ))}
            </div>

            {!filtered.length && (
              <div className="py-16">
                <Empty description="Không có dự án nào khớp từ khoá" />
              </div>
            )}

            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 28, fontSize: 12.5 }}
            >
              Đổi dự án bất cứ lúc nào ở ô dự án trên cùng thanh điều hướng bên
              trái.
            </Typography.Paragraph>
          </>
        )}
      </div>

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(p) => enter(p)}
      />
    </div>
  );
}
