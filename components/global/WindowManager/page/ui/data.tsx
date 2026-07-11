"use client";

import dynamic from "next/dynamic";

export const CardPage = dynamic(() => import("@/app/(modules)/ui/Card/page"), { ssr: false });
export const CTableAgPage = dynamic(() => import("@/app/(modules)/ui/cTableAG/page"), { ssr: false });
