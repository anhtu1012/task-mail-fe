/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColDef } from "@ag-grid-community/core";
import { ExtendedColDef } from "./agProps";

import dayjs from "dayjs";
import AntdDateTimeEditor from "./AntdDateTimeEditor/AntdDateTimeEditor";
import AntdTimeEditor from "./AntdTimeEditor/AntdTimeEditor";
import CheckboxCellRenderer from "./CheckboxCellEditor/CheckboxCellRenderer";
import CheckboxCellEditor from "./CheckboxCellEditor/CheckboxCellEditor";
import AntdSelectCellEditor from "./AntdSelectCellEditor/AntdSelectCellEditor";

// Update the processColumnDefs function to handle Number type
export const processColumnDefs = (columnDefs: ExtendedColDef[]): ColDef[] => {
  return columnDefs.map((colDef) => {
    const {
      typeColumn,
      selectOptions: so1,
      selectOption: so2,
      ...rest
    } = colDef;
    const selectOptions = so1 || so2;

    // We store our custom metadata in the context object to avoid AG Grid warnings
    const baseColDef: ColDef = {
      ...rest,
      context: {
        ...(rest.context || {}),
        typeColumn,
        selectOptions,
      },
    };

    if (typeColumn === "Select" && selectOptions) {
      return {
        ...baseColDef,
        cellEditor: AntdSelectCellEditor,
        cellEditorParams: {
          values: selectOptions,
          ...(rest.cellEditorParams || {}),
        },
        valueFormatter: (params) => {
          if (typeof rest.valueFormatter === "function") {
            return rest.valueFormatter(params);
          }
          const found = selectOptions?.find(
            (item) =>
              item.value != null && String(item.value) === String(params.value),
          );
          return found ? found.label : params.value;
        },
        getQuickFilterText: (params) => {
          const found = selectOptions?.find(
            (item) =>
              item.value != null && String(item.value) === String(params.value),
          );
          return found ? found.label : params.value;
        },
        filterValueGetter: (params) => {
          const value = params.data?.[params.colDef.field!];
          const found = selectOptions?.find(
            (item) =>
              item.value != null && String(item.value) === String(value),
          );
          return found ? found.label : value;
        },
      };
    }

    // Handle Number type columns
    if (typeColumn === "Number") {
      return {
        ...baseColDef,
        cellStyle: {
          ...(rest.cellStyle as any),
          // textAlign: "right", // Căn phải cho số
          display: "flex",
          justifyContent: "flex-end",
        },
        valueSetter: (params) => {
          const newValue = params.newValue;
          if (newValue == null || isNaN(Number(newValue))) {
            params.data[params.colDef.field!] = 0;
            return true;
          }
          params.data[params.colDef.field!] = Number(newValue);
          return true;
        },
        valueFormatter: (params) => {
          // If there's already a valueFormatter, keep it, otherwise format as number
          if (typeof rest.valueFormatter === "function") {
            return rest.valueFormatter(params);
          }
          const value = params.value;
          if (value == null || isNaN(Number(value))) {
            return "0";
          }
          return Number(value).toLocaleString();
        },
      };
    }

    if (typeColumn === "Date") {
      return {
        ...baseColDef,
        cellEditor: AntdDateTimeEditor,
        cellEditorParams: {
          format: "DD/MM/YYYY HH:mm:ss", // Default date format
          ...(rest.cellEditorParams || {}),
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          const date = dayjs(params.value);
          return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : ""; // Default display format
        },
      };
    }

    if (typeColumn === "Time") {
      return {
        ...baseColDef,
        cellEditor: AntdTimeEditor,
        cellEditorParams: {
          format: "HH:mm:ss",
          ...(rest.cellEditorParams || {}),
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          const format = params.colDef.cellEditorParams?.format || "HH:mm:ss";
          const t = dayjs(params.value, format);
          return t.isValid() ? t.format(format) : params.value;
        },
      };
    }

    if (typeColumn === "CODE") {
      return {
        ...baseColDef,
        valueSetter: (params) => {
          const newValue = params.newValue;
          if (!newValue) {
            params.data[params.colDef.field!] = newValue;
            return true;
          }
          let cleanValue = String(newValue);
          if (!colDef.allowSpecialCharacters) {
            const allowedChars = colDef.allowedSpecialChars || [];
            const escapedAllowedChars = allowedChars
              .map((c) => {
                if (c === "-" || c === "^" || c === "]" || c === "\\") {
                  return "\\" + c;
                }
                return c.replace(/[.*+?${}()|[\]\/]/g, "\\$&");
              })
              .join("");

            const regexStr = colDef.isNumber
              ? `[^0-9${escapedAllowedChars}]`
              : `[^\\p{L}\\p{N}\\p{M}${escapedAllowedChars}]`; // REMOVED \\s to disallow spaces in regex as well if desired, or just replace later
            const regex = new RegExp(regexStr, "gu");
            cleanValue = String(newValue).replace(regex, "");
          }

          params.data[params.colDef.field!] = cleanValue
            .replace(/\s+/g, "")
            .toUpperCase();
          return true;
        },
      };
    }

    if (typeColumn === "ContainerNo") {
      return {
        ...baseColDef,
        valueSetter: (params) => {
          const val = params.newValue || "";
          const clean = String(val)
            .replace(/[^A-Za-z0-9]/g, "")
            .toUpperCase();
          // Lấy tối đa 4 chữ cái đầu tiên
          const lettersMatch = clean.match(/[A-Z]/g);
          const letters = lettersMatch ? lettersMatch.join("").slice(0, 4) : "";
          // Lấy tối đa 7 chữ số sau đó
          const numbersMatch = clean.match(/[0-9]/g);
          const numbers = numbersMatch ? numbersMatch.join("").slice(0, 7) : "";

          params.data[params.colDef.field!] = letters + numbers;
          return true;
        },
      };
    }

    if (typeColumn === "Text" || !typeColumn) {
      return {
        ...baseColDef,
        valueSetter: (params) => {
          const newValue = params.newValue;
          if (!newValue) {
            params.data[params.colDef.field!] = newValue;
            return true;
          }
          // Remove only specific forbidden characters unless allowed
          let cleanValue = String(newValue);
          if (!colDef.allowSpecialCharacters) {
            const allowedChars = colDef.allowedSpecialChars || [];
            const escapedAllowedChars = allowedChars
              .map((c) => {
                if (c === "-" || c === "^" || c === "]" || c === "\\") {
                  return "\\" + c;
                }
                return c.replace(/[.*+?${}()|[\]\/]/g, "\\$&");
              })
              .join("");

            const regexStr = colDef.isNumber
              ? `[^0-9${escapedAllowedChars}]`
              : `[^\\p{L}\\p{N}\\p{M}\\s${escapedAllowedChars}]`;
            const regex = new RegExp(regexStr, "gu");
            cleanValue = String(newValue).replace(regex, "");
          }

          params.data[params.colDef.field!] = colDef.uppercase
            ? cleanValue.replace(/\s+/g, " ").trim().toUpperCase()
            : cleanValue.replace(/\s+/g, " ").trim();
          return true;
        },
      };
    }

    if (typeColumn === "Checkbox") {
      return {
        ...baseColDef,
        cellRenderer: CheckboxCellRenderer,
        cellEditor: CheckboxCellEditor,
        valueSetter: (params) => {
          const raw = params.newValue;
          params.data[params.colDef.field!] =
            raw === true || raw === "true" || raw === "1" ? true : false;
          return true;
        },
        cellStyle: {
          ...(typeof rest.cellStyle === "object"
            ? (rest.cellStyle as any)
            : {}),
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 0,
        },
      };
    }

    return baseColDef;
  });
};
