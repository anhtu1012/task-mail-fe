"use client";

import { notification as antdNotification } from "antd";

/**
 * CNotification - A customized wrapper for Ant Design's notification utility.
 */
antdNotification.config({
  placement: "topRight",
  bottom: 50,
  duration: 4.5,
});

export const CNotification = antdNotification;
export default CNotification;
