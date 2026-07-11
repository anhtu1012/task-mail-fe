"use client";

import dynamic from "next/dynamic";

export const KeHoachDoContainerPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/do-container/page"),
  { ssr: false }
);

export const KeHoachXepContainerPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/xep-container/page"),
  { ssr: false }
);

export const DanhSachXuatTauPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/danh-sach-xuat-tau/page"),
  { ssr: false }
);

export const ThongKeXepDoPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/thong-ke-xep-do/page"),
  { ssr: false }
);

export const GanCauPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/gan-cau/page"),
  { ssr: false }
);

export const CapNhatDanhSachXuatTauPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/cap-nhat-danh-sach-xuat-tau/page"),
  { ssr: false }
);

export const InKeHoachPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/in-ke-hoach/page"),
  { ssr: false }
);

export const CmcPage = dynamic(
  () => import("@/app/(modules)/ship/ke-hoach/cmc/page"),
  { ssr: false }
);
