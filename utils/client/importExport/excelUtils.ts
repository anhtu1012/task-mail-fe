/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColDef, ColGroupDef } from "@ag-grid-community/core";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const excelUtils = {
  exportToExcelSimple: ({
    columns,
    data,
    fileName,
    decorated = false,
  }: {
    columns: any[];
    data: any[];
    fileName: string;
    decorated?: boolean;
  }) => {
    const flattenColumns = (columns: any[]) => {
      const flattened: {
        field: string;
        headerName: string;
        valueFormatter?: (params: any) => string;
        values?: any[];
      }[] = [];
      columns.forEach((col) => {
        if (col.field && col.headerName) {
          flattened.push({
            field: col.field,
            headerName: col.headerName,
            valueFormatter: col.valueFormatter, // Include valueFormatter if defined
            values: col.cellEditorParams?.values || [], // Extract value-label pairs
          });
        }
        if (col.children) {
          flattened.push(...flattenColumns(col.children));
        }
      });
      return flattened;
    };

    // Flatten columns and extract necessary properties
    const flattenedColumns = flattenColumns(columns);

    // Extract headers and fields
    const headers = flattenedColumns.map(({ headerName }) => headerName);
    const fields = flattenedColumns.map(({ field }) => field);

    // Initialize ExcelJS workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ExportData");

    // Add headers (display headers)
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;

    if (decorated) {
      // Apply light blue color decoration to header row
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "e6f7ff" }, // Light blue background for header
        };
        cell.font = { bold: true }; // Bold text for headers
        cell.alignment = { vertical: "middle", horizontal: "center" }; // Center align
        cell.border = {
          top: { style: "thin", color: { argb: "c7d6de" } },
          left: { style: "thin", color: { argb: "c7d6de" } },
          bottom: { style: "thin", color: { argb: "c7d6de" } },
          right: { style: "thin", color: { argb: "c7d6de" } },
        };
      });
    }

    // Add data rows using the fields
    data.forEach((row, rowIndex) => {
      const rowData = fields.map((field, columnIndex) => {
        const value = row[field];
        const column = flattenedColumns[columnIndex];

        // If valueFormatter exists, use it to format the value
        if (column.valueFormatter) {
          return column.valueFormatter({ value, data: row });
        }

        // Fallback to raw value if no formatter is available
        return value ?? "";
      });

      const dataRow = worksheet.addRow(rowData);
      dataRow.height = 25;

      if (decorated) {
        // Apply alternating row colors and borders
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowIndex % 2 === 0 ? "FFFFFF" : "F6FAFF" }, // Alternating row color
          };
          cell.alignment = { vertical: "middle", horizontal: "left" }; // Left align for data
          cell.border = {
            top: { style: "thin", color: { argb: "c7d6de" } },
            left: { style: "thin", color: { argb: "c7d6de" } },
            bottom: { style: "thin", color: { argb: "c7d6de" } },
            right: { style: "thin", color: { argb: "c7d6de" } },
          };
        });
      }
    });

    // Auto-fit column widths
    worksheet.columns.forEach((col, i) => {
      col.width = headers[i].length < 15 ? 15 : headers[i].length + 5;
    });

    // Add Excel filter functionality
    const totalRows = data.length + 1; // +1 for header row
    const totalCols = headers.length;
    if (totalRows > 1) {
      // Only add filter if there's data
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: totalRows, column: totalCols },
      };
    }

    // Write the file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);
      // console.log("Export Complete:", fileName);
    });
  },

  // Modified import function to map labels back to values
  importToAdd: async ({
    file,
    columns,
    onSuccess,
    onError,
  }: {
    file: File;
    columns: ColDef[];
    existingData: any[];
    onSuccess: (newData: any[]) => void;
    onError: (error: Error) => void;
  }) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0]; // First sheet
      const headers = worksheet.getRow(1).values as string[];

      // Create a field mapping from headers
      const fieldMapping = headers.reduce(
        (acc, header, index) => {
          const column = columns.find((col) => col.headerName === header);
          if (column && column.field) acc[index] = column;
          return acc;
        },
        {} as Record<number, ColDef>,
      );

      // Create a reverse lookup map for labels to values
      const labelToValueMap: Record<string, Record<string | number, any>> = {};
      columns.forEach((col) => {
        if (
          col.cellEditorParams?.values &&
          Array.isArray(col.cellEditorParams.values)
        ) {
          // Safely initialize the field in labelToValueMap
          if (!labelToValueMap[col.field!]) {
            labelToValueMap[col.field!] = {};
          }

          try {
            col.cellEditorParams.values.forEach((item: any) => {
              if (item?.label == null || item?.value == null) {
                // console.warn(
                //   `Invalid value at index ${index} in cellEditorParams.values:`,
                //   item
                // );
              } else {
                labelToValueMap[col.field!][item.label] = item.value;
              }
            });
            // console.log("Column Definition:", col);
            // console.log(
            //   "cellEditorParams.values:",
            //   col.cellEditorParams?.values
            // );
          } catch (error) {
            console.error(
              `Error processing cellEditorParams.values for column ${col.field}:`,
              error,
            );
          }
        } else {
          // console.warn(
          //   `Invalid or missing cellEditorParams.values for column:`,
          //   col
          // );
        }
      });

      const newData: any[] = [];
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;

        const rowData: any = {};
        row.eachCell((cell, colIndex) => {
          const column = fieldMapping[colIndex];
          const field = column?.field;
          const cellValue = cell.value ?? "";

          if (field) {
            // Convert label to value using the reverse lookup map
            if (
              typeof cellValue === "string" &&
              labelToValueMap[field] &&
              cellValue in labelToValueMap[field]
            ) {
              rowData[field] = labelToValueMap[field][cellValue];
            } else {
              rowData[field] = cellValue;
            }
          }
        });
        // Add unitKey to each row
        rowData.unitKey = `${Date.now()}_${Math.random()}`;
        newData.push(rowData);
      });

      onSuccess(newData);
    } catch (error) {
      onError(error as Error);
    }
  },

  importToReplace: async ({
    file,
    columns,
    onSuccess,
    onError,
  }: {
    file: File;
    columns: {
      field: string;
      headerName: string;
      cellEditorParams?: { values: { value: string; label: string }[] };
    }[];
    onSuccess: (newData: any[]) => void;
    onError: (error: Error) => void;
  }) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];

      // Extract headers from the first row of the worksheet
      const headers = worksheet.getRow(1).values as string[];

      // Create a dynamic field mapping based on headers and columns
      const fieldMapping = headers.reduce(
        (acc, header, index) => {
          const column = columns.find((col) => col.headerName === header);
          if (column) {
            acc[index] = {
              field: column.field,
              valueMapping: column.cellEditorParams?.values.reduce(
                (map, pair) => {
                  map[pair.label] = pair.value; // Map label to value
                  return map;
                },
                {} as Record<string, string>,
              ), // Create a label-to-value mapping
            };
          }
          return acc;
        },
        {} as Record<
          number,
          { field: string; valueMapping?: Record<string, string> }
        >,
      );

      // Parse the remaining rows and map them to the corresponding fields
      const newData: any[] = [];
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // Skip header row
        const rowData: any = {};
        row.eachCell((cell, colIndex) => {
          const mapping = fieldMapping[colIndex];
          if (mapping) {
            if (mapping.valueMapping && typeof cell.value === "string") {
              // Convert label to value using the mapping if it exists
              rowData[mapping.field] =
                mapping.valueMapping[cell.value] ?? cell.value;
            } else {
              // Directly use the cell value if no mapping is required
              rowData[mapping.field] = cell.value;
            }
          }
        });
        // Add unitKey to each row
        rowData.unitKey = `${Date.now()}_${Math.random()}`;

        newData.push(rowData);
      });

      onSuccess(newData);
    } catch (error) {
      onError(error as Error);
    }
  },

  // hierarchical data structure table
  exportPermissionTable: (
    columnDefs: ColDef[],
    data: any[],
    fileName: string,
    options?: { decorated?: boolean }, // Optional flag to enable decorated version
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Permissions");

    // Generate headers dynamically from the provided columnDefs
    const headers = columnDefs.map((col) => col.headerName || col.field);
    const headerRow = worksheet.addRow(headers);

    // Set header row height
    headerRow.height = 25;

    if (options?.decorated) {
      // Apply light blue background, bold font, centered text, and thin gray-blue borders for the header
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E6F7FF" }, // Light blue background
        };
        cell.font = { bold: true }; // Bold text for headers
        cell.alignment = { vertical: "middle", horizontal: "center" }; // Center alignment
        cell.border = {
          top: { style: "thin", color: { argb: "C7D6DE" } },
          left: { style: "thin", color: { argb: "C7D6DE" } },
          bottom: { style: "thin", color: { argb: "C7D6DE" } },
          right: { style: "thin", color: { argb: "C7D6DE" } },
        };
      });
    }

    // Flatten hierarchical data based on expanded/collapsed state
    const flattenedData: any[] = [];
    const flattenHierarchy = (rows: any[], indentLevel = 0) => {
      rows.forEach((row) => {
        const flattenedRow = columnDefs.map((col) => {
          const fieldValue = row[col.field || ""] || "";
          return col.field === "menu"
            ? `${"  ".repeat(indentLevel)}${fieldValue}` // Indent for hierarchy
            : fieldValue;
        });
        flattenedData.push(flattenedRow);

        // Check if children should be added based on the expanded state
        if (row.children && row.children.length > 0) {
          if (!row.isExpanded) {
            flattenHierarchy(row.children, indentLevel + 1);
          }
        }
      });
    };

    flattenHierarchy(data);

    // Step 3: Add rows to the worksheet
    flattenedData.forEach((row, rowIndex) => {
      const dataRow = worksheet.addRow(row);

      // Set data row height
      dataRow.height = 25;

      if (options?.decorated) {
        // Apply alternating row colors and thin gray-blue borders
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowIndex % 2 === 0 ? "FFFFFF" : "F6FAFF" }, // Alternating row colors
          };
          cell.alignment = { vertical: "middle", horizontal: "left" }; // Left-aligned text
          cell.border = {
            top: { style: "thin", color: { argb: "C7D6DE" } },
            left: { style: "thin", color: { argb: "C7D6DE" } },
            bottom: { style: "thin", color: { argb: "C7D6DE" } },
            right: { style: "thin", color: { argb: "C7D6DE" } },
          };
        });
      }
    });

    // Auto-fit column widths with padding
    worksheet.columns.forEach((col) => {
      col.width = 20; // Set wider column width with padding
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);
    });
  },
};

