"use client";

import React from "react";
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
