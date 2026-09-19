"use client";
/**
 * Bộ chọn dự án nằm trong thanh điều hướng.
 *
 * Thu gọn: chỉ ô vuông màu dự án. Mở rộng (di chuột vào rail): thêm tên dự án
 * và mũi tên. Bấm -> danh sách dự án đang hoạt động, kèm hai lối đi cuối:
 * "Tất cả dự án" (trang chọn) và "Quản lý dự án".
 *
 * Đổi dự án xong thì ĐI VỀ /dashboard chứ không đứng yên tại trang hiện tại:
 * đường dẫn chi tiết (ví dụ /boards/<id>/cards/<id>) trỏ tới dữ liệu của dự án
 * cũ, giữ nguyên sẽ ra màn hình 404.
 */
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { Check, ChevronsUpDown, LayoutGrid, Settings2 } from "lucide-react";
import { useCurrentProject, useSwitchProject } from "@/hooks/useProjects";
import ProjectIcon from "./ProjectIcon";
import styles from "../layout.module.scss";

/** Các trang an toàn khi đổi dự án — đường dẫn có id thì không nằm trong này */
const SAFE_PREFIXES = ["/dashboard", "/tasks", "/kanban", "/calendar", "/projects"];

export default function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { project, projects } = useCurrentProject();
  const switchProject = useSwitchProject();

  const onPick = (id: string) => {
    if (id === project?.id) return;
    switchProject(id);
    const stay = SAFE_PREFIXES.some((p) => pathname.startsWith(p));
    if (!stay) router.push("/dashboard");
  };

  const items: MenuProps["items"] = useMemo(() => {
    const list: MenuProps["items"] = projects.map((p) => ({
      key: p.id,
      label: (
        <div className={styles.projectOption}>
          <span
            className={styles.projectOptionDot}
            style={{ background: p.color }}
          >
            <ProjectIcon name={p.icon} size={13} />
          </span>
          <span className={styles.projectOptionName}>{p.name}</span>
          {p.id === project?.id ? (
            <Check size={15} color="#2a9d8f" />
          ) : (
            <span className={styles.projectOptionHint}>{p.code}</span>
          )}
        </div>
      ),
      onClick: () => onPick(p.id),
    }));

    return [
      { key: "head", type: "group", label: "Dự án của bạn" },
      ...list,
      { type: "divider" },
      {
        key: "all",
        icon: <LayoutGrid size={15} />,
        label: "Tất cả dự án",
        onClick: () => router.push("/select-project"),
      },
      {
        key: "manage",
        icon: <Settings2 size={15} />,
        label: "Quản lý dự án",
        onClick: () => router.push("/projects"),
      },
    ];
    // onPick đọc pathname/project nên phụ thuộc đủ ở đây
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, project?.id, pathname, router]);

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomLeft"
      menu={{ items, selectable: false }}
    >
      <Tooltip title={project?.name ?? "Chọn dự án"} placement="right">
        <button
          type="button"
          className={styles.projectSwitch}
          aria-label={`Dự án hiện tại: ${project?.name ?? "chưa chọn"}`}
        >
          <span className={styles.projectChip}>
            <span
              className={styles.projectChipInner}
              style={{ background: project?.color ?? "rgba(255,255,255,0.16)" }}
            >
              <ProjectIcon name={project?.icon} size={17} />
            </span>
          </span>
          <span className={styles.projectMeta}>
            <span className={styles.projectLabel}>Dự án</span>
            <span className={styles.projectName}>
              {project?.name ?? "Chọn dự án"}
            </span>
          </span>
          <span className={styles.projectCaret}>
            <ChevronsUpDown size={15} />
          </span>
        </button>
      </Tooltip>
    </Dropdown>
  );
}
