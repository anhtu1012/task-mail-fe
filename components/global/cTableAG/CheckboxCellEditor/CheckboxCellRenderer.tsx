/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Checkbox } from "antd";

/**
 * Custom Checkbox Cell Renderer for AG Grid.
 * Renders a styled, centered Ant Design Checkbox that reflects the boolean cell value.
 * The checkbox is not directly interactive here — clicking on the cell triggers the editor.
 */
const CheckboxCellRenderer = (params: any) => {
  const checked =
    params.value === true ||
    params.value === "true" ||
    params.value === "1" ||
    params.value === 1;

  const isEditable =
    params.colDef?.editable === true ||
    params.colDef?.editable === undefined ||
    (typeof params.colDef?.editable === "function" &&
      params.colDef.editable(params));

  const handleToggle = () => {
    if (!isEditable) return;

    const field = params.colDef?.field;
    if (!field) return;

    const newValue = !checked;
    params.node.setDataValue(field, newValue);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        cursor: isEditable ? "pointer" : "default",
      }}
      onClick={handleToggle}
    >
      <Checkbox
        checked={checked}
        disabled={!isEditable}
        onChange={() => {}} // Controlled by outer div click
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};

CheckboxCellRenderer.displayName = "CheckboxCellRenderer";

export default CheckboxCellRenderer;
