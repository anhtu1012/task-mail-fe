"use client";

import dynamic from "next/dynamic";

export const DanhSachPrePlanPage = dynamic(
  () => import("@/app/(modules)/ship/pre-planning/danh-sach/page"),
  { ssr: false }
);

export const GroupContainerXuatTauPage = dynamic(
  () => import("@/app/(modules)/ship/pre-planning/group-container/page"),
  { ssr: false }
);
