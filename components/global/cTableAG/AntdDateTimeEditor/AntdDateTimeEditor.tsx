/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ICellEditorComp, ICellEditorParams } from "@ag-grid-community/core";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import localeVi from "antd/es/date-picker/locale/vi_VN";
import localeEn from "antd/es/date-picker/locale/en_US";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import "./AntdDateTimeEditor.scss";
import { getCookie } from "@/utils/client/getCookie";

export class AntdDateTimeEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private root!: Root;
  private currentValue: Dayjs | null = null;

  private pickerContainer!: HTMLDivElement;
  private antdLocale: any;
  private params!: ICellEditorParams;
  private isDirty: boolean = false;

  init(params: ICellEditorParams): void {
    this.params = params;
    // Create container element
    this.eGui = document.createElement("div");
    this.eGui.style.width = "100%";
    this.eGui.style.height = "100%";
    this.eGui.style.position = "relative";

    // Parse initial value
    if (params.value) {
      this.currentValue = dayjs(params.value);
    }

    // Create container for popup
    this.pickerContainer = document.createElement("div");
    this.pickerContainer.className = "ag-custom-component-popup"; // Optional class for styling if needed
    document.body.appendChild(this.pickerContainer);

    // Stop propagation to prevent grid from closing editor when clicking on popup
    this.pickerContainer.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.pickerContainer.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    // CRITICAL: Stop propagation on the main cell editor container too!
    // Without this, clicking on the date input box itself bubbles to AG Grid
    // and causes it to immediately stop fullRow edit mode.
    this.eGui.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.eGui.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    // Set locale based on cookie
    const localeCode = getCookie("language") || "vi";
    dayjs.locale(localeCode === "en" ? "en" : "vi");
    this.antdLocale = localeCode === "en" ? localeEn : localeVi;

    // Create React root and render DatePicker
    this.root = createRoot(this.eGui);
    this.renderDatePicker();
  }

  private renderDatePicker(): void {
    this.root.render(
      <div style={{ height: "100%" }}>
        <DatePicker
          locale={this.antdLocale}
          showTime={{
            format: "HH:mm:ss",
          }}
          format="DD/MM/YYYY HH:mm:ss"
          value={this.currentValue}
          onChange={(val) => {
            this.currentValue = val;
            this.isDirty = true;
            this.renderDatePicker();
          }}
          style={{
            width: "100% !important",
            height: "100% !important",
          }}
          className="date-height"
          getPopupContainer={() => this.pickerContainer}
          styles={{ popup: { root: { zIndex: 9000 } } }}
        />
      </div>,
    );
  }

  getGui(): HTMLElement {
    return this.eGui;
  }

  getValue(): string {
    if (!this.isDirty) {
      return this.params.value || "";
    }
    return this.currentValue ? this.currentValue.toISOString() : "";
  }

  destroy(): void {
    if (this.root) {
      const root = this.root;
      setTimeout(() => {
        root.unmount();
      }, 0);
    }
    if (this.pickerContainer && this.pickerContainer.parentNode) {
      this.pickerContainer.parentNode.removeChild(this.pickerContainer);
    }
  }

  isPopup(): boolean {
    return false;
  }
}

export default AntdDateTimeEditor;
