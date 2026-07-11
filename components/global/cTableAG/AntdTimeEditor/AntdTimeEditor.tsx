/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getCookie } from "@/utils/client/getCookie";
import { ICellEditorComp, ICellEditorParams } from "@ag-grid-community/core";
import { TimePicker } from "antd";
import localeEn from "antd/es/date-picker/locale/en_US";
import localeVi from "antd/es/date-picker/locale/vi_VN";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/vi";
import { createRoot, Root } from "react-dom/client";
import "./AntdTimeEditor.scss";

export class AntdTimeEditor implements ICellEditorComp {
  private eGui!: HTMLDivElement;
  private root!: Root;
  private currentValue: Dayjs | null = null;
  private pickerContainer!: HTMLDivElement;
  private antdLocale: any;
  private params!: ICellEditorParams;
  private format: string = "HH:mm:ss";
  private isDirty: boolean = false;

  init(params: ICellEditorParams): void {
    this.params = params;
    this.eGui = document.createElement("div");
    this.eGui.style.width = "100%";
    this.eGui.style.height = "100%";
    this.eGui.style.position = "relative";

    // Get format from cellEditorParams or default to HH:mm:ss
    this.format = params.colDef?.cellEditorParams?.format || "HH:mm:ss";

    // Parse initial value
    if (params.value) {
      const parsed = dayjs(params.value, this.format);
      this.currentValue = parsed.isValid() ? parsed : null;
    }

    this.pickerContainer = document.createElement("div");
    this.pickerContainer.className = "ag-custom-component-popup";
    document.body.appendChild(this.pickerContainer);

    // Stop propagation to prevent grid from closing editor when clicking on popup
    this.pickerContainer.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.pickerContainer.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    // CRITICAL: Stop propagation on the main cell editor container too!
    this.eGui.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    this.eGui.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const localeCode = getCookie("language") || "vi";
    dayjs.locale(localeCode === "en" ? "en" : "vi");
    this.antdLocale = localeCode === "en" ? localeEn : localeVi;

    this.root = createRoot(this.eGui);
    this.renderTimePicker();
  }

  private renderTimePicker(): void {
    this.root.render(
      <div style={{ height: "100%" }}>
        <TimePicker
          locale={this.antdLocale}
          format={this.format}
          value={this.currentValue}
          onChange={(val) => {
            this.currentValue = val;
            this.isDirty = true;
            this.renderTimePicker();
          }}
          style={{ width: "100%", height: "100%" }}
          className="time-height"
          getPopupContainer={() => this.pickerContainer}
          popupStyle={{ zIndex: 9000 }}
          needConfirm={false}
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
    return this.currentValue ? this.currentValue.format(this.format) : "";
  }

  destroy(): void {
    if (this.root) {
      this.root.unmount();
    }
    if (this.pickerContainer && this.pickerContainer.parentNode) {
      this.pickerContainer.parentNode.removeChild(this.pickerContainer);
    }
  }

  isPopup(): boolean {
    return false;
  }
}

export default AntdTimeEditor;
