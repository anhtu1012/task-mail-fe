"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/global/Sidebar/_types";
import { AppHeader } from "@/components/global/Header/_types";
import MainContent from "@/components/global/MainContent/MainContent";
import type { NavGroup } from "@/components/global/Sidebar/_types/types";
import {
  Component,
  Layout,
  MousePointerClick,
  Type,
  CheckSquare,
  ToggleRight,
  List,
  Calendar,
  Clock,
  Hash,
  Palette,
  ArrowRightLeft,
  UploadCloud,
  Search,
  Network,
  CircleDot,
  FileJson,
  ShieldAlert,
  MessageSquare,
  Bell,
  CreditCard,
  Columns,
} from "lucide-react";
import styles from "./layout.module.scss";

/* ------------------------------------------------------------------ */
/*  UI Module navigation config                                        */
/* ------------------------------------------------------------------ */
const uiNavGroups: NavGroup[] = [
  {
    title: "General Components",
    items: [
      {
        key: "button",
        label: "Button",
        icon: <MousePointerClick size={18} />,
        href: "/ui/Button",
      },
      {
        key: "color-picker",
        label: "Color Picker",
        icon: <Palette size={18} />,
        href: "/ui/ColorPicker",
      },
      {
        key: "form-dynamic",
        label: "Form Dynamic",
        icon: <FileJson size={18} />,
        href: "/ui/FormDynamic",
      },
      {
        key: "layout-content",
        label: "Layout Content",
        icon: <Layout size={18} />,
        href: "/ui/LayoutContent",
      },
    ],
  },
  {
    title: "Data Entry",
    items: [
      {
        key: "input",
        label: "Input",
        icon: <Type size={18} />,
        href: "/ui/Input",
      },
      {
        key: "input-number",
        label: "Input Number",
        icon: <Hash size={18} />,
        href: "/ui/InputNumber",
      },
      {
        key: "select",
        label: "Select",
        icon: <List size={18} />,
        href: "/ui/Select",
      },
      {
        key: "checkbox",
        label: "Checkbox",
        icon: <CheckSquare size={18} />,
        href: "/ui/Checkbox",
      },
      {
        key: "switch",
        label: "Switch",
        icon: <ToggleRight size={18} />,
        href: "/ui/Switch",
      },
      {
        key: "autocomplete",
        label: "Auto Complete",
        icon: <Search size={18} />,
        href: "/ui/AutoComplete",
      },
      {
        key: "cascader",
        label: "Cascader",
        icon: <Network size={18} />,
        href: "/ui/Cascader",
      },
      {
        key: "treeselect",
        label: "Tree Select",
        icon: <Component size={18} />,
        href: "/ui/TreeSelect",
      },
      {
        key: "radio",
        label: "Radio",
        icon: <CircleDot size={18} />,
        href: "/ui/Radio",
      },
      {
        key: "segmented",
        label: "Segmented",
        icon: <Columns size={18} />,
        href: "/ui/Segmented",
      },
      {
        key: "transfer",
        label: "Transfer",
        icon: <ArrowRightLeft size={18} />,
        href: "/ui/Transfer",
      },
      {
        key: "upload",
        label: "Upload",
        icon: <UploadCloud size={18} />,
        href: "/ui/Upload",
      },
    ],
  },
  {
    title: "Data Display",
    items: [
      {
        key: "ctable-ag",
        label: "cTableAG (Ag Grid)",
        icon: <List size={18} />,
        href: "/ui/cTableAG",
      },
      {
        key: "card",
        label: "Card",
        icon: <CreditCard size={18} />,
        href: "/ui/Card",
      },
    ],
  },
  {
    title: "Date & Time",
    items: [
      {
        key: "datepicker",
        label: "Date Picker",
        icon: <Calendar size={18} />,
        href: "/ui/DatePicker",
      },
      {
        key: "timepicker",
        label: "Time Picker",
        icon: <Clock size={18} />,
        href: "/ui/TimePicker",
      },
    ],
  },
  {
    title: "Feedback & Overlays",
    items: [
      {
        key: "modal",
        label: "Modal",
        icon: <CircleDot size={18} />,
        href: "/ui/CModal",
      },
      {
        key: "alert",
        label: "Alert",
        icon: <ShieldAlert size={18} />,
        href: "/ui/CAlert",
      },
      {
        key: "message",
        label: "Message",
        icon: <MessageSquare size={18} />,
        href: "/ui/CMessage",
      },
      {
        key: "notification",
        label: "Notification",
        icon: <Bell size={18} />,
        href: "/ui/CNotification",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Layout component                                                   */
/* ------------------------------------------------------------------ */
export default function UiLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((c) => !c);

  return (
    <div className={styles.layoutWrapper}>
      <AppSidebar
        navGroups={uiNavGroups}
        companyName="Task"
        companyPlan="UI Design System"
        collapsed={collapsed}
        onToggleCollapsed={toggleSidebar}
      />
      <div className={styles.layoutMain}>
        <AppHeader
          navGroups={uiNavGroups}
          rootLabel="UI Components"
          rootPath="/ui"
          onToggleSidebar={toggleSidebar}
        />
        <div id="action-global-portal-root"></div>
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
