"use client";

import { Grid } from "antd";

/**
 * true khi màn hình hẹp hơn breakpoint `md` (768px) — giao diện mobile.
 *
 * So `=== false` chứ không `!screens.md`: lần render đầu antd chưa đo xong và
 * trả `{}`, `!undefined` sẽ khiến desktop chớp qua giao diện mobile một nhịp.
 * Đổi lại điện thoại chớp giao diện desktop — ít khó chịu hơn, vì desktop là
 * nơi người ta nhìn lâu.
 */
export function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint();
  return screens.md === false;
}
