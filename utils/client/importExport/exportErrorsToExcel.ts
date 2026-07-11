/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from "antd";
import ExcelJS from "exceljs";
import { ForeignKeyMapping, ImportRow } from "./importUtils";
import { showError, showSuccess } from "@/hooks/useNotification";

/**
 * Type definition for date column configuration
 */
export type DateColumnConfig = {
  field: string; // Field (dataIndex) that should be handled as a date
  format?: string; // Optional format string (default: DD/MM/YYYY)
};

/**
 * Helper function to check if a string is an ISO date string
 */
const isISODateString = (value: any): boolean => {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value);
};

/**
 * Helper function to parse ISO date string to date object
 */
const parseISODate = (isoString: string): Date | null => {
  try {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

/**
 * Export import errors to an Excel file with the same structure as the template
 * Makes it easy for users to correct and re-import
 */
export const exportErrorsToExcel = async <T extends object>(
  previewData: ImportRow<T>[],
  columns: {
    dataIndex: string;
    title: string | (() => any);
    type?: string;
    required?: boolean;
  }[],
  foreignKeyMappings: ForeignKeyMapping[] = [],
  filename: string = "import_errors",
  dateColumns: DateColumnConfig[] = []
): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Template");
    const referenceSheet = workbook.addWorksheet("ReferenceData");

    // Create an instructions sheet
    const instructionsSheet = workbook.addWorksheet("Instructions");

    // Add instructions content
    instructionsSheet.addRow(["Hướng dẫn sử dụng file lỗi"]);
    instructionsSheet.addRow([
      "1. Sửa dữ liệu ở các ô có đánh dấu lỗi trong sheet 'Data Template'",
    ]);
    instructionsSheet.addRow(["2. Các cột dropdown: Chọn từ danh sách có sẵn"]);
    if (dateColumns.length > 0) {
      instructionsSheet.addRow([
        "3. Các cột ngày tháng: Nhập theo định dạng DD/MM/YYYY (sẽ được chuyển đổi sang định dạng ISO string khi nhập)",
      ]);
      const dateColumnNames = dateColumns.map((dc) => {
        const col = columns.find((c) => c.dataIndex === dc.field);
        return col
          ? typeof col.title === "function"
            ? col.title()
            : col.title
          : dc.field;
      });
      instructionsSheet.addRow([
        `   Các cột ngày tháng: ${dateColumnNames.join(", ")}`,
      ]);
    }
    instructionsSheet.addRow([
      "4. Tất cả dữ liệu tham khảo nằm trong sheet 'ReferenceData'",
    ]);

    // Style instructions sheet
    instructionsSheet.getColumn(1).width = 100;
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };

    // Convert columns to template format like generateExcelTemplate
    const templateColumns = columns
      .filter((col) => col.dataIndex && col.dataIndex !== "stt")
      .map((col) => ({
        title: typeof col.title === "function" ? col.title() : col.title,
        dataIndex: col.dataIndex,
        required: col.required || false,
        type: col.type || "string",
      }));

    // Add header row
    const headerRow = worksheet.addRow(templateColumns.map((col) => col.title));
    headerRow.height = 40; // Match the height from generateExcelTemplate

    // Style header row - match generateExcelTemplate styling
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "02479c" }, // Matched blue color from generateExcelTemplate
      };
      cell.font = {
        color: { argb: "FFFFFF" }, // White text
        bold: true,
        size: 14, // Match font size
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true, // Enable text wrapping
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Fill ReferenceData with Field, Label, Value columns
    referenceSheet.getRow(1).getCell(1).value = "Field";
    referenceSheet.getRow(1).getCell(2).value = "Label";
    referenceSheet.getRow(1).getCell(3).value = "Value";
    let refRowIdx = 2;
    // Lưu lại vị trí bắt đầu/kết thúc cho từng field
    const refFieldRange: Record<string, { start: number; end: number }> = {};
    foreignKeyMappings.forEach((mapping) => {
      const start = refRowIdx;
      mapping.options.forEach((opt) => {
        referenceSheet.getRow(refRowIdx).getCell(1).value = mapping.field;
        referenceSheet.getRow(refRowIdx).getCell(2).value = opt.label;
        referenceSheet.getRow(refRowIdx).getCell(3).value = opt.value;
        refRowIdx++;
      });
      const end = refRowIdx - 1;
      refFieldRange[mapping.field] = { start, end };
    });

    // Add data rows robustly
    previewData.forEach((row, rowIdx) => {
      const excelRow = worksheet.getRow(rowIdx + 2);
      templateColumns.forEach((col, colIdx) => {
        let value = row.data[col.dataIndex as keyof T];

        // Foreign key: show label
        const mapping = foreignKeyMappings.find(
          (m) => m.field === col.dataIndex
        );
        if (mapping && value !== undefined && value !== null) {
          const option = mapping.options.find((opt) => opt.value === value);
          value = option
            ? (option.label as T[keyof T])
            : value === null
            ? ("" as T[keyof T])
            : (value as T[keyof T]);
        }

        // Date: show as formatted string
        const isDateField = dateColumns.some(
          (dc) => dc.field === col.dataIndex
        );
        if (isDateField && isISODateString(value)) {
          const dateObj =
            typeof value === "string" ? parseISODate(value) : undefined;
          if (dateObj) {
            // Format date as dd/mm/yyyy for Excel cell
            const day = String(dateObj.getDate()).padStart(2, "0");
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const year = dateObj.getFullYear();
            value = `${day}/${month}/${year}` as T[keyof T];
          }
        }

        // Fix: always assign a primitive or empty string, never null or object
        if (
          value === undefined ||
          value === null ||
          (typeof value === "object" &&
            !(value instanceof Date) &&
            !isDateField)
        ) {
          excelRow.getCell(colIdx + 1).value = "";
        } else {
          excelRow.getCell(colIdx + 1).value = value as
            | string
            | number
            | boolean
            | Date;
        }
      });

      // Error highlighting and notes
      if (row.errors && row.errors.length > 0) {
        const errorsByField: Record<string, string[]> = {};

        row.errors.forEach((err) => {
          if (err.field) {
            if (!errorsByField[err.field]) errorsByField[err.field] = [];
            errorsByField[err.field].push(err.message);
          }
        });

        // Add notes to cells with errors
        Object.entries(errorsByField).forEach(([field, messages]) => {
          const colIdx = templateColumns.findIndex(
            (col) => col.dataIndex === field
          );
          if (colIdx !== -1) {
            const cell = excelRow.getCell(colIdx + 1);

            // Add comment/note to the cell
            cell.note = {
              texts: [
                {
                  text: "LỖI: " + messages.join("\n"),
                  font: { color: { argb: "FF0000" }, bold: true },
                },
              ],
            };

            // Style the cell based on error type
            const mainErrorType = row.errors?.find(
              (err) => err.field === field
            )?.type;

            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  mainErrorType === "duplicate"
                    ? "FFFFC7CE" // Light red
                    : mainErrorType === "required"
                    ? "FFFFF2CC" // Light yellow
                    : mainErrorType === "format"
                    ? "FFE2EFDA" // Light green
                    : mainErrorType === "foreignKey"
                    ? "FFDAEEF3" // Light blue
                    : "FFF2F2F2", // Light gray for other errors
              },
            };

            cell.font = { color: { argb: "FFFF0000" } };
          }
        });
      }
    });

    // Tạo dropdown cho tất cả các field, nếu không có mapping hoặc options rỗng thì dropdown rỗng
    templateColumns.forEach((col, colIdx) => {
      const mapping = foreignKeyMappings.find((m) => m.field === col.dataIndex);
      const columnLetter = String.fromCharCode(65 + colIdx); // A, B, C,...
      if (mapping) {
        const { start, end } = refFieldRange[mapping.field];
        if (!mapping.options || mapping.options.length === 0) {
          // Dropdown rỗng nếu options rỗng
          for (let i = 2; i <= 6000; i++) {
            const row = worksheet.getRow(i);
            const cell = row.getCell(colIdx + 1);
            cell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: ['""'],
            };
          }
          return;
        }
        // Dropdown: lấy vùng label (ReferenceData!$B$start:$B$end)
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`ReferenceData!$B$${start}:$B$${end}`],
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        }

        // Tạo cột ẩn cho value, dùng VLOOKUP tra value theo label
        const valueColIdx = worksheet.columns.length + 1;
        const valueHeaderRow = worksheet.getRow(1);
        valueHeaderRow.getCell(valueColIdx).value = `${mapping.field}_Value`;

        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          row.getCell(valueColIdx).value = {
            formula: `IFERROR(VLOOKUP(${columnLetter}${i},ReferenceData!$B$${start}:$C$${end},2,FALSE),"")`,
          };
        }

        // Style hidden column header (cho đẹp dù ẩn)
        const valueHeaderCell = valueHeaderRow.getCell(valueColIdx);
        valueHeaderCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "02479c" },
        };
        valueHeaderCell.font = {
          color: { argb: "FFFFFF" },
          bold: true,
          size: 14,
        };
        valueHeaderCell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        valueHeaderCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        worksheet.getColumn(valueColIdx).hidden = true;
      } else {
        // Không có mapping, tạo dropdown với mảng rỗng (select rỗng)
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['""'],
          };
        }
      }
    });

    // Handle date columns - match generateExcelTemplate logic
    dateColumns.forEach((dateCol) => {
      const colIdx = templateColumns.findIndex(
        (col) => col.dataIndex === dateCol.field
      );
      if (colIdx === -1) return;

      const columnLetter = String.fromCharCode(65 + colIdx);
      const displayFormat = dateCol.format || "dd/mm/yyyy";

      // Create hidden column for ISO date value
      const isoColIdx = worksheet.columns.length + 1;

      const isoHeaderRow = worksheet.getRow(1);
      isoHeaderRow.getCell(isoColIdx).value = `${dateCol.field}_ISO`;

      // Apply date formatting to the visible date column
      for (let i = 2; i <= 6000; i++) {
        const dateRow = worksheet.getRow(i);
        const dateCell = dateRow.getCell(colIdx + 1);
        dateCell.numFmt = displayFormat;

        // Add date validation
        dateCell.dataValidation = {
          type: "date",
          operator: "between",
          showErrorMessage: true,
          allowBlank: true,
          errorTitle: "Lỗi",
          error: `Vui lòng nhập ngày hợp lệ theo định dạng ${displayFormat}`,
          formulae: [
            new Date(1900, 0, 1).getTime(),
            new Date(2099, 11, 31).getTime(),
          ],
        };

        // Add formula to convert to ISO string in the hidden column
        const isoRow = worksheet.getRow(i);
        isoRow.getCell(isoColIdx).value = {
          formula: `IF(${columnLetter}${i}="","",TEXT(${columnLetter}${i},"yyyy-mm-dd")&"T00:00:00.000Z")`,
        };
      }

      // Style ISO column header
      const isoHeaderCell = isoHeaderRow.getCell(isoColIdx);
      isoHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "02479c" },
      };
      isoHeaderCell.font = {
        color: { argb: "FFFFFF" },
        bold: true,
        size: 14,
      };
      isoHeaderCell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      isoHeaderCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Hide ISO column
      worksheet.getColumn(isoColIdx).hidden = true;

      // Add note/comment to date column header
      const dateHeaderCell = worksheet.getRow(1).getCell(colIdx + 1);
      dateHeaderCell.note = {
        texts: [
          {
            text: `Nhập ngày tháng theo định dạng: ${displayFormat} [sẽ được chuyển đổi sang ISO string khi nhập]`,
            font: {
              bold: true,
            },
          },
        ],
      };
    });

    // Add validation and visual indicators - match generateExcelTemplate
    templateColumns.forEach((col, colIdx) => {
      const headerCell = worksheet.getRow(1).getCell(colIdx + 1);

      // Add visual indicator and validation for required fields
      if (col.required) {
        headerCell.value = `${headerCell.value} *`;
        headerCell.font = {
          ...headerCell.font,
          color: { argb: "FFFFFF" },
        };

        // Add data validation for required fields
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);
          cell.dataValidation = {
            ...cell.dataValidation,
            formulae: cell.dataValidation?.formulae || [],
            showErrorMessage: true,
            allowBlank: false,
            errorStyle: "stop",
            errorTitle: "Lỗi",
            error: `${col.title} là trường bắt buộc.`,
          };
        }
      }

      // Add data validation based on column type
      if (col.type && !dateColumns.some((dc) => dc.field === col.dataIndex)) {
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);

          switch (col.type) {
            case "number":
              cell.dataValidation = {
                ...cell.dataValidation,
                type: "decimal",
                showErrorMessage: true,
                errorTitle: "Lỗi định dạng",
                error: `${col.title} phải là số.`,
              };
              cell.alignment = { horizontal: "right", vertical: "middle" };
              break;

            case "boolean":
              // Add boolean validation (TRUE/FALSE dropdown)
              cell.dataValidation = {
                type: "list",
                formulae: ['"TRUE,FALSE"'],
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: "Lỗi định dạng",
                error: `${col.title} phải là TRUE hoặc FALSE.`,
              };
              // Center-align booleans
              cell.alignment = { horizontal: "center", vertical: "middle" };
              break;

            case "string":
              cell.alignment = { horizontal: "left", vertical: "middle" };
              break;
          }
        }

        // Add type information as a note to the header cell
        const noteText =
          col.type === "number"
            ? `${col.title} [kiểu: số]`
            : col.type === "boolean"
            ? `${col.title} [kiểu: boolean]`
            : col.type === "string"
            ? `${col.title} [kiểu: chuỗi]`
            : `${col.title} [kiểu: ${col.type}]`;

        if (!headerCell.note) {
          headerCell.note = {
            texts: [
              {
                text: noteText + (col.required ? " (bắt buộc)" : ""),
                font: { bold: true },
              },
            ],
          };
        }
      }
    });

    // Adjust column width to match generateExcelTemplate
    worksheet.columns.forEach((col, index) => {
      col.width = index === 0 ? 30 : 40;
      col.alignment = { wrapText: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    link.click();

    showSuccess("File lỗi đã được tải xuống thành công");
  } catch (error) {
    console.error("Error exporting errors to Excel:", error);
    showError("Có lỗi khi xuất file lỗi");
    return Promise.reject(error);
  }
};
