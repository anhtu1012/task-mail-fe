"use client";
/**
 * Icon của dự án.
 *
 * Danh sách đóng (`PROJECT_ICONS` trong `models/project.ts`) thay vì nạp động
 * từ lucide: nạp động sẽ kéo cả bộ icon vào bundle chỉ để dùng đúng tám cái.
 * Tên lạ -> rơi về `folder` chứ không vỡ giao diện.
 */
import {
  Book,
  Briefcase,
  Folder,
  Heart,
  Home,
  Rocket,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  home: Home,
  rocket: Rocket,
  target: Target,
  book: Book,
  heart: Heart,
  users: Users,
};

export default function ProjectIcon({
  name,
  size = 18,
}: {
  name?: string | null;
  size?: number;
}) {
  const Icon = ICONS[name ?? ""] ?? Folder;
  return <Icon size={size} />;
}
