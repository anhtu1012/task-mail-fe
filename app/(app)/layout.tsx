"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Drawer, Dropdown, Grid, Spin, Tooltip } from "antd";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu as MenuIcon,
  Palette,
  PlugZap,
  SquareKanban,
  StickyNote,
  Tags,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/apis/auth.api";
import { boardApi } from "@/apis/board.api";
import { BOARD_QUERY_KEY } from "@/hooks/boardKeys";
import { useAppSelector } from "@/store/hooks";
import { useMe } from "@/hooks/useTaskApp";
import { useClearProject, useCurrentProject } from "@/hooks/useProjects";
import { ROLE_META, isAdminRole } from "@/models/task";
import { getCookie } from "@/utils/client/getCookie";
import {
  clearThemeSession,
  useAppTheme,
  useThemeSync,
} from "@/contexts/ThemeContext";
import ThemeSettings from "@/components/global/ThemeSettings/ThemeSettings";
import InstallAppBanner from "@/components/global/InstallApp/InstallAppBanner";
import { QuickAddSheet } from "@/components/mobile/QuickAddSheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileTabBar from "./_components/MobileTabBar";
import ProjectSwitcher from "./_components/ProjectSwitcher";
import SyncIndicator from "./_components/SyncIndicator";
import styles from "./layout.module.scss";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // Thanh tab dưới cùng — xem hooks/useIsMobile vì sao tách khỏi `isMobile`
  const showTabBar = useIsMobile();
  const [tokenChecked, setTokenChecked] = useState(false);

  const { setSettingsOpen } = useAppTheme();
  // Lấy cài đặt giao diện của tài khoản từ server (nếu backend đã có)
  useThemeSync();
  const { data: me, isLoading } = useMe();
  const admin = isAdminRole(me?.role);
  const {
    projectId,
    needsSelection,
    isLoading: projectsLoading,
  } = useCurrentProject();
  const clearProject = useClearProject();
  const queryClient = useQueryClient();

  // Guard: chưa có accessToken -> thử refresh_token, thất bại mới về /login
  useEffect(() => {
    let cancelled = false;
    const check = getCookie("accessToken")
      ? Promise.resolve(true)
      : authApi.restoreSession();
    check.then((ok) => {
      if (cancelled) return;
      if (ok) setTokenChecked(true);
      else router.replace("/login");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * Mở thẳng vào bảng: gọi snapshot NGAY, song song với `/auth/me` và
   * `/projects`, thay vì đợi hai cái đó xong (trang chưa qua chốt chặn bên
   * dưới thì BoardProvider chưa mount, nên chưa gọi được) — bớt hẳn một vòng
   * mạng lúc mở app. Dùng dự án đã lưu từ lần trước; nếu nó hoá ra không còn
   * hợp lệ, `useCurrentProject` sẽ dọn lựa chọn và trang chọn dự án xoá cache
   * bảng như thường, nên dữ liệu tải trước không bao giờ được hiển thị sai.
   * BoardProvider gắn vào sau sẽ dùng lại kết quả này (staleTime 30s).
   */
  const persisted = useAppSelector((s) => s.project);
  useEffect(() => {
    if (!pathname.startsWith("/boards/") || !getCookie("accessToken")) return;
    const { currentProjectId, ownerUserId } = persisted;
    if (!currentProjectId || !ownerUserId) return;
    void queryClient.prefetchQuery({
      queryKey: BOARD_QUERY_KEY,
      queryFn: () => boardApi.snapshot(currentProjectId),
      staleTime: 30_000,
    });
    // Chỉ một lần lúc mở app — các lần sau BoardProvider tự lo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh token thất bại / session hết hạn -> interceptor bắn event này
  useEffect(() => {
    const onUnauthorized = () => router.replace("/login");
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, [router]);

  // Chưa chọn dự án (lần đầu đăng nhập, hoặc dự án cũ đã bị xoá/lưu trữ) thì
  // không cho vào trong: mọi truy vấn task/board đều cần projectId.
  useEffect(() => {
    if (needsSelection) router.replace("/select-project");
  }, [needsSelection, router]);

  // Đóng drawer nav mobile mỗi khi chuyển trang
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const menuItems = useMemo(() => {
    const items = [
      {
        key: "/dashboard",
        icon: <LayoutDashboard size={19} />,
        label: "Tổng quan",
      },
      {
        key: "/today",
        icon: <CalendarCheck size={19} />,
        label: "Hôm nay",
      },
      {
        key: "/tasks",
        icon: <ListChecks size={19} />,
        label: "Công việc",
      },
      {
        key: "/kanban",
        icon: <SquareKanban size={19} />,
        label: "Bảng Kanban",
      },
      {
        key: "/boards",
        icon: <Columns3 size={19} />,
        label: "Bảng công việc",
      },
      {
        key: "/notes",
        icon: <StickyNote size={19} />,
        label: "Ghi chú",
      },
      {
        key: "/calendar",
        icon: <CalendarDays size={19} />,
        label: "Lịch",
      },
      {
        key: "/projects",
        icon: <FolderKanban size={19} />,
        label: "Dự án",
      },
      {
        key: "/integrations",
        icon: <PlugZap size={19} />,
        label: "Tích hợp",
      },
    ];
    if (admin) {
      // Chỉ admin được CRUD loại công việc — chèn ngay trước mục Tích hợp
      items.splice(items.findIndex((i) => i.key === "/integrations"), 0, {
        key: "/task-types",
        icon: <Tags size={19} />,
        label: "Loại công việc",
      });
      items.push({
        key: "/announcements",
        icon: <Megaphone size={19} />,
        label: "Gửi thông báo",
      });
    }
    return items;
  }, [admin]);

  const selectedKey =
    menuItems
      .map((item) => item.key)
      .find((key) => pathname.startsWith(key)) ?? "/dashboard";

  const handleLogout = async () => {
    await authApi.logoutSession();
    // logoutSession xoá sạch localStorage -> dọn nốt state đang giữ trong bộ nhớ
    clearThemeSession();
    // Người kế tiếp đăng nhập trên máy này phải tự chọn dự án của họ
    clearProject();
    // Xoá cả cache dữ liệu: không thì người đăng nhập kế tiếp trên cùng tab
    // thoáng thấy việc / bảng (kể cả bản cất theo dự án) của người trước
    queryClient.clear();
    router.replace("/login");
  };

  if (!tokenChecked || (isLoading && !me) || (projectsLoading && !projectId)) {
    return (
      <div className={styles.loader}>
        <Spin size="large" />
      </div>
    );
  }

  /** Rail: dán sát mép trái, cong cạnh phải, chỉ hiện icon */
  const rail = (inDrawer = false) => (
    <aside
      className={`${styles.rail} ${inDrawer ? styles.drawerRail : ""}`}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <span>
            <ClipboardList size={20} />
          </span>
        </span>
        <span className={styles.brandName}>TaskFlow</span>
      </div>

      <ProjectSwitcher />

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          // <Link> chứ không phải <button> + router.push: là thẻ <a> thật thì
          // Ctrl/Cmd + click, chuột giữa, "Mở trong tab mới" đều dùng được
          <Link
            key={item.key}
            href={item.key}
            className={`${styles.navItem} ${
              selectedKey === item.key ? styles.navItemActive : ""
            }`}
            aria-label={item.label}
            aria-current={selectedKey === item.key ? "page" : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.railFooter}>
        <Tooltip title="Giao diện" placement="right">
          <button
            type="button"
            className={styles.userButton}
            aria-label="Cài đặt giao diện"
            onClick={() => setSettingsOpen(true)}
          >
            <span className={styles.userAvatar}>
              <span className={styles.themeDot}>
                <Palette size={17} />
              </span>
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userEmail}>Giao diện</span>
            </span>
          </button>
        </Tooltip>

        <Dropdown
          trigger={["click"]}
          placement="topLeft"
          menu={{
            items: [
              {
                key: "logout",
                danger: true,
                icon: <LogOut size={15} />,
                label: "Đăng xuất",
                onClick: handleLogout,
              },
            ],
          }}
        >
          <button type="button" className={styles.userButton} aria-label="Tài khoản">
            <span className={styles.userAvatar}>
              <Avatar style={{ background: "#0a436d", fontWeight: 600 }} size={36}>
                {me?.email?.[0]?.toUpperCase() ?? "?"}
              </Avatar>
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userEmail}>{me?.email}</span>
              {me?.role && (
                <span className={styles.userRole}>{ROLE_META[me.role].label}</span>
              )}
            </span>
          </button>
        </Dropdown>
      </div>
    </aside>
  );

  return (
    <div className={`${styles.shell} ${showTabBar ? styles.shellWithTabs : ""}`}>
      {!isMobile && rail()}

      {isMobile && (
        <>
          <Drawer
            placement="left"
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            closable={false}
            size={236}
            styles={{
              body: { padding: 0, background: "#0a2c47" },
              section: { background: "#0a2c47" },
            }}
          >
            {rail(true)}
          </Drawer>
          {/* Có thanh tab thì nút Menu nằm trong đó — nút nổi chỉ còn là dự phòng */}
          {!showTabBar && (
            <button
              type="button"
              aria-label="Mở menu"
              className={styles.mobileFab}
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
          )}
        </>
      )}

      {showTabBar && (
        <>
          <MobileTabBar
            onQuickAdd={() => setQuickAddOpen(true)}
            onMenu={() => setMobileNavOpen(true)}
          />
          <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
        </>
      )}

      <main className={styles.main}>
        <SyncIndicator />
        <div className={styles.content}>
          {showTabBar && <InstallAppBanner />}
          {children}
        </div>
      </main>

      <ThemeSettings />
    </div>
  );
}
