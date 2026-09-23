"use client";
/**
 * Quản lý dự án: tạo, sửa, đặt mặc định, lưu trữ, xoá.
 *
 * Phân biệt LƯU TRỮ và XOÁ — hai việc khác hẳn nhau:
 *   - lưu trữ: ẩn khỏi bộ chọn, dữ liệu còn nguyên, mở lại được;
 *   - xoá: chỉ cho phép khi dự án không còn công việc (backend chặn bằng
 *     `PROJECT_NOT_EMPTY`), và không bao giờ xoá được dự án cuối cùng.
 */
import { useState } from "react";
import {
  App,
  Button,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { CSegmented } from "@/components/ui";
import type { ColumnsType } from "antd/es/table";
import {
  Archive,
  ArchiveRestore,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import ProjectIcon from "../_components/ProjectIcon";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import { projectApi } from "@/apis/project.api";
import {
  useArchiveProject,
  useCurrentProject,
  useDeleteProject,
  useProjects,
  useSetDefaultProject,
  useSwitchProject,
} from "@/hooks/useProjects";
import {
  Project,
  PROJECT_LIMIT,
  PROJECT_LIMIT_WARN_AT,
} from "@/models/project";

export default function ProjectsPage() {
  const { message } = App.useApp();
  const [scope, setScope] = useState<"active" | "all">("active");
  const [editing, setEditing] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useProjects(scope === "all");
  // Trần tính theo dự án HOẠT ĐỘNG — dự án đã lưu trữ không tính
  const activeCount = (data?.items ?? []).filter((p) => !p.archived).length;
  const atLimit = activeCount >= PROJECT_LIMIT;
  const { projectId } = useCurrentProject();
  const switchProject = useSwitchProject();
  const setDefault = useSetDefaultProject();
  const archive = useArchiveProject();
  const remove = useDeleteProject();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };

  const columns: ColumnsType<Project> = [
    {
      title: "Dự án",
      dataIndex: "name",
      render: (_, p) => (
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shrink-0"
            style={{ background: p.color }}
          >
            <ProjectIcon name={p.icon} size={17} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[14px] text-[#0f172a] truncate">
                {p.name}
              </span>
              {p.isDefault && (
                <Tag color="gold" bordered={false}>
                  Mặc định
                </Tag>
              )}
              {p.id === projectId && (
                <Tag color="processing" bordered={false}>
                  Đang mở
                </Tag>
              )}
              {p.archived && <Tag bordered={false}>Đã lưu trữ</Tag>}
            </div>
            <div className="text-[12.5px] text-[#94a3b8] truncate">
              {p.code}
              {p.description ? ` — ${p.description}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Đang mở",
      dataIndex: ["stats", "openTasks"],
      width: 110,
      align: "center",
      render: (v?: number) => v ?? 0,
    },
    {
      title: "Trễ hạn",
      dataIndex: ["stats", "overdueTasks"],
      width: 110,
      align: "center",
      render: (v?: number) =>
        v ? <span className="text-[#e63946] font-semibold">{v}</span> : 0,
    },
    {
      title: "Tổng việc",
      dataIndex: ["stats", "totalTasks"],
      width: 110,
      align: "center",
      render: (v?: number) => v ?? 0,
    },
    {
      title: "",
      key: "actions",
      width: 220,
      align: "right",
      render: (_, p) => (
        <div className="flex items-center justify-end gap-1">
          {p.id !== projectId && !p.archived && (
            <Button size="small" onClick={() => switchProject(p.id)}>
              Mở
            </Button>
          )}
          {!p.isDefault && !p.archived && (
            <Tooltip title="Đặt làm dự án mặc định">
              <Button
                size="small"
                type="text"
                icon={<Star size={15} />}
                loading={setDefault.isPending}
                onClick={() => setDefault.mutate(p.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Sửa">
            <Button
              size="small"
              type="text"
              icon={<Pencil size={15} />}
              onClick={() => openEdit(p)}
            />
          </Tooltip>
          <Tooltip title={p.archived ? "Mở lại" : "Lưu trữ"}>
            <Button
              size="small"
              type="text"
              icon={
                p.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />
              }
              onClick={() =>
                archive.mutate({ id: p.id, archived: !p.archived })
              }
            />
          </Tooltip>
          <Popconfirm
            title="Xoá dự án này?"
            description="Chỉ xoá được khi dự án không còn công việc."
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(p.id)}
          >
            <Tooltip title="Xoá">
              <Button size="small" type="text" danger icon={<Trash2 size={15} />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[18px] font-bold text-[#0f172a]">Dự án</div>
          <div className="text-[13px] text-[#64748b]">
            Công việc, bảng và lịch đều thuộc về đúng một dự án.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CSegmented
            value={scope}
            onChange={(v) => setScope(v as "active" | "all")}
            options={[
              { label: "Đang hoạt động", value: "active" },
              { label: "Cả đã lưu trữ", value: "all" },
            ]}
          />
          <Tooltip
            title={
              atLimit
                ? `Đã đạt trần ${PROJECT_LIMIT} dự án hoạt động. Lưu trữ bớt để tạo thêm.`
                : ""
            }
          >
            <Button
              type="primary"
              icon={<Plus size={15} />}
              disabled={atLimit}
              onClick={openCreate}
            >
              Dự án mới
            </Button>
          </Tooltip>
        </div>
      </div>

      {activeCount >= PROJECT_LIMIT_WARN_AT && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Bạn đang dùng <b>{activeCount}/{PROJECT_LIMIT}</b> dự án hoạt động.
          Lưu trữ những dự án đã xong để dành chỗ — dự án lưu trữ không tính vào
          trần này.
        </div>
      )}

      {projectApi.isMock && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Backend chưa có API dự án — đang chạy <b>dữ liệu mẫu lưu trên máy
          bạn</b>. Thao tác ở đây không đồng bộ sang thiết bị khác, và công việc
          vẫn chưa thật sự được tách theo dự án. Hợp đồng API cần thiết nằm ở{" "}
          <code>docs/backend/project-api-spec.md</code>.
        </div>
      )}

      <Table<Project>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items ?? []}
        columns={columns}
        pagination={false}
        onRow={(p) => ({
          onDoubleClick: () => {
            if (p.archived) {
              message.info("Dự án đã lưu trữ — mở lại trước khi dùng.");
              return;
            }
            switchProject(p.id);
          },
        })}
      />

      <ProjectFormModal
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
