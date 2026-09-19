/**
 * Kho dữ liệu dự án GIẢ LẬP, chạy hoàn toàn dưới máy.
 *
 * Vì sao có file này: backend chưa có `/projects`. Thay vì chặn cả tính năng,
 * `projectApi` gọi API thật trước, gặp 404/501 thì lùi về đây — giống hệt cách
 * `themeApi` lùi về lưu dưới máy. Khi backend deploy xong, **không phải sửa
 * dòng code nào**: lần gọi đầu tiên trả 200 là kho này ngừng được dùng.
 *
 * Dữ liệu nằm ở `localStorage` nên còn nguyên sau khi tải lại trang — người
 * dùng demo tạo dự án, đổi tên, lưu trữ đều thấy giữ lại.
 *
 * QUAN TRỌNG: file này chỉ mô phỏng phần *dự án*. Task vẫn do backend thật trả
 * về, nên khi còn chạy mock thì bộ lọc `projectId` gửi lên `/tasks` sẽ bị
 * backend bỏ qua (nó chưa biết field đó) — mọi dự án tạm thời thấy cùng một
 * tập công việc. Đây là điều đã biết, không phải lỗi; xem
 * docs/backend/project-api-spec.md §10.
 */
import {
  CreateProjectInput,
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
  Project,
  ProjectListResponse,
  PROJECT_COLORS,
  QueryProjectParams,
  UpdateProjectInput,
  suggestProjectCode,
} from "@/models/project";

const STORAGE_KEY = "mock:projects:v1";

/** Lỗi giả lập, cùng hình dạng với global exception filter của backend */
export class MockProjectError extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly statusCode = 400,
  ) {
    super(errorCode);
    this.name = "MockProjectError";
  }
}

