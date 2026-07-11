"use client";

import dynamic from "next/dynamic";

export const CAlertPage = dynamic(() => import("@/app/(modules)/ui/CAlert/page"), { ssr: false });
export const CMessagePage = dynamic(() => import("@/app/(modules)/ui/CMessage/page"), { ssr: false });
export const CModalPage = dynamic(() => import("@/app/(modules)/ui/CModal/page"), { ssr: false });
export const CNotificationPage = dynamic(() => import("@/app/(modules)/ui/CNotification/page"), { ssr: false });
