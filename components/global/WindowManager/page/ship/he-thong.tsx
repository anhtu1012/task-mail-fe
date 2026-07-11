"use client";

import dynamic from "next/dynamic";

export const ThietLapQuyLuatPage = dynamic(
  () => import("@/app/(modules)/ship/he-thong/thiet-lap-quy-luat/page"),
  { ssr: false }
);
