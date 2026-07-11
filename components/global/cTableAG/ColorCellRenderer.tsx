/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { ColorPicker } from "antd";
import { presetColors } from "@/models/enums";

interface ColorCellRendererProps {
  value: string;
  node: any;
  colDef: any;
  column: any;
}

const getContrastColor = (hex: string) => {
  if (!hex) return "#000000";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

const ColorCellRenderer = (props: ColorCellRendererProps) => {
  const { value, node, column } = props;
  const colId = column.getColId();
  const [color, setColor] = useState(
    value || (colId === "foreColor" ? "#000000" : "#FFFFFF"),
  );
  const [open, setOpen] = useState(false);

  // Sync state with props during render to avoid cascading renders
  const [prevProps, setPrevProps] = useState({ value, colId });
  if (props.value !== prevProps.value || colId !== prevProps.colId) {
    setColor(value || (colId === "foreColor" ? "#000000" : "#FFFFFF"));
    setPrevProps({ value, colId });
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Chặn sự kiện double click lan ra ngoài để Ag-Grid không vào chế độ edit
    e.stopPropagation();
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{ width: "100%", height: "100%" }}
    >
      <ColorPicker
        value={color}
        open={open}
        onOpenChange={(visible) => {
          setOpen(visible);
        }}
        onChange={(colorObj) => {
          const hex = colorObj.toHexString();
          setColor(hex);
          // Sync with Ag-Grid immediately so "Save" button sees the change
          node.setDataValue(colId, hex);
        }}
        presets={[
          {
            label: "Bộ màu cơ bản",
            colors: presetColors,
          },
        ]}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "1px solid #ddd",
            borderRadius: "2px",
            lineHeight: "normal",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              color: getContrastColor(color),
              fontWeight: "normal",
            }}
          >
            {color}
          </span>
        </div>
      </ColorPicker>
    </div>
  );
};

export default ColorCellRenderer;
