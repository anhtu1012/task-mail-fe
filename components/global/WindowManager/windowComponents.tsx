"use client";

import React from "react";
import ShipModuleRenderer from "./page/ship";
import UiModuleRenderer from "./page/ui";

// ============================================================
// Master Router Component
// ============================================================
interface ModuleRendererProps {
  moduleCode: string;
  title?: string;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  moduleCode,
  title,
}) => {
  switch (moduleCode.toUpperCase()) {
    // SHIP sub-pages routing:
    case "SHIP":
    case "THIET-LAP-QUY-LUAT":
    case "THONG-TIN-TAU":
    case "TRONG-LUONG-TOI-DA":
    case "THIET-KE-TAU":
    case "IN-SO-DO-TAU":
    case "KE-HOACH-DO-CONTAINER":
    case "KE-HOACH-XEP-CONTAINER":
    case "DANH-SACH-CONTAINER-XUAT-TAU":
    case "THONG-KE-KE-HOACH-XEP-DO":
    case "GAN-CAU":
    case "CAP-NHAT-DANH-SACH-CONTAINER-XUAT-TAU":
    case "IN-KE-HOACH":
    case "CMC":
    case "DANH-SACH-PRE-PLAN":
    case "GROUP-CONTAINER-XUAT-TAU":
      return (
        <div
          className="working-page-wrapper"
          style={{ height: "100%", overflow: "auto", padding: "5px" }}
        >
          <ShipModuleRenderer moduleCode={moduleCode} />
        </div>
      );

    // UI sub-pages routing:
    case "BUTTON":
    case "COLOR-PICKER":
    case "FORM-DYNAMIC":
    case "LAYOUT-CONTENT":
    case "INPUT":
    case "INPUT-NUMBER":
    case "SELECT":
    case "CHECKBOX":
    case "SWITCH":
    case "AUTOCOMPLETE":
    case "CASCADER":
    case "TREESELECT":
    case "RADIO":
    case "SEGMENTED":
    case "TRANSFER":
    case "UPLOAD":
    case "CTABLE-AG":
    case "CARD":
    case "DATEPICKER":
    case "TIMEPICKER":
    case "MODAL":
    case "ALERT":
    case "MESSAGE":
    case "NOTIFICATION":
      return (
        <div
          className="working-page-wrapper"
          style={{ height: "100%", overflow: "auto" }}
        >
          <UiModuleRenderer moduleCode={moduleCode} />
        </div>
      );

    default:
      return <div style={{ padding: "20px" }}>{title || moduleCode}</div>;
  }
};

export default ModuleRenderer;