const now = () => new Date().toISOString();

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mock-${Math.random().toString(36).slice(2, 10)}`;

/** Dữ liệu hạt giống — đủ đa dạng để thấy ngay bộ chọn dự án hoạt động */
const seed = (): Project[] => [
  {
    id: uid(),
    code: "CTY",
    name: "Công việc công ty",
    description: "Task từ email [TASK] và việc được giao trong giờ hành chính",
    color: PROJECT_COLORS[0],
    icon: "briefcase",
    isDefault: true,
    archived: false,
    stats: {
      totalTasks: 42,
      openTasks: 11,
      overdueTasks: 2,
      lastActivityAt: daysFromNow(0),
    },
    createdAt: daysFromNow(-120),
    updatedAt: now(),
  },
  {
    id: uid(),
    code: "KHA",
    name: "Khách hàng A — website",
    description: "Dự án làm web cho khách hàng A, deadline cuối quý",
    color: PROJECT_COLORS[1],
    icon: "rocket",
    isDefault: false,
    archived: false,
    stats: {
      totalTasks: 23,
      openTasks: 8,
      overdueTasks: 1,
      lastActivityAt: daysFromNow(-1),
    },
    createdAt: daysFromNow(-60),
    updatedAt: daysFromNow(-1),
  },
  {
    id: uid(),
    code: "CN",
    name: "Việc cá nhân",
    description: "Việc nhà, giấy tờ, sức khoẻ",
    color: PROJECT_COLORS[2],
    icon: "home",
    isDefault: false,
    archived: false,
    stats: {
      totalTasks: 16,
      openTasks: 5,
      overdueTasks: 0,
      lastActivityAt: daysFromNow(-3),
    },
    createdAt: daysFromNow(-200),
    updatedAt: daysFromNow(-3),
  },
  {
    id: uid(),
    code: "HOC",
    name: "Học tiếng Anh",
    description: null,
    color: PROJECT_COLORS[3],
    icon: "book",
    isDefault: false,
    archived: false,
    stats: {
      totalTasks: 9,
      openTasks: 4,
      overdueTasks: 3,
      lastActivityAt: daysFromNow(-9),
    },
    createdAt: daysFromNow(-30),
    updatedAt: daysFromNow(-9),
  },
  {
    id: uid(),
    code: "2024",
    name: "Tổng kết 2024",
    description: "Đã xong, giữ lại để tra cứu",
    color: PROJECT_COLORS[7],
    icon: "target",
    isDefault: false,
    archived: true,
    stats: {
      totalTasks: 51,
      openTasks: 0,
      overdueTasks: 0,
      lastActivityAt: daysFromNow(-260),
    },
    createdAt: daysFromNow(-400),
    updatedAt: daysFromNow(-260),
  },
];

const read = (): Project[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {
    // localStorage hỏng/bị chặn -> dựng lại từ hạt giống
  }
  const fresh = seed();
  write(fresh);
  return fresh;
};

const write = (items: Project[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // hết dung lượng: bỏ qua, phiên này vẫn chạy được trong bộ nhớ
  }
};

/** Độ trễ giả để UI lộ ra trạng thái tải — bắt được lỗi "nhấp nháy" từ sớm */
const delay = <T>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const findOrThrow = (items: Project[], id: string): Project => {
  const found = items.find((p) => p.id === id);
  if (!found) throw new MockProjectError("PROJECT_NOT_FOUND", 404);
  return found;
};

const assertNameFree = (items: Project[], name: string, selfId?: string) => {
  const taken = items.some(
    (p) =>
      p.id !== selfId && p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (taken) throw new MockProjectError("PROJECT_NAME_TAKEN", 409);
};

const assertCodeFree = (items: Project[], code: string, selfId?: string) => {
  const taken = items.some(
    (p) => p.id !== selfId && p.code.toUpperCase() === code.toUpperCase(),
  );
  if (taken) throw new MockProjectError("PROJECT_CODE_TAKEN", 409);
};

/** Bảo đảm luôn có đúng một dự án mặc định, và nó không bị lưu trữ */
const normalizeDefault = (items: Project[], preferId?: string): Project[] => {
  const alive = items.filter((p) => !p.archived);
  if (!alive.length) return items;
  const target =
    alive.find((p) => p.id === preferId) ??
    alive.find((p) => p.isDefault) ??
    alive[0];
  return items.map((p) => ({ ...p, isDefault: p.id === target.id }));
};

export const projectMock = {
  list(params: QueryProjectParams = {}): Promise<ProjectListResponse> {
    const items = read()
      .filter((p) => params.includeArchived || !p.archived)
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return a.name.localeCompare(b.name, "vi");
      });
    return delay({ items, total: items.length });
  },

  detail(id: string): Promise<Project> {
    return delay(findOrThrow(read(), id));
  },

  create(input: CreateProjectInput): Promise<Project> {
    const items = read();
    const name = input.name.trim();
    assertNameFree(items, name);
    const code = (input.code?.trim() || suggestProjectCode(name) || "DA")
      .toUpperCase()
      .slice(0, 8);
    assertCodeFree(items, code);

    const project: Project = {
      id: uid(),
      code,
      name,
      description: input.description?.trim() || null,
      color: input.color || DEFAULT_PROJECT_COLOR,
      icon: input.icon || DEFAULT_PROJECT_ICON,
      isDefault: false,
      archived: false,
      stats: {
        totalTasks: 0,
        openTasks: 0,
        overdueTasks: 0,
        lastActivityAt: null,
      },
      createdAt: now(),
      updatedAt: now(),
    };

    const next = [...items, project];
    write(input.isDefault ? normalizeDefault(next, project.id) : next);
    return delay(project);
  },

  update(id: string, input: UpdateProjectInput): Promise<Project> {
    const items = read();
    const current = findOrThrow(items, id);
    if (input.name) assertNameFree(items, input.name, id);
    if (input.code) assertCodeFree(items, input.code, id);

    const updated: Project = {
      ...current,
      name: input.name?.trim() ?? current.name,
      code: input.code?.trim().toUpperCase().slice(0, 8) ?? current.code,
      description:
        input.description === undefined
          ? current.description
          : input.description.trim() || null,
      color: input.color ?? current.color,
      icon: input.icon ?? current.icon,
      archived: input.archived ?? current.archived,
      updatedAt: now(),
    };

    let next = items.map((p) => (p.id === id ? updated : p));
    // Lưu trữ dự án đang là mặc định -> đẩy cờ mặc định sang dự án khác
    if (updated.archived && current.isDefault) next = normalizeDefault(next);
    write(next);
    return delay(updated);
  },

  setDefault(id: string): Promise<Project> {
    const items = read();
    const current = findOrThrow(items, id);
    if (current.archived) throw new MockProjectError("PROJECT_ARCHIVED", 409);
    const next = normalizeDefault(items, id);
    write(next);
    return delay({ ...current, isDefault: true });
  },

  remove(id: string): Promise<void> {
    const items = read();
    findOrThrow(items, id);
    if (items.filter((p) => !p.archived).length <= 1) {
      throw new MockProjectError("PROJECT_LAST_ONE", 409);
    }
    write(normalizeDefault(items.filter((p) => p.id !== id)));
    return delay(undefined);
  },

  /** Dùng ở trang quản lý dự án: đưa kho mock về đúng dữ liệu hạt giống */
  reset(): void {
    write(seed());
  },
};
