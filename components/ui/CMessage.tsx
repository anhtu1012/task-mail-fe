"use client";

import { message as antdMessage } from "antd";

/**
 * CMessage - A customized wrapper for Ant Design's message utility.
 * Apply global configuration for STOS styling.
 */
antdMessage.config({
  top: 64,
  duration: 3,
  maxCount: 3,
});

export const CMessage = antdMessage;
export default CMessage;
