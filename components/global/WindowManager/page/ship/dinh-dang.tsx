"use client";

import dynamic from "next/dynamic";

export const ThongTinTauPage = dynamic(
  () => import("@/app/(modules)/ship/dinh-dang/thong-tin-tau/page"),
  { ssr: false }
);

export const TrongLuongToiDaPage = dynamic(
  () => import("@/app/(modules)/ship/dinh-dang/trong-luong-toi-da/page"),
  { ssr: false }
);

export const ThietKeTauPage = dynamic(
  () => import("@/app/(modules)/ship/dinh-dang/thiet-ke-tau/page"),
  { ssr: false }
);

export const InSoDoTauPage = dynamic(
  () => import("@/app/(modules)/ship/dinh-dang/in-so-do-tau/page"),
  { ssr: false }
);
