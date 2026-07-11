/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { TableColumnsType } from "antd";
import React from "react";

export const exportToExcel = async <T extends object>(
  dataSource: T[],
  columns: TableColumnsType<T>,
  fileName: string = "export",
  includeRowNumbers: boolean = true
) => {
  const visibleColumns = columns.filter((col) => !col.hidden);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  // Header row setup
  const headers: ExcelJS.Column[] = [];

  if (includeRowNumbers) {
    headers.push({
      header: "STT",
      key: "STT",
      width: 10, // Increased width
      style: {}, // Add default style
      outlineLevel: 0, // Add default outline level
      hidden: false, // Add default hidden property
    } as ExcelJS.Column);
  }

  visibleColumns.forEach((col) => {
    const dataIndex =
      "dataIndex" in col ? (col.dataIndex as string) : undefined;

    if (dataIndex && dataIndex !== "operation" && col.key !== "action") {
      const headerText =
        typeof col.title === "function"
          ? col.title({})
          : col.title?.toString() || dataIndex;

      headers.push({
        header: String(headerText),
        key: String(headerText),
        width: 40, // Increased width from 15 to 20
        style: {}, // Default style
        outlineLevel: 0, // Default outline level
        hidden: false, // Default hidden property
      } as ExcelJS.Column);
    }
  });

  worksheet.columns = headers;

  // Add data rows
  dataSource.forEach((record, rowIndex) => {
    const row: Record<string, any> = {};

    if (includeRowNumbers) {
      row["STT"] = rowIndex + 1;
    }

    visibleColumns.forEach((col) => {
      const dataIndex =
        "dataIndex" in col ? (col.dataIndex as string) : undefined;

      if (dataIndex && dataIndex !== "operation" && col.key !== "action") {
        let value: any;

        // Support nested keys (e.g., user.name)
        if (dataIndex && dataIndex.includes(".")) {
          const keys = dataIndex.split(".");
          let nested = record as any;
          for (const key of keys) {
            nested = nested?.[key];
            if (nested === undefined) break;
          }
          value = nested;
        } else {
          value = record[dataIndex as keyof T];
        }

        // Apply custom render
        if (col.render && typeof value !== "undefined") {
          const rendered = col.render(value, record, rowIndex);
          if (React.isValidElement(rendered)) {
            value =
              rendered.props &&
              typeof rendered.props === "object" &&
              "children" in rendered.props
                ? rendered.props.children || ""
                : "";
          } else if (
            typeof rendered === "string" ||
            typeof rendered === "number"
          ) {
            value = rendered;
          }
        }

        const headerText =
          typeof col.title === "function"
            ? col.title({})
            : col.title?.toString() || dataIndex;

        row[String(headerText)] = value ?? "";
      }
    });

    worksheet.addRow(row);
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "02479c" }, // Blue background
    };
    cell.font = {
      color: { argb: "FFFFFF" }, // White text
      bold: true,
      size: 14, // Increased font size from 12 to 14
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true, // Enable text wrapping
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  headerRow.height = 40; // Increased height from 30 to 40

  // Export to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportToCSV = <T extends object>(
  dataSource: T[],
  columns: TableColumnsType<T>,
  fileName: string = "export",
  includeRowNumbers: boolean = true
) => {
  const processedData = prepareDataForExport(
    dataSource,
    columns,
    includeRowNumbers
  );

  if (processedData.length === 0) {
    console.warn("KKhông tìm thấy dữ liệu để xuất CSV.");
    return;
  }

  const headers = Object.keys(processedData[0]);

  const escapeCSV = (value: any) => {
    const str = String(value ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCSV).join(","), // Header row
    ...processedData.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Chuẩn hóa dữ liệu từ bảng để xuất ra CSV
 */
export const prepareDataForExport = <T extends object>(
  dataSource: T[],
  columns: TableColumnsType<T>,
  includeRowNumbers: boolean = true
) => {
  const visibleColumns = columns.filter(
    (col) =>
      !col.hidden &&
      "dataIndex" in col &&
      col.dataIndex &&
      col.dataIndex !== "operation" &&
      col.key !== "action"
  );

  return dataSource.map((record, rowIndex) => {
    const row: Record<string, any> = {};

    if (includeRowNumbers) {
      row["STT"] = rowIndex + 1;
    }

    visibleColumns.forEach((col) => {
      const dataIndex =
        "dataIndex" in col ? (col.dataIndex as string) : undefined;

      // Lấy giá trị (hỗ trợ nested)
      let value: any;
      if (dataIndex && dataIndex.includes(".")) {
        value = dataIndex
          .split(".")
          .reduce((obj, key) => (obj as Record<string, any>)?.[key], record);
      } else {
        value = record[dataIndex as keyof T];
      }

      // Áp dụng render nếu có
      if (col.render && typeof value !== "undefined") {
        const rendered = col.render(value, record, rowIndex);
        if (React.isValidElement(rendered)) {
          value =
            rendered.props &&
            typeof rendered.props === "object" &&
            "children" in rendered.props &&
            rendered.props.children !== undefined
              ? rendered.props.children
              : "";
        } else if (
          typeof rendered === "string" ||
          typeof rendered === "number"
        ) {
          value = rendered;
        }
      }

      const colTitle =
        typeof col.title === "function"
          ? col.title({})
          : col.title?.toString() || dataIndex;

      row[String(colTitle)] = value ?? "";
    });

    return row;
  });
};
