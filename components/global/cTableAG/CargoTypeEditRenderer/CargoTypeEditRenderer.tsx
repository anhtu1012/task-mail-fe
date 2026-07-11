/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Pencil } from "lucide-react";

// Custom renderer cho CargoType với nút Edit
const CargoTypeEditRenderer = (props: any) => {
  const { value, onEditClick, cargoOptions } = props;
  const t = (key: string) => key;

  // Tìm label từ cargoOptions dựa vào value
  const displayLabel =
    cargoOptions?.find(
      (option: { label: string; value: string }) => option.value === value,
    )?.label || value;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
      }}
    >
      <span>{displayLabel}</span>
      <button
        onClick={(e: any) => {
          e.stopPropagation();
          if (onEditClick) {
            onEditClick();
          }
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "2px 6px",
          fontSize: "14px",
          color: "#1890ff",
        }}
        title={t("edit") || "Chỉnh sửa"}
      >
        <Pencil size={18} />
      </button>
    </div>
  );
};
export default CargoTypeEditRenderer;
