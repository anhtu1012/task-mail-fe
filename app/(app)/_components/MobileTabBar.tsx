"use client";

/**
 * Thanh tab dưới cùng của giao diện mobile.
 *
 * Bốn tab chính (Hôm nay · Công việc · + · Lịch) và "Menu" mở ngăn kéo
 * điều hướng đầy đủ — thiếu nó thì Dự án, Ghi chú, Tích hợp... không còn
 * đường vào trên điện thoại. Các tab là <Link> để nhấn giữ vẫn mở được tab mới.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Columns3, Menu, Plus } from "lucide-react";
import styles from "../layout.module.scss";

const TABS = [
  { href: "/today", label: "Hôm nay", icon: CalendarCheck },
  { href: "/boards", label: "Công việc", icon: Columns3 },
  { href: "/calendar", label: "Lịch", icon: CalendarDays },
] as const;

export default function MobileTabBar({
  onQuickAdd,
  onMenu,
}: {
  onQuickAdd: () => void;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const tab = (t: (typeof TABS)[number]) => {
    const Icon = t.icon;
    const active = isActive(t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        className={`${styles.tabItem} ${active ? styles.tabItemActive : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 2} />
        <span>{t.label}</span>
      </Link>
    );
  };

  return (
    <nav className={styles.tabBar} aria-label="Điều hướng chính">
      {tab(TABS[0])}
      {tab(TABS[1])}
      <button
        type="button"
        aria-label="Thêm việc nhanh"
        className={styles.tabAdd}
        onClick={onQuickAdd}
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>
      {tab(TABS[2])}
      <button type="button" className={styles.tabItem} onClick={onMenu}>
        <Menu size={21} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
