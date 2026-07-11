/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ICellEditorComp, ICellEditorParams } from "@ag-grid-community/core";
import { Checkbox } from "antd";
import { createRoot, Root } from "react-dom/client";
import React from "react";

/**
 * Custom Checkbox Cell Editor for AG Grid (class-based, matches AntdDateTimeEditor pattern).
 * Toggles a boolean value immediately on click and stops editing.
 */
export class CheckboxCellEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private root!: Root;
  private currentValue: boolean = false;
  private params!: ICellEditorParams;
  private isEditable: boolean = true;

  init(params: ICellEditorParams): void {
    this.params = params;
    this.currentValue =
      params.value === true || params.value === "true" || params.value === "1";
    this.isEditable =
      params.colDef?.editable === true ||
      params.colDef?.editable === undefined ||
      (typeof params.colDef?.editable === "function" &&
        params.colDef.editable(params));

    this.eGui = document.createElement("div");
    this.eGui.style.display = "flex";
    this.eGui.style.alignItems = "center";
    this.eGui.style.justifyContent = "center";
    this.eGui.style.width = "100%";
    this.eGui.style.height = "100%";

    // CRITICAL: Stop propagation on the main cell editor container too!
    this.eGui.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.eGui.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    this.root = createRoot(this.eGui);
    this.renderCheckbox();
  }

  private renderCheckbox(): void {
    this.root.render(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Checkbox
          style={{ color: "red" }}
          checked={this.currentValue}
          disabled={!this.isEditable}
          onChange={(e) => {
            this.currentValue = e.target.checked;
            this.renderCheckbox();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>,
    );
  }

  getGui(): HTMLElement {
    return this.eGui;
  }

  getValue(): boolean {
    return this.currentValue;
  }

  destroy(): void {
    if (this.root) {
      setTimeout(() => this.root.unmount(), 0);
    }
  }

  isPopup(): boolean {
    return false;
  }

  isCancelBeforeStart(): boolean {
    return false;
  }
}

export default CheckboxCellEditor;
