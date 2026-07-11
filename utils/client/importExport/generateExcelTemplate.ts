/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { ColDef } from "@ag-grid-community/core";
import { message } from "antd";
const { error: showError, success: showSuccess } = message;

export type ForeignKeyMapping = {
  field: string; // Field (dataIndex) cần tạo dropdown
  options: { label: string | null; value: string | number | null }[];
};

// Add new type for date columns
export type DateColumnConfig = {
  field: string; // Field (dataIndex) that should be handled as a date
  format?: string; // Optional format string (default: DD/MM/YYYY)
};

// Helper function to convert AG-Grid columns to template format
const convertAgGridColumnsToTemplateFormat = (
  agGridColumns: ColDef[]
): any[] => {
  return agGridColumns
    .filter((col) => col.field && col.field !== "__stt") // Filter out STT column and columns without field
    .map((col) => ({
      title: col.headerName || col.field || "",
      dataIndex: col.field,
      required: col.headerClass || false, // Check if header has required class
      type: col.type || "string", // Default to string if no type specified
      // You can add more mappings here based on your AG-Grid column configuration
    }));
};

export const generateExcelTemplate = async (
  columns: ColDef[] | any[], // Accept both AG-Grid ColDef[] or legacy format
  filename: string = "data_template",
  foreignKeyMappings: ForeignKeyMapping[] = [],
  dateColumns: DateColumnConfig[] = [] // Add date columns parameter
) => {
  try {
    // Convert AG-Grid columns to template format if needed
    let templateColumns: any[];
    // Check if columns are AG-Grid format (has field property) or legacy format (has dataIndex)
    if (columns.length > 0 && "field" in columns[0]) {
      templateColumns = convertAgGridColumnsToTemplateFormat(
        columns as ColDef[]
      );
    } else {
      console.log("Using legacy column format");
      templateColumns = columns as any[];
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Template");
    const referenceSheet = workbook.addWorksheet("ReferenceData");

    // Create an instructions sheet
    const instructionsSheet = workbook.addWorksheet("Instructions");

    // Add instructions content
    instructionsSheet.addRow(["Hướng dẫn sử dụng mẫu nhập liệu"]);
    instructionsSheet.addRow([
      "1. Nhập dữ liệu vào các cột tương ứng trong sheet 'Data Template'",
    ]);
    instructionsSheet.addRow(["2. Các cột dropdown: Chọn từ danh sách có sẵn"]);
    if (dateColumns.length > 0) {
      instructionsSheet.addRow([
        "3. Các cột ngày tháng: Nhập theo định dạng DD/MM/YYYY (sẽ được chuyển đổi sang định dạng ISO string khi nhập)",
      ]);
      const dateColumnNames = dateColumns.map((dc) => {
        const col = templateColumns.find((c: any) => c.dataIndex === dc.field);
        return col ? col.title : dc.field;
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

    // Add header row
    const headerRow = worksheet.addRow(
      templateColumns.map((col: any) => col.title)
    );
    headerRow.height = 40; // Match the height from exportUtils

    // Style header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "02479c" }, // Matched blue color from exportUtils
      };
      cell.font = {
        color: { argb: "FFFFFF" }, // White text
        bold: true,
        size: 14, // Increased font size to match exportUtils
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

    // Chỉ tạo dropdown cho các field có trong foreignKeyMappings, nếu options rỗng thì dropdown rỗng
    templateColumns.forEach((col: any, colIdx: number) => {
      const mapping = foreignKeyMappings.find((m) => m.field === col.dataIndex);
      if (!mapping) return; // Field không có trong foreignKeyMappings thì không tạo dropdown

      const columnLetter = String.fromCharCode(65 + colIdx); // A, B, C,...
      const { start, end } = refFieldRange[mapping.field];

      if (!mapping.options || mapping.options.length === 0) {
        // Nếu options rỗng thì dropdown rỗng
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
    });

    // Handle date columns
    dateColumns.forEach((dateCol) => {
      const colIdx = templateColumns.findIndex(
        (col: any) => col.dataIndex === dateCol.field
      );
      if (colIdx === -1) return;

      const columnLetter = String.fromCharCode(65 + colIdx); // A, B, C,...

      // Format to display dates (can be customized)
      const displayFormat = dateCol.format || "dd/mm/yyyy";

      // Create hidden column for ISO date value
      const isoColIdx = worksheet.columns.length + 1;

      const isoHeaderRow = worksheet.getRow(1);
      isoHeaderRow.getCell(isoColIdx).value = `${dateCol.field}_ISO`;

      // Apply date formatting to the visible date column
      for (let i = 2; i <= 6000; i++) {
        const dateRow = worksheet.getRow(i);
        const dateCell = dateRow.getCell(colIdx + 1);
        // Set number format for date display
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

        // Add formula to convert to ISO string in the hidden column - CORRECTED ISO STRING FORMAT
        const isoRow = worksheet.getRow(i);
        isoRow.getCell(isoColIdx).value = {
          formula: `IF(${columnLetter}${i}="","",TEXT(${columnLetter}${i},"yyyy-mm-dd")&"T00:00:00.000Z")`,
        };
      }

      // Style ISO column header (though hidden)
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

    // Add validation and visual indicators based on column type and required properties
    templateColumns.forEach((col: any, colIdx: number) => {
      const headerCell = worksheet.getRow(1).getCell(colIdx + 1);

      // Add visual indicator and validation for required fields
      if (col.required) {
        // Add red asterisk to required field headers
        headerCell.value = `${headerCell.value} *`;
        headerCell.font = {
          ...headerCell.font,
          color: { argb: "FFFFFF" }, // Keep white text
        };

        // Add data validation for required fields
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);
          cell.dataValidation = {
            ...cell.dataValidation, // Preserve existing validations
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
        // Skip date columns as they're handled separately
        for (let i = 2; i <= 6000; i++) {
          const row = worksheet.getRow(i);
          const cell = row.getCell(colIdx + 1);

          switch (col.type) {
            case "number":
              // Add number validation
              cell.dataValidation = {
                ...cell.dataValidation,
                type: "decimal",
                showErrorMessage: true,
                errorTitle: "Lỗi định dạng",
                error: `${col.title} phải là số.`,
              };
              // Right-align numbers
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
              // Center-align text
              cell.alignment = { horizontal: "left", vertical: "middle" };
              break;

            // Additional types can be added here
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

        headerCell.note = {
          texts: [
            {
              text: noteText + (col.required ? " (bắt buộc)" : ""),
              font: { bold: true },
            },
          ],
        };
      }
    });

    // Adjust column width to match exportUtils (wider columns)
    worksheet.columns.forEach((col, index) => {
      // Set default width similar to exportUtils
      col.width = index === 0 ? 30 : 40; // First column 30 (increased from 10), others 40

      // Set wrap text for long data
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

    showSuccess("Template đã được tải xuống thành công");
  } catch (error) {
    console.error("Error generating template:", error);
    showError("Tạo template thất bại");
  }
};
