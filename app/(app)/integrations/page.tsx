"use client";

import { useEffect, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  List,
  Popconfirm,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {
  BellRing,
  Bot,
  CheckCircle2,
  ExternalLink,
  Link2,
  Mail,
  MailPlus,
  Trash2,
  Unlink,
} from "lucide-react";
import { integrationApi } from "@/apis/integration.api";
import {
  useMailAccounts,
  useMe,
  useRemoveMailAccount,
  useZaloBotStatus,
  useZaloLinkStatus,
} from "@/hooks/useTaskApp";
import { ZaloLinkCode, isAdminRole } from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";

export default function IntegrationsPage() {
  const { message } = App.useApp();
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  // ================= GMAIL =================
  const {
    data: mailAccounts,
    isLoading: mailLoading,
    refetch: refetchMail,
  } = useMailAccounts();
  const removeMailAccount = useRemoveMailAccount();
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setConnecting(false);
  };
  useEffect(() => stopPolling, []);

  const handleConnectGmail = async () => {
    try {
      setConnecting(true);
      const { url } = await integrationApi.getGoogleConnectUrl();
      const popup = window.open(url, "gmail-connect", "width=560,height=680");
      // Theo dõi popup: đóng -> refetch danh sách hộp thư (nhẹ nhàng, tránh rate limit)
      pollRef.current = setInterval(() => {
        if (!popup || popup.closed) {
          stopPolling();
          refetchMail();
        }
      }, 1500);
    } catch (error) {
      stopPolling();
      message.error(getApiErrorMessage(error));
    }
  };

  // ================= ZALO =================
  const {
    data: zalo,
    isLoading: zaloLoading,
    refetch: refetchZalo,
  } = useZaloLinkStatus();
  const [linkCode, setLinkCode] = useState<ZaloLinkCode | null>(null);
  const [creatingCode, setCreatingCode] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Khi đang chờ user nhắn code cho bot: poll trạng thái mỗi 10s tới khi hết hạn
  useEffect(() => {
    if (!linkCode || zalo?.linked) return;
    const timer = setInterval(() => {
      if (dayjs().isAfter(dayjs(linkCode.expiresAt))) {
        setLinkCode(null);
      } else {
        refetchZalo();
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [linkCode, zalo?.linked, refetchZalo]);

  useEffect(() => {
    if (zalo?.linked && linkCode) {
      setLinkCode(null);
      message.success("Liên kết Zalo thành công");
    }
  }, [zalo?.linked, linkCode, message]);

  const handleCreateLinkCode = async () => {
    setCreatingCode(true);
    try {
      setLinkCode(await integrationApi.createZaloLinkCode());
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setCreatingCode(false);
    }
  };

  const handleUnlinkZalo = async () => {
    setUnlinking(true);
    try {
      await integrationApi.unlinkZalo();
      message.success("Đã huỷ liên kết Zalo");
      setLinkCode(null);
      refetchZalo();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setUnlinking(false);
    }
  };

  // ================= ZALO BOT (admin) =================
  const { data: botStatus } = useZaloBotStatus(admin);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ===== GMAIL ===== */}
      <Card
        variant="borderless"
        title={
          <span className="inline-flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-lg bg-red-50 text-red-500">
              <Mail size={17} />
            </span>
            Gmail — Tự tạo công việc từ email
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<MailPlus size={15} />}
            loading={connecting}
            onClick={handleConnectGmail}
          >
            Kết nối Gmail
          </Button>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Sau khi kết nối, hệ thống tự quét hộp thư <b>mỗi 5 phút</b>: email có
          tiêu đề bắt đầu bằng <Tag style={{ margin: 0 }}>[TASK]</Tag> sẽ được
          chuyển thành công việc (tự nhận diện deadline, độ ưu tiên, người được
          giao và tệp đính kèm từ nội dung email).
        </Typography.Paragraph>

        {mailLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : mailAccounts?.length ? (
          <List
            dataSource={mailAccounts}
            renderItem={(account) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="remove"
                    title="Ngắt kết nối hộp thư này?"
                    description="Task đã tạo từ email vẫn được giữ nguyên."
                    okText="Ngắt kết nối"
                    okButtonProps={{ danger: true }}
                    cancelText="Huỷ"
                    onConfirm={() => removeMailAccount.mutate(account.id)}
                  >
                    <Button danger type="text" icon={<Trash2 size={15} />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span className="grid place-items-center size-10 rounded-full bg-slate-100">
                      📧
                    </span>
                  }
                  title={account.email}
                  description={`Kết nối ngày ${dayjs(account.createdAt).format("DD/MM/YYYY")}`}
                />
                <Tag color="green">Đang hoạt động</Tag>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa kết nối hộp thư nào"
          />
        )}
      </Card>

      {/* ===== ZALO ===== */}
      <Card
        variant="borderless"
        title={
          <span className="inline-flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-lg bg-blue-50 text-blue-500">
              <BellRing size={17} />
            </span>
            Zalo — Nhận thông báo & nhắc deadline
          </span>
        }
        extra={
          zalo?.linked && (
            <Popconfirm
              title="Huỷ liên kết Zalo?"
              description="Bạn sẽ không nhận được nhắc deadline nữa."
              okText="Huỷ liên kết"
              okButtonProps={{ danger: true }}
              cancelText="Đóng"
              onConfirm={handleUnlinkZalo}
            >
              <Button danger icon={<Unlink size={15} />} loading={unlinking}>
                Huỷ liên kết
              </Button>
            </Popconfirm>
          )
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Liên kết Zalo để bot tự nhắn tin khi bạn <b>được giao task mới</b> và{" "}
          <b>nhắc trước khi đến hạn</b>. Đây là kênh thông báo duy nhất của hệ
          thống.
        </Typography.Paragraph>

        {zaloLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : zalo?.linked ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <div>
              <div className="font-medium text-emerald-800">
                Đã liên kết Zalo
              </div>
              {zalo.linkedAt && (
                <div className="text-xs text-emerald-700/70">
                  Từ ngày {dayjs(zalo.linkedAt).format("DD/MM/YYYY HH:mm")}
                </div>
              )}
            </div>
          </div>
        ) : linkCode ? (
          <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-5 text-center">
            <div className="text-slate-500 text-sm mb-2">
              Gửi mã này cho bot Zalo (hết hạn{" "}
              {dayjs(linkCode.expiresAt).format("HH:mm")}):
            </div>
            <div className="text-4xl font-extrabold tracking-[0.35em] text-[#0a436d] mb-4 select-all">
              {linkCode.code}
            </div>
            <div className="flex justify-center gap-2">
              <Button
                type="primary"
                icon={<ExternalLink size={15} />}
                href={linkCode.botProfileUrl}
                target="_blank"
              >
                Mở bot Zalo
              </Button>
              <Button onClick={() => refetchZalo()}>Tôi đã gửi mã</Button>
            </div>
            <div className="text-xs text-slate-400 mt-3">
              Trang sẽ tự cập nhật sau khi bot xác nhận.
            </div>
          </div>
        ) : (
          <Button
            type="primary"
            icon={<Link2 size={15} />}
            loading={creatingCode}
            onClick={handleCreateLinkCode}
          >
            Tạo mã liên kết Zalo
          </Button>
        )}
      </Card>

      {/* ===== ZALO BOT STATUS (admin) ===== */}
      {admin && (
        <Card
          variant="borderless"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="grid place-items-center size-8 rounded-lg bg-violet-50 text-violet-500">
                <Bot size={17} />
              </span>
              Trạng thái Zalo Bot (quản trị)
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-8">
            <Statistic
              title="Kết nối"
              valueRender={() =>
                botStatus?.connected ? (
                  <Tag color="green" style={{ fontSize: 14, padding: "2px 12px" }}>
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
              title="Người dùng đã liên kết"
              value={botStatus?.linkedUsers ?? 0}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
