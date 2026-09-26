"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Statistic, Tag, Typography } from "antd";
import { useMe, useZaloBotStatus } from "@/hooks/useTaskApp";
import { isAdminRole } from "@/models/task";
import { ZaloBroadcastCard } from "./_components/ZaloBroadcastCard";

/** Chỉ ADMIN/SUPER_ADMIN: gửi thông báo hệ thống cho mọi user qua Zalo. */
export default function AnnouncementsPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);
  const { data: botStatus } = useZaloBotStatus(admin);

  // Layout chỉ render trang khi đã có `me` — user thường vào thẳng link thì đẩy về 403
  useEffect(() => {
    if (me && !admin) router.replace("/403");
  }, [me, admin, router]);

  if (!admin) return null;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Gửi thông báo
        </Typography.Title>
        <Typography.Text type="secondary">
          Nhắn tin qua bot Zalo tới mọi người dùng đã liên kết Zalo — báo cập
          nhật hệ thống, hướng dẫn cài app trên điện thoại… Không lưu lịch sử
          gửi.
        </Typography.Text>
      </div>

      <Card variant="borderless">
        <div className="flex flex-wrap items-center gap-8">
          <Statistic
            title="Bot Zalo"
            valueRender={() =>
              botStatus?.connected ? (
                <Tag
                  color="green"
                  style={{ fontSize: 14, padding: "2px 12px" }}
                >
                  Đang hoạt động
                </Tag>
              ) : (
                <Tag color="red" style={{ fontSize: 14, padding: "2px 12px" }}>
                  Mất kết nối
                </Tag>
              )
            }
          />
          <Statistic title="Tên bot" value={botStatus?.botName ?? "—"} />
          <Statistic
            title="Người nhận (đã liên kết Zalo)"
            value={botStatus?.linkedUsers ?? 0}
          />
        </div>
      </Card>

      <ZaloBroadcastCard botStatus={botStatus} />
    </div>
  );
}
