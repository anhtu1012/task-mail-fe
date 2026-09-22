"use client";
/**
 * Icon của nhãn.
 *
 * Danh sách đóng, nạp tĩnh — cùng lý do với `ProjectIcon`: nạp động cả bộ
 * lucide chỉ để dùng mười hai cái là kéo theo hàng trăm KB vào bundle. Tên lạ
 * (nhãn cũ, hoặc backend thêm icon mới mà FE chưa cập nhật) trả về `null` chứ
 * không vẽ hình sai — nhãn vẫn còn màu và tên để nhận ra.
 */
import {
  Bell,
  Bug,
  Coins,
  Flag,
  Folder,
  Heart,
  Mail,
  Phone,
  Star,
  Tag,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  star: Star,
  flag: Flag,
  bell: Bell,
  heart: Heart,
  zap: Zap,
  phone: Phone,
  mail: Mail,
  users: Users,
  folder: Folder,
  coins: Coins,
  bug: Bug,
};

export default function LabelIcon({
  name,
  size = 12,
}: {
  name?: string | null;
  size?: number;
}) {
  const Icon = name ? ICONS[name] : undefined;
  if (!Icon) return null;
  return <Icon size={size} />;
}
