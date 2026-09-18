"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Drawer, Dropdown, Grid, Spin, Tooltip } from "antd";
import {
  CalendarDays,
  ClipboardList,
  Columns3,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu as MenuIcon,
  Palette,
  PlugZap,
  SquareKanban,
  Tags,
} from "lucide-react";
import { authApi } from "@/apis/auth.api";
import { useMe } from "@/hooks/useTaskApp";
import { ROLE_META, isAdminRole } from "@/models/task";
import { getCookie } from "@/utils/client/getCookie";
import {
  clearThemeSession,
  useAppTheme,
  useThemeSync,
} from "@/contexts/ThemeContext";
import ThemeSettings from "@/components/global/ThemeSettings/ThemeSettings";
import styles from "./layout.module.scss";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  const { setSettingsOpen } = useAppTheme();
  // Lấy cài đặt giao diện của tài khoản từ server (nếu backend đã có)
  useThemeSync();
  const { data: me, isLoading } = useMe();
  const admin = isAdminRole(me?.role);

  // Guard: chưa có accessToken -> về /login
  useEffect(() => {
    if (!getCookie("accessToken")) {
      router.replace("/login");
    } else {
      setTokenChecked(true);
    }
  }, [router]);

  // Refresh token thất bại / session hết hạn -> interceptor bắn event này
  useEffect(() => {
    const onUnauthorized = () => router.replace("/login");
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, [router]);

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
        key: "/calendar",
        icon: <CalendarDays size={19} />,
        label: "Lịch",
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
    router.replace("/login");
  };

  if (!tokenChecked || (isLoading && !me)) {
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

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => router.push(item.key)}
            className={`${styles.navItem} ${
              selectedKey === item.key ? styles.navItemActive : ""
            }`}
            aria-label={item.label}
            aria-current={selectedKey === item.key ? "page" : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
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
    <div className={styles.shell}>
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
          <button
            type="button"
            aria-label="Mở menu"
            className={styles.mobileFab}
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon size={22} />
          </button>
        </>
      )}

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>

      <ThemeSettings />
    </div>
  );
}
