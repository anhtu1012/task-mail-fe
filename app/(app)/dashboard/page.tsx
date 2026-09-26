"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, Col, Empty, List, Progress, Row, Skeleton, Statistic, Tag } from "antd";
import dayjs from "dayjs";
import {
  CalendarClock,
  CheckCircle2,
  Gauge,
  History,
  Mail,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTaskStats, useTasks } from "@/hooks/useTaskApp";
import {
  DEADLINE_META,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskStatus,
} from "@/models/task";

// recharts nặng (~100KB gzip) — tách chunk để số liệu hiện trước, biểu đồ vào sau
const TaskDistributionCharts = dynamic(
  () => import("@/components/dashboard/TaskDistributionCharts"),
  { ssr: false, loading: () => <Skeleton active paragraph={{ rows: 6 }} /> },
);

const fmt = (d?: string | null) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—");

function TaskMiniItem({ task }: { task: Task }) {
  return (
    <List.Item>
      <div className="flex w-full items-center gap-3">
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ background: PRIORITY_META[task.priority].color }}
          title={`Ưu tiên: ${PRIORITY_META[task.priority].label}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{task.code}</span>
            {task.sourceMailAccountId && (
              <Tag color="cyan" style={{ fontSize: 10, lineHeight: "16px" }}>
                <span className="inline-flex items-center gap-1">
                  <Mail size={10} /> Từ email
                </span>
              </Tag>
            )}
          </div>
          <div className="text-[13px] font-medium text-slate-700 truncate">
            {task.title}
          </div>
        </div>
        <div className="text-right shrink-0">
          <Tag color={STATUS_META[task.status].color}>
            {STATUS_META[task.status].label}
          </Tag>
          <div className="text-xs text-slate-400 mt-1">
            <CalendarClock size={11} className="inline -mt-0.5 mr-1" />
            {fmt(task.deadline)}
          </div>
        </div>
      </div>
    </List.Item>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useTaskStats();

  // Sắp đến hạn: deadline trong 7 ngày tới
  const upcomingParams = useMemo(
    () => ({
      from: dayjs().startOf("minute").toISOString(),
      to: dayjs().add(7, "day").endOf("day").toISOString(),
      limit: 20,
    }),
    [],
  );
  const { data: upcoming, isLoading: upcomingLoading } = useTasks(upcomingParams);

  /*
   * Mẫu task để tính phân bố trạng thái/ưu tiên (giới hạn 200 -> không phá
   * rate-limit). Backend luôn sắp `createdAt desc`, nên "task mới nhất" chính
   * là sáu phần tử đầu của mẫu này — trước đây trang gọi thêm một truy vấn
   * `limit: 6` chỉ để lấy đúng chỗ dữ liệu đã nằm sẵn trong tay.
   */
  const { data: distributionSample, isLoading: distributionLoading } = useTasks({
    limit: 200,
  });
  const recentItems = useMemo(
    () => (distributionSample?.items ?? []).slice(0, 6),
    [distributionSample],
  );
  const recentLoading = distributionLoading;

  const upcomingOpen = (upcoming?.items ?? []).filter(
    (t) => t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED,
  );

  const statCards = [
    {
      title: "Đã hoàn thành (tổng)",
      value: stats?.totalCompleted,
      icon: <CheckCircle2 size={20} />,
      color: "#2a9d8f",
    },
    {
      title: "Hoàn thành tháng này",
      value: stats?.completedInMonth,
      icon: <TrendingUp size={20} />,
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ===== Stat cards ===== */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card variant="borderless" style={{ height: "100%" }}>
              <div className="flex items-center justify-between">
                <Statistic
                  title={card.title}
                  value={card.value ?? 0}
                  loading={statsLoading}
                />
                <span
                  className="grid place-items-center size-11 rounded-xl text-white shrink-0"
                  style={{ background: card.color }}
                >
                  {card.icon}
                </span>
              </div>
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ height: "100%" }}>
            <div className="flex items-center gap-4">
              <Progress
                type="circle"
                size={64}
                percent={Math.round(stats?.completionRate ?? 0)}
                strokeColor="#2a9d8f"
              />
              <div>
                <div className="text-slate-500 text-sm">Tỷ lệ hoàn thành</div>
                <div className="text-xl font-semibold">
                  {statsLoading ? "…" : `${Math.round(stats?.completionRate ?? 0)}%`}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ height: "100%" }}>
            <div className="flex items-center gap-4">
              <span className="grid place-items-center size-11 rounded-xl bg-[#f4a261] text-white shrink-0">
                <Gauge size={20} />
              </span>
              <div className="flex-1">
                <div className="text-slate-500 text-sm">Hiệu suất đúng hạn</div>
                <div className="text-xl font-semibold">
                  {statsLoading ? "…" : `${Math.round(stats?.performanceMonth ?? 0)}%`}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    tháng này
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Toàn thời gian: {Math.round(stats?.performance ?? 0)}%
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ===== Biểu đồ phân bố ===== */}
      <div>
        <TaskDistributionCharts
          tasks={distributionSample?.items ?? []}
          loading={distributionLoading}
        />
        {(distributionSample?.total ?? 0) > 200 && (
          <div className="text-xs text-slate-400 mt-1.5">
            * Biểu đồ tính trên mẫu 200/{distributionSample?.total} công việc gần nhất
          </div>
        )}
      </div>

      {/* ===== Lists ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            title="⏰ Sắp đến hạn (7 ngày tới)"
            extra={<Link href="/tasks">Xem tất cả</Link>}
          >
            {upcomingLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : upcomingOpen.length ? (
              <List
                dataSource={upcomingOpen.slice(0, 6)}
                renderItem={(task) => <TaskMiniItem task={task} />}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có công việc nào sắp đến hạn"
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            title={
              <span className="inline-flex items-center gap-2">
                <History size={16} className="text-slate-400" />
                Công việc gần đây
              </span>
            }
            extra={<Link href="/tasks">Xem tất cả</Link>}
          >
            {recentLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : recentItems.length ? (
              <List
                dataSource={recentItems}
                renderItem={(task) => (
                  <List.Item>
                    <div className="flex w-full items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono shrink-0">
                        {task.code}
                      </span>
                      <span className="text-[13px] font-medium text-slate-700 truncate flex-1">
                        {task.title}
                      </span>
                      <Tag color={DEADLINE_META[task.deadlineStatus].color}>
                        {DEADLINE_META[task.deadlineStatus].label}
                      </Tag>
                      <Tag color={STATUS_META[task.status].color}>
                        {STATUS_META[task.status].label}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có công việc nào — tạo công việc đầu tiên ở mục Công việc"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
