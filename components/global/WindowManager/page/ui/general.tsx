"use client";

import dynamic from "next/dynamic";

export const ButtonPage = dynamic(() => import("@/app/(modules)/ui/Button/page"), { ssr: false });
export const LayoutContentPage = dynamic(() => import("@/app/(modules)/ui/LayoutContent/page"), { ssr: false });
export const SegmentedPage = dynamic(() => import("@/app/(modules)/ui/Segmented/page"), { ssr: false });
