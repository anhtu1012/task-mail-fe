"use client";

import { Card, Col, Empty, Row } from "antd";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/models/task";

/** Đếm số lượng task theo từng giá trị enum, giữ đúng thứ tự cố định của enum */
function countBy<E extends string>(
  tasks: Task[],
  field: "status" | "priority",
  order: E[],
): { key: E; count: number }[] {
  const counts = new Map<E, number>(order.map((k) => [k, 0]));
  tasks.forEach((task) => {
    const value = task[field] as E;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return order.map((key) => ({ key, count: counts.get(key) ?? 0 }));
}

export default function TaskDistributionCharts({
  tasks,
  loading,
}: {
  tasks: Task[];
  loading?: boolean;
}) {
  const hasData = tasks.length > 0;

  const statusData = countBy<TaskStatus>(
    tasks,
    "status",
    Object.values(TaskStatus),
  ).map(({ key, count }) => ({
    name: STATUS_META[key].label,
    value: count,
    color: STATUS_COLOR[key],
  }));

  const priorityData = countBy<TaskPriority>(
    tasks,
    "priority",
    Object.values(TaskPriority),
  ).map(({ key, count }) => ({
    name: PRIORITY_META[key].label,
    value: count,
    color: PRIORITY_META[key].color,
  }));

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card variant="borderless" title="Phân bố theo trạng thái" loading={loading}>
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} công việc`, name]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Chưa có dữ liệu" />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card variant="borderless" title="Phân bố theo độ ưu tiên" loading={loading}>
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} barSize={36}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                  formatter={(value) => [`${value} công việc`, "Số lượng"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Chưa có dữ liệu" />
          )}
        </Card>
      </Col>
    </Row>
  );
}

/** Màu trạng thái — dùng đúng ngữ nghĩa status (good/info/neutral/critical), khớp Tag màu đã dùng trong Tasks table */
const STATUS_COLOR: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "#94a3b8",
  [TaskStatus.IN_PROGRESS]: "#0ea5e9",
  [TaskStatus.DONE]: "#2a9d8f",
  [TaskStatus.CANCELLED]: "#e63946",
};
