"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Dropdown, Layout, Menu, Spin, Tag, Typography } from "antd";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlugZap,
  SquareKanban,
  Tags,
} from "lucide-react";
import { authApi } from "@/apis/auth.api";
import { useMe } from "@/hooks/useTaskApp";
import { ROLE_META, isAdminRole } from "@/models/task";
import { getCookie } from "@/utils/client/getCookie";

const { Sider, Header, Content } = Layout;

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

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

  const menuItems = useMemo(() => {
    const items = [
      {
        key: "/dashboard",
        icon: <LayoutDashboard size={17} />,
        label: "Tổng quan",
      },
      {
        key: "/tasks",
        icon: <ListChecks size={17} />,
        label: "Công việc",
      },
      {
        key: "/kanban",
        icon: <SquareKanban size={17} />,
        label: "Bảng Kanban",
      },
      {
        key: "/calendar",
        icon: <CalendarDays size={17} />,
        label: "Lịch",
      },
      {
        key: "/integrations",
        icon: <PlugZap size={17} />,
        label: "Tích hợp",
      },
    ];
    if (admin) {
      // Chỉ admin được CRUD loại công việc
      items.splice(4, 0, {
        key: "/task-types",
        icon: <Tags size={17} />,
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
    router.replace("/login");
  };

  if (!tokenChecked || (isLoading && !me)) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f8fa]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={232}
        theme="dark"
        style={{ background: "#0a2c47" }}
      >
        <div className="flex items-center gap-2.5 px-5 h-16">
          <span className="grid place-items-center size-9 rounded-lg bg-white/15 text-white shrink-0">
            <ClipboardList size={20} />
          </span>
          {!collapsed && (
            <span className="text-white font-bold text-lg tracking-tight">
              TaskFlow
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ background: "transparent", padding: "0 8px" }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <Typography.Text strong style={{ fontSize: 16 }}>
            {menuItems.find((item) => item.key === selectedKey)?.label}
          </Typography.Text>

          <Dropdown
            trigger={["click"]}
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
            <button className="flex items-center gap-3 cursor-pointer bg-transparent border-0 px-2 py-1 rounded-lg hover:bg-slate-50">
              <Avatar
                style={{ background: "#0a436d", fontWeight: 600 }}
                size={34}
              >
                {me?.email?.[0]?.toUpperCase() ?? "?"}
              </Avatar>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-medium text-slate-700 max-w-[200px] truncate">
                  {me?.email}
                </span>
                {me?.role && (
                  <Tag
                    color={ROLE_META[me.role].color}
                    style={{ marginTop: 2, fontSize: 11, lineHeight: "16px" }}
                  >
                    {ROLE_META[me.role].label}
                  </Tag>
                )}
              </span>
            </button>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: "#f7f8fa" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