interface ColumnDef {
  field?: string;
  headerName: string;
  children?: ColumnDef[];
}

interface Column {
  field?: string;
  headerName: string;
  children?: Column[];
}

// convert the column definitions from ag-grid format (colDef, ColGroup) into simple format
export const transformColumns = (
  cols: (ColDef<any, any> | ColGroupDef<any>)[],
): Column[] => {
  //  map each column
  return cols.map((col) => {
    const transformedCol: Column = {
      headerName: col.headerName || "", // Ensure headerName is always a string
      field: (col as ColDef).field,
      children:
        "children" in col && col.children
          ? transformColumns(col.children)
          : undefined,
    };
    return transformedCol;
  });
};

// for nested columns table (parent-child structure)
export const exportDynamicTable = (
  columns: ColumnDef[],
  data: any[],
  fileName: string,
  options?: { decorated?: boolean }, // Optional flag to enable decorated version
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Export Data");

  // Step 1: Analyze headers and create multi-level headers with correct alignment
  const headerLevels: string[][] = [];
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] =
    [];

  const processColumns = (
    cols: ColumnDef[],
    level: number,
    colStart: number,
  ) => {
    if (!headerLevels[level]) {
      headerLevels[level] = [];
    }
    let colIndex = colStart;

    cols.forEach((col) => {
      const colSpan = col.children ? getLeafCount(col.children) : 1;

      while (headerLevels[level].length < colIndex) {
        headerLevels[level].push("");
      }

      headerLevels[level][colIndex] = col.headerName;

      if (colSpan > 1) {
        merges.push({
          s: { r: level, c: colIndex },
          e: { r: level, c: colIndex + colSpan - 1 },
        });
      }

      if (!col.children) {
        merges.push({
          s: { r: level, c: colIndex },
          e: { r: headerLevels.length - 1, c: colIndex },
        });
      }

      if (col.children) {
        processColumns(col.children, level + 1, colIndex);
      }

      colIndex += colSpan;
    });

    return colIndex;
  };

  const getLeafCount = (cols: ColumnDef[]): number => {
    return cols.reduce(
      (count, col) =>
        col.children ? count + getLeafCount(col.children) : count + 1,
      0,
    );
  };

  processColumns(columns, 0, 0);

  // Add header rows to worksheet
  headerLevels.forEach((level) => {
    const headerRow = worksheet.addRow(level);

    // Set header row height
    headerRow.height = 25;

    if (options?.decorated) {
      // Apply header style: background color and borders
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E6F7FF" }, // Light blue background
        };
        cell.font = { bold: true }; // Bold text for headers
        cell.alignment = { vertical: "middle", horizontal: "center" }; // Center alignment
        cell.border = {
          top: { style: "thin", color: { argb: "C7D6DE" } },
          left: { style: "thin", color: { argb: "C7D6DE" } },
          bottom: { style: "thin", color: { argb: "C7D6DE" } },
          right: { style: "thin", color: { argb: "C7D6DE" } },
        };
      });
    }
  });

  // Explicitly merge the first column header vertically
  worksheet.mergeCells(
    1, // Start row
    1, // Start column
    headerLevels.length, // End row (spanning vertically)
    1, // End column (still the first column)
  );

  const firstHeaderCell = worksheet.getCell(1, 1);
  firstHeaderCell.alignment = { vertical: "middle", horizontal: "center" }; // Center alignment

  // Filter out conflicting merges for the first column
  const filteredMerges = merges.filter(
    (merge) => merge.s.c !== 0, // Skip merges that overlap with the first column
  );

  // Apply merges for other columns
  filteredMerges.forEach((merge) => {
    worksheet.mergeCells(
      merge.s.r + 1,
      merge.s.c + 1,
      merge.e.r + 1,
      merge.e.c + 1,
    );
  });

  // Extract leaf columns and add data rows
  const leafColumns: string[] = [];
  const extractLeafColumns = (cols: ColumnDef[]) => {
    cols.forEach((col) => {
      if (col.children) {
        extractLeafColumns(col.children);
      } else if (col.field) {
        leafColumns.push(col.field);
      }
    });
  };
  extractLeafColumns(columns);

  data.forEach((row, rowIndex) => {
    const rowData = leafColumns.map((field) => row[field] ?? "");
    const dataRow = worksheet.addRow(rowData);

    // Set row height for all data rows
    dataRow.height = 25;

    if (options?.decorated) {
      // Apply alternating row colors and borders
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowIndex % 2 === 0 ? "FFFFFF" : "F6FAFF" }, // row colors
        };
        cell.alignment = { vertical: "middle", horizontal: "left" }; // Left alignment
        cell.border = {
          top: { style: "thin", color: { argb: "C7D6DE" } },
          left: { style: "thin", color: { argb: "C7D6DE" } },
          bottom: { style: "thin", color: { argb: "C7D6DE" } },
          right: { style: "thin", color: { argb: "C7D6DE" } },
        };
      });
    }
  });

  // Auto-fit column widths
  worksheet.columns.forEach((col) => {
    col.width = (col.width ?? 15) + 5; // Add padding to auto-fit width
  });

  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  });
};
