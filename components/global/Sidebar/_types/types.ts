/* ================================================================
   AppSidebar — Shared Types
   ================================================================ */

export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  header?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  header?: "ship" | "shipVoy";
  items: NavItem[];
}

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}
