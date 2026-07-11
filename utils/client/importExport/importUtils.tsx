/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Modal, Tooltip, Upload, Checkbox } from "antd";
import { ColDef } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { UploadFile } from "antd/es/upload/interface";
import React, { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { exportErrorsToExcel, DateColumnConfig } from "./exportErrorsToExcel";
import AgGridComponent from "@/components/basicUI/cTableAG";
import { showError, showSuccess } from "@/hooks/useNotification";
import { MesError } from "@/model/error";
import { useTranslations } from "next-intl";

export type ForeignKeyMapping = {
  field: string; // Field (dataIndex) cần tạo dropdown
  options: { label: string | null; value: string | number | null }[];
};

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
  type?: "required" | "format" | "duplicate" | "foreignKey" | "custom";
}

export interface ImportRow<T> {
  data: Partial<T>;
  errors?: ImportError[];
  hasErrors?: boolean;
  rowIndex?: number; // Add row index for AG-Grid
}

export interface ValidationRule {
  field: string;
  type: "required" | "format" | "unique" | "foreignKey" | "custom";
  message?: string;
  pattern?: RegExp;
  validator?: (value: any, row: any, allRows: any[]) => boolean | string;
}

export interface ImportExcelProps<T> {
  columns: ColDef[]; // Use AG-Grid columns directly
  onImport: (data: Partial<T>[]) => Promise<MesError[]>;
  buttonText?: string;
  foreignKeyMappings?: ForeignKeyMapping[];
  existingData?: Partial<T>[];
  uniqueFields?: string[];
  validationRules?: ValidationRule[];
  dateColumns?: DateColumnConfig[];
  fileUploadColumn?: string;
  uploadApi?: (
    file: File,
    rowData: Partial<T>,
  ) => Promise<{ size: string; type: string; uid: string; fileName: string }>;
  mes?: { field: string; mes: string; unitKey: string }[]; // <-- Add this line
  onImportResult?: (result: any) => void; // <-- Thêm dòng này
  enableCodeLabelParsing?: boolean; // Option to enable/disable "code - label" parsing
  onBeforeOpen?: () => boolean; // Callback to check before opening modal
}

/**
 * Utility function to validate if a value matches specific formats
 */
const validateFormat = (value: any, pattern: RegExp): boolean => {
  if (value === null || value === undefined || value === "") return true;
  return pattern.test(String(value));
};

/**
 * Component for importing Excel data with AG-Grid display
 */
export function ImportExcel<T extends object>({
  columns,
  onImport,
  buttonText = "Import Excel",
  foreignKeyMappings = [],
  existingData = [],
  uniqueFields = [],
  validationRules = [],
  dateColumns = [],
  enableCodeLabelParsing = true, // Default to true for backward compatibility
  onBeforeOpen,
}: // onImportResult, // <-- Thêm dòng này
ImportExcelProps<T>) {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<ImportRow<T>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  // Track if there are any errors in the data
  const hasErrors = previewData.some((row) => row.hasErrors);
  const mes = useTranslations("HandleNotion");
  const t = useTranslations("ImportExcel");

  // Handle exporting errors to Excel
  const handleExportErrors = async () => {
    try {
      if (!previewData || previewData.length === 0) {
        showError(t("noDataToExportError"));
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `import_errors_${timestamp}`;

      // Convert AG-Grid columns to Antd format for export
      const exportColumns = columns
        .filter((col) => col.field && col.field !== "__stt")
        .map((col) => ({
          title: col.headerName || col.field || "",
          dataIndex: col.field!, // Use non-null assertion since we filtered out undefined fields
          required: Boolean(col.headerClass), // Convert to boolean
          type: (col as any)?.type || "string", // Add type property with fallback
        }));

      await exportErrorsToExcel(
        previewData,
        exportColumns,
        foreignKeyMappings,
        filename,
        dateColumns,
      );

      showSuccess(t("exportErrorFileSuccess"));
    } catch (error) {
      console.error("Error exporting errors:", error);
      showError(t("exportErrorFileError"));
    }
  };

  // Clear state when closing modal
  const handleClose = () => {
    setIsModalVisible(false);
    setFileList([]);
    setPreviewData([]);
    setImportError(null);
  };

  // Check for duplicate values in a specified field across all rows
  const checkDuplicates = (
    field: string,
    value: any,
    rowIndex: number,
    allRows: Record<string, any>[],
  ): ImportError | null => {
    if (value === null || value === undefined || value === "") return null;

    // Check for duplicates within the imported data
    const duplicatesInCurrentData = allRows.findIndex(
      (row, idx) => idx !== rowIndex && row[field] === value,
    );

    if (duplicatesInCurrentData !== -1) {
      return {
        row: rowIndex + 2, // +2 because row 1 is header, and we're 0-indexed
        field,
        message: t("duplicateInCurrentData", { value, field }),
        value,
        type: "duplicate",
      };
    }

    // Check for duplicates with existing data if available
    if (existingData.length > 0) {
      const duplicateInExistingData = existingData.some(
        (existingRow: any) => existingRow[field] === value,
      );

      if (duplicateInExistingData) {
        return {
          row: rowIndex + 2,
          field,
          message: t("duplicateInExistingData", { value, field }),
          value,
          type: "duplicate",
        };
      }
    }

    return null;
  };

  // Apply custom validation rules
  const applyValidationRules = (
    row: Record<string, any>,
    rowIndex: number,
    allRows: Record<string, any>[],
  ): ImportError[] => {
    const errors: ImportError[] = [];

    validationRules.forEach((rule) => {
      const value = row[rule.field];

      // Skip validation if field doesn't exist
      if (!(rule.field in row)) return;

      // Required field check
      if (
        rule.type === "required" &&
        (value === null || value === undefined || value === "")
      ) {
        errors.push({
          row: rowIndex + 2,
          field: rule.field,
          message: rule.message || t("requiredField", { field: rule.field }),
          type: "required",
        });
        return;
      }

      // Skip other validations if value is empty
      if (value === null || value === undefined || value === "") return;

      // Format check
      if (
        rule.type === "format" &&
        rule.pattern &&
        !validateFormat(value, rule.pattern)
      ) {
        errors.push({
          row: rowIndex + 2,
          field: rule.field,
          message:
            rule.message || t("invalidFormat", { value, field: rule.field }),
          value,
          type: "format",
        });
      }

      // Unique field check
      if (rule.type === "unique") {
        const duplicateError = checkDuplicates(
          rule.field,
          value,
          rowIndex,
          allRows,
        );
        if (duplicateError) {
          errors.push({
            ...duplicateError,
            message: rule.message || duplicateError.message,
          });
        }
      }

      // Custom validator
      if (rule.type === "custom" && rule.validator) {
        const validationResult = rule.validator(value, row, allRows);
        if (validationResult !== true) {
          errors.push({
            row: rowIndex + 2,
            field: rule.field,
            message:
              typeof validationResult === "string"
                ? validationResult
                : rule.message ||
                  t("invalidValue", { value, field: rule.field }),
            value,
            type: "custom",
          });
        }
      }
    });

    return errors;
  };

  // // Modify the validation for foreign keys to be more flexible
  // const validateForeignKeys = (
  //   row: Record<string, any>,
  //   rowIndex: number,
  //   foreignKeyMappings: ForeignKeyMapping[]
  // ): ImportError[] => {
  //   const errors: ImportError[] = [];

  //   foreignKeyMappings.forEach((mapping) => {
  //     const fieldName = mapping.field;
  //     const fieldValue = row[fieldName];

  //     // Only validate if field has a value
  //     if (
  //       fieldValue !== undefined &&
  //       fieldValue !== null &&
  //       fieldValue !== ""
  //     ) {
  //       // More flexible matching: check for exact match, string representation, and case-insensitive match
  //       const isValid = mapping.options.some(
  //         (opt) =>
  //           // Exact match
  //           opt.value === fieldValue ||
  //           // String representation match (for number values)
  //           String(opt.value) === String(fieldValue) ||
  //           // Case-insensitive match for strings
  //           (typeof opt.value === "string" &&
  //             typeof fieldValue === "string" &&
  //             opt.value.toLowerCase() === fieldValue.toLowerCase())
  //       );

  //       if (!isValid) {
  //         errors.push({
  //           row: rowIndex + 2,
  //           field: fieldName,
  //           message: `Giá trị "${fieldValue}" không hợp lệ cho trường "${fieldName}"`,
  //           value: fieldValue,
  //           type: "foreignKey",
  //         });
  //       }
  //     }
  //   });

  //   return errors;
  // };

  // Process Excel file with enhanced validation
  const processFile = async (file: File | Blob | null) => {
    // Check if file is valid
    if (!file) {
      setImportError(t("invalidFile"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setImportError(null);

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            throw new Error(t("cannotReadFileData"));
          }

          const data = new Uint8Array(e.target.result as ArrayBuffer);

          const workbook = XLSX.read(data, { type: "array" });

          // Check if workbook exists and has sheets
          if (
            !workbook ||
            !workbook.SheetNames ||
            workbook.SheetNames.length === 0
          ) {
            throw new Error(t("invalidExcelFile"));
          }

          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Also look for ReferenceData sheet that contains the label-value mappings
          const referenceSheetName = workbook.SheetNames.find(
            (name) => name === "ReferenceData" || name === "Reference Data",
          );
          const referenceData: Record<string, string> = {};
          // If reference sheet exists, extract label-value mappings
          if (referenceSheetName) {
            const refSheet = workbook.Sheets[referenceSheetName];
            const refData = XLSX.utils.sheet_to_json(refSheet);

            // Build a mapping of label to value from reference data
            refData.forEach((row: any) => {
              if (row.Label && row.Value !== undefined) {
                referenceData[row.Label] = row.Value;
              }
            });
          }

          /// 1) Đọc toàn bộ sheet thành mảng 2‑chiều (dòng → mảng ô)
          const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null, // ô trống → null
          });

          /// 2) Bỏ qua dòng đầu (header người dùng nhập)
          const dataRows = sheetData.slice(1);

          /// 3) Map thủ công theo `columns`
          const rawData: Record<string, any>[] = dataRows.map((rowArr) => {
            const obj: Record<string, any> = {};

            // Duyệt đúng thứ tự columns (bỏ "__stt")
            columns
              .filter((c) => c.field && c.field !== "__stt")
              .forEach((col, idx) => {
                obj[col.field!] = rowArr[idx] ?? null; // nếu ô thiếu → null
              });

            return obj;
          });

          // Create column mapping from AG-Grid columns
          const columnInfo = columns
            .filter((col) => col.field && col.field !== "__stt")
            .map((col) => ({
              key: col.field!,
              title: col.headerName || col.field || "",
              required: col.headerClass || false,
            }));

          const headerToField = new Map<string, string>();
          columnInfo.forEach((col) => {
            headerToField.set(String(col.title || ""), col.key);
          });
          // If empty, show error
          if (!rawData || rawData.length === 0) {
            setImportError(t("noDataInFile"));
            setLoading(false);
            return;
          }

          // First pass: transform data from Excel format to object model
          const transformedRows: Record<string, any>[] = [];
          console.log("rawData", rawData);

          (rawData as Record<string, any>[]).forEach(
            (row: Record<string, any>) => {
              const newRow: Record<string, any> = {};

              // Check for date fields in hidden _ISO columns first
              dateColumns.forEach((dc) => {
                const isoFieldName = `${dc.field}_ISO`;
                if (
                  row[isoFieldName] !== undefined &&
                  row[isoFieldName] !== null &&
                  row[isoFieldName] !== ""
                ) {
                  // Use ISO string from hidden column directly
                  newRow[dc.field] = row[isoFieldName];
                }
              });

              // Map fields using header mapping
              Object.entries(row).forEach(([header, value]) => {
                // Remove asterisk (*) from field headers if they exist
                const cleanHeader = header.replace(/\s*\*\s*$/, "");
                const fieldName = headerToField.get(cleanHeader);

                if (fieldName) {
                  // Skip if already set from ISO column
                  if (newRow[fieldName] !== undefined) {
                    return;
                  }

                  // Check if this is a date field
                  const isDateField = dateColumns.some(
                    (dc) => dc.field === fieldName,
                  );

                  if (
                    isDateField &&
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                  ) {
                    // Handle date processing
                    if (typeof value === "number") {
                      // Excel stores dates as serial numbers
                      const excelEpoch = new Date(1899, 11, 30);
                      const utcDays = value - (value < 60 ? 0 : 1); // Excel bug for leap year 1900
                      const date = new Date(
                        excelEpoch.getTime() + utcDays * 24 * 60 * 60 * 1000,
                      );
                      newRow[fieldName] = date.toISOString();
                    } else if (typeof value === "string") {
                      // If it's already a string, try to parse it as a date
                      // First check if it's already an ISO string
                      if (
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(
                          value,
                        )
                      ) {
                        newRow[fieldName] = value; // Already ISO format
                      } else {
                        // Try parsing common date formats DD/MM/YYYY or YYYY-MM-DD
                        let date;
                        if (value.includes("/")) {
                          // DD/MM/YYYY format
                          const parts = value.split("/");
                          if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            date = new Date(year, month, day);
                          }
                        } else if (value.includes("-")) {
                          // YYYY-MM-DD format
                          const parts = value.split("-");
                          if (parts.length === 3) {
                            const year = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const day = parseInt(parts[2], 10);
                            date = new Date(year, month, day);
                          }
                        }

                        // Convert to ISO string if we got a valid date
                        if (date && !isNaN(date.getTime())) {
                          newRow[fieldName] = date.toISOString();
                        } else {
                          newRow[fieldName] = value; // Keep original if parsing fails
                        }
                      }
                    } else {
                      newRow[fieldName] = value;
                    }
                  } else {
                    // Find column type for this field
                    const columnType = (
                      columns.find((col) => col.field === fieldName) as any
                    )?.type;

                    // Auto-convert to string for string type fields
                    if (
                      columnType === "string" &&
                      value !== null &&
                      value !== undefined
                    ) {
                      newRow[fieldName] = String(value);
                    } else {
                      newRow[fieldName] = value;
                    }
                  }
                } else if (columnInfo.some((col) => col.key === cleanHeader)) {
                  // Find column type for directly matched fields
                  // Find column type for directly matched fields
                  const directColumnType = (
                    columns.find((col) => col.field === cleanHeader) as any
                  )?.type;

                  // Auto-convert to string for string type fields
                  if (
                    directColumnType === "string" &&
                    value !== null &&
                    value !== undefined
                  ) {
                    newRow[cleanHeader] = String(value);
                  } else {
                    newRow[cleanHeader] = value;
                  }
                }
              });

              // Process foreign keys as quickly as possible for getting correct values
              foreignKeyMappings.forEach((mapping) => {
                const fieldName = mapping.field;
                const fieldValue = newRow[fieldName];
                const valueColumnName = `${fieldName}_Value`;

                // Find column type for this field
                const columnType = (
                  columns.find((col) => col.field === fieldName) as any
                )?.type;

                // Check for *_Value column from template
                if (
                  (row as Record<string, any>)[valueColumnName] !== undefined
                ) {
                  const valueColValue = (row as Record<string, any>)[
                    valueColumnName
                  ];
                  // Convert to string if column type is string
                  newRow[fieldName] =
                    columnType === "string" &&
                    valueColValue !== null &&
                    valueColValue !== undefined
                      ? String(valueColValue)
                      : valueColValue;
                  return;
                }

                // Quick value conversion for foreign keys
                if (fieldValue && typeof fieldValue === "string") {
                  let matched = false;

                  // Extract code from "code - label" format (only if enabled)
                  if (enableCodeLabelParsing && fieldValue.includes(" - ")) {
                    const code = fieldValue.split(" - ")[0].trim();
                    const validOption = mapping.options.find(
                      (opt) => opt.value === code,
                    );
                    if (validOption) {
                      newRow[fieldName] = code;
                      matched = true;
                    }
                  }
                  // Look up in reference data
                  else if (referenceData[fieldValue]) {
                    newRow[fieldName] = referenceData[fieldValue];
                    matched = true;
                  }
                  // Check for exact match
                  else {
                    const exactMatch = mapping.options.find(
                      (opt) =>
                        opt.label === fieldValue || opt.value === fieldValue,
                    );
                    if (exactMatch) {
                      newRow[fieldName] = exactMatch.value;
                      matched = true;
                    }
                  }

                  // If no match was found but the field has a value, keep the original value
                  // This ensures that required fields that aren't foreign keys still get their values
                  if (!matched) {
                    console.log(
                      `No match found for ${fieldName}: ${fieldValue}, keeping original value`,
                    );
                  }
                }
              });

              // Post-process: strip special chars & auto-uppercase (mirrors featureExtend.ts Text logic)
              columns
                .filter((c) => c.field && c.field !== "__stt")
                .forEach((col: any) => {
                  const field = col.field as string;
                  const val = newRow[field];
                  if (val === null || val === undefined || val === "") return;

                  let processedValue = String(val);

                  // Strip special characters if not explicitly allowed
                  if (!col.allowSpecialCharacters) {
                    const allowedChars: string[] =
                      col.allowedSpecialChars || [];
                    const escapedAllowedChars = allowedChars
                      .map((c: string) => {
                        if (c === "-" || c === "^" || c === "]" || c === "\\") {
                          return "\\" + c;
                        }
                        return c.replace(/[.*+?${}()|[\]\/]/g, "\\$&");
                      })
                      .join("");

                    const regexStr = col.isNumber
                      ? `[^0-9${escapedAllowedChars}]`
                      : `[^\\p{L}\\p{N}\\p{M}\\s${escapedAllowedChars}]`;
                    const regex = new RegExp(regexStr, "gu");
                    processedValue = processedValue.replace(regex, "");
                  }

                  // Auto uppercase when column has uppercase: true
                  if (col.uppercase) {
                    processedValue = processedValue.toUpperCase();
                  }

                  newRow[field] = processedValue;
                });

              transformedRows.push(newRow);
            },
          );

          // Second pass: validate all data with full context
          const processedData: ImportRow<T>[] = [];

          transformedRows.forEach((row, rowIndex) => {
            const errors: ImportError[] = [];

            // Required fields check - get all fields that are required based on column definitions
            columnInfo
              .filter((col) => col.required)
              .forEach((col) => {
                if (
                  row[col.key] === undefined ||
                  row[col.key] === null ||
                  row[col.key] === ""
                ) {
                  errors.push({
                    row: rowIndex + 2,
                    field: col.key,
                    message: t("requiredField", { field: col.title }),
                    type: "required",
                  });
                }
              });

            // Check each unique field for duplicates
            uniqueFields.forEach((field) => {
              const duplicateError = checkDuplicates(
                field,
                row[field],
                rowIndex,
                transformedRows,
              );
              if (duplicateError) {
                errors.push(duplicateError);
              }
            });

            // and only if they have values
            foreignKeyMappings.forEach((mapping) => {
              const fieldName = mapping.field;
              const fieldValue = row[fieldName];
              // Only validate if field has a value
              if (
                fieldValue !== undefined &&
                fieldValue !== null &&
                fieldValue !== ""
              ) {
                const isValid = mapping.options.some(
                  (opt) => opt.value === fieldValue,
                );
                if (!isValid) {
                  errors.push({
                    row: rowIndex + 2,
                    field: fieldName,
                    message: t("invalidForeignKey", {
                      value: fieldValue,
                      field: fieldName,
                    }),
                    value: fieldValue,
                    type: "foreignKey",
                  });
                }
              }
            });

            // MaxLength validation – hiện lỗi qua ErrorCellRenderer trong modal
            columns
              .filter((c) => c.field && c.field !== "__stt")
              .forEach((col: any) => {
                const field = col.field as string;
                const maxLength = col.cellEditorParams?.maxLength;
                const value = row[field];
                if (
                  maxLength &&
                  value !== null &&
                  value !== undefined &&
                  value !== "" &&
                  String(value).length > maxLength
                ) {
                  errors.push({
                    row: rowIndex + 2,
                    field,
                    message: `Trường "${
                      col.headerName || field
                    }" vượt quá ${maxLength} ký tự (hiện tại: ${String(value).length})`,
                    value,
                    type: "format",
                  });
                }
              });

            // Apply custom validation rules
            const customErrors = applyValidationRules(
              row,
              rowIndex,
              transformedRows,
            );
            errors.push(...customErrors);

            // Add the processed row with any errors
            processedData.push({
              data: row as Partial<T>,
              errors: errors.length > 0 ? errors : undefined,
              hasErrors: errors.length > 0,
              rowIndex: rowIndex, // Add row index for AG-Grid
            });
          });

          // Filter out empty rows
          const filteredData = processedData
            .filter((row) => {
              const hasValue = Object.values(row.data).some(
                (value) =>
                  value !== null &&
                  value !== undefined &&
                  (typeof value !== "string" || value.trim() !== ""),
              );
              return hasValue;
            })
            .map((row, index) => {
              // Thêm unitKey vào bên trong row.data
              (row.data as Record<string, any>).unitKey =
                `uk-${Date.now()}-${index}`;
              return row;
            });

          if (filteredData.length === 0) {
            setImportError(t("noValidData"));
            setLoading(false);
            return;
          }

          setPreviewData(filteredData);
          setLoading(false);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setImportError(t("excelParseError"));
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setImportError(t("fileReadError"));
        setLoading(false);
      };

      // Use a try-catch block specifically for readAsArrayBuffer
      try {
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error reading file as ArrayBuffer:", error);
        setImportError(t("fileFormatError"));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setImportError(t("fileProcessingError"));
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (info: any) => {
    // Only keep the latest file
    const fileList = info.fileList.slice(-1);
    setFileList(fileList);

    // Check if there's a file and it has originFileObj
    if (fileList.length > 0 && fileList[0].originFileObj) {
      processFile(fileList[0].originFileObj);
    } else {
      setImportError(t("fileReadError"));
      setLoading(false);
    }
  };

  // Handle import action
  const handleImport = async () => {
    if (previewData.length === 0) {
      showError(t("noDataToImport"));
      return;
    }

    try {
      setLoading(true);

      const validData = previewData
        .filter((row) => !row.hasErrors)
        .map((row) => {
          const cleanData: Partial<T> = {};

          Object.entries(row.data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              cleanData[key as keyof T] = value as T[keyof T];
            }
          });

          return cleanData;
        });

      if (validData.length === 0) {
        showError(t("noValidDataToImport"));
        setLoading(false);
        return;
      }

      const result = await onImport(validData);
      // setMesError(result); // <-- Lưu kết quả mesError từ onImport
      setPreviewData((prev) =>
        prev
          .filter((row) =>
            result.some((m) => m.unitKey === (row.data as any)?.unitKey),
          )
          .map((row) => {
            const unitKey = (row.data as any)?.unitKey;
            const mesForRow = result.filter(
              (m) => m.unitKey === unitKey && m.field in row.data,
            );
            if (mesForRow.length > 0) {
              return {
                ...row,
                errors: [
                  ...(row.errors || []),
                  ...mesForRow.map((m) => ({
                    row: row.rowIndex! + 2,
                    field: m.field,
                    message: m.mes,
                    type: "custom" as ImportError["type"],
                  })),
                ] as ImportError[],
                hasErrors: true,
              };
            }
            return row;
          }),
      );
      const count = validData.length - result.length;
      if (count > 0) {
        showSuccess(mes("success.rowsAdded", { count: count }));
      }
      if (result.length <= 0) {
        handleClose();
      }
    } catch (error) {
      console.error("Import error:", error);
      showError(t("importError"));
    } finally {
      setLoading(false);
    }
  };

  // Generate error summary by type
  const generateErrorSummary = () => {
    if (!previewData.some((row) => row.hasErrors)) return null;

    const errorCountByType: Record<string, number> = {
      required: 0,
      duplicate: 0,
      format: 0,
      foreignKey: 0,
      custom: 0,
      other: 0,
    };

    previewData.forEach((row) => {
      if (row.errors) {
        row.errors.forEach((err) => {
          const type = err.type || "other";
          if (!errorCountByType[type]) errorCountByType[type] = 0;
          errorCountByType[type] += 1;
        });
      }
    });

    return (
      <div style={{ marginBottom: 10 }}>
        <h4 style={{ marginBottom: 5 }}>{t("errorSummary")}:</h4>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {errorCountByType.required > 0 && (
            <li>
              {t("missingRequiredData")}: {errorCountByType.required}{" "}
              {t("errors")}
            </li>
          )}
          {errorCountByType.duplicate > 0 && (
            <li>
              {t("duplicateData")}: {errorCountByType.duplicate} {t("errors")}
            </li>
          )}
          {errorCountByType.format > 0 && (
            <li>
              {t("invalidFormat")}: {errorCountByType.format} {t("errors")}
            </li>
          )}
          {errorCountByType.foreignKey > 0 && (
            <li>
              {t("invalidData")}: {errorCountByType.foreignKey} {t("errors")}
            </li>
          )}
          {errorCountByType.custom > 0 && (
            <li>
              {t("otherErrors")}: {errorCountByType.custom} {t("errors")}
            </li>
          )}
          {errorCountByType.other > 0 && (
            <li>
              {t("unknownErrors")}: {errorCountByType.other} {t("errors")}
            </li>
          )}
        </ul>
      </div>
    );
  };

  // Custom cell renderer for error display
  const ErrorCellRenderer = useCallback(
    (params: any) => {
      const { value, data } = params;
      const fieldName = params.colDef.field;
      const type = params.colDef.type; // Get the column type
      const errors: ImportError[] =
        data?.errors ?? data?._original?.errors ?? [];

      const fieldErrors = errors.filter(
        (err: ImportError) => err.field === fieldName,
      );

      // For boolean type, render checkbox
      if (type === "boolean") {
        const checkbox = <Checkbox checked={!!value} disabled />;
        if (fieldErrors.length > 0) {
          return (
            <Tooltip
              title={
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {fieldErrors.map((err: ImportError, idx: number) => (
                    <li key={idx}>{err.message}</li>
                  ))}
                </ul>
              }
            >
              <div style={{ color: "red" }}>{checkbox}</div>
            </Tooltip>
          );
        } else {
          return checkbox;
        }
      }

      // For other types, render as text
      let displayValue = value;
      const fkMapping = foreignKeyMappings.find((fk) => fk.field === fieldName);
      if (fkMapping) {
        const option = fkMapping.options.find((opt) => opt.value === value);
        if (option && option.label !== undefined && option.label !== null) {
          displayValue = option.label;
        }
      }

      if (fieldErrors.length === 0) {
        return displayValue;
      }

      return (
        <Tooltip
          title={
            <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
              {fieldErrors.map((err: ImportError, idx: number) => (
                <li key={idx}>{err.message}</li>
              ))}
            </ul>
          }
        >
          <div style={{ display: "flex", alignItems: "center", color: "red" }}>
            <ExclamationCircleOutlined style={{ marginRight: 5 }} />
            <span>{displayValue}</span>
          </div>
        </Tooltip>
      );
    },
    [foreignKeyMappings],
  );

  // Generate AG-Grid column definitions
  const gridColumns: ColDef[] = useMemo(() => {
    // Ép tất cả các column đều dùng ErrorCellRenderer, kể cả khi có cellRendererSelector
    const baseColumns = columns
      .filter((col) => col.field && col.field !== "__stt")
      .map((col) => ({
        ...col,
        cellRenderer: ErrorCellRenderer, // Ghi đè cellRenderer lên luôn
        editable: false, // Không cho phép chỉnh sửa trực tiếp trong preview
        //tắt cellRendererSelector để dùng ErrorCellRenderer cho tất cả
        cellRendererSelector: undefined,
      }));

    // Add error summary column
    const errorColumn: ColDef = {
      headerName: t("errors"),
      field: "errorSummary",
      width: 250,
      suppressSizeToFit: true,
      cellRenderer: (params: any) => {
        const { data } = params;

        if (!data || !data.errors || data.errors.length === 0) {
          return null;
        }

        const errorsByType: Record<string, string[]> = {};
        data.errors.forEach((err: ImportError) => {
          const type = err.type || "other";
          if (!errorsByType[type]) errorsByType[type] = [];
          errorsByType[type].push(err.message);
        });

        return (
          <Tooltip
            title={
              <div>
                {Object.entries(errorsByType).map(([type, messages], idx) => (
                  <div key={idx}>
                    <strong>
                      {type === "required"
                        ? t("missingData")
                        : type === "duplicate"
                          ? t("duplicate")
                          : type === "format"
                            ? t("invalidFormat")
                            : type === "foreignKey"
                              ? t("invalidData")
                              : t("otherErrors")}
                      :
                    </strong>
                    <ul style={{ margin: "0 0 8px 0", padding: "0 0 0 16px" }}>
                      {messages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            }
          >
            <div style={{ color: "red", cursor: "pointer" }}>
              <ExclamationCircleOutlined /> {data.errors.length} {t("errors")}
            </div>
          </Tooltip>
        );
      },
    };

    return [...baseColumns, errorColumn];
  }, [
    columns,
    ErrorCellRenderer,
    // mes,
    t,
  ]);
  // console.log("gridColumns", gridColumns);
  // console.log("previewData", previewData);

  // Row class rules for styling error rows
  const getRowClass = useCallback((params: any) => {
    if (params.data && params.data.hasErrors) {
      return "row-with-error";
    }
    return "";
  }, []);

  return (
    <>
      <Button
        icon={<FileExcelOutlined />}
        onClick={() => {
          if (onBeforeOpen && !onBeforeOpen()) {
            return; // Do not open modal if onBeforeOpen returns false
          }
          setIsModalVisible(true);
        }}
      >
        {buttonText}
      </Button>

      <Modal
        title={t("importExcelData")}
        open={isModalVisible}
        onCancel={handleClose}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            {t("cancel")}
          </Button>,
          hasErrors && (
            <Button
              key="export-errors"
              onClick={handleExportErrors}
              icon={<DownloadOutlined />}
              type="default"
            >
              {t("exportErrors")}
            </Button>
          ),
          <Button
            key="import"
            type="primary"
            loading={loading}
            onClick={handleImport}
            disabled={
              previewData.length === 0 ||
              !!importError ||
              previewData.every((row) => row.hasErrors)
            }
          >
            {t("importRows", {
              valid: previewData.filter((row) => !row.hasErrors).length,
              total: previewData.length,
            })}
          </Button>,
        ]}
      >
        <Upload
          accept=".xlsx,.xls"
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>{t("selectExcelFile")}</Button>
        </Upload>

        {importError && (
          <div style={{ color: "red", margin: "10px 0" }}>{importError}</div>
        )}

        {hasErrors && (
          <>
            <div
              style={{
                color: "orange",
                margin: "10px 0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              <span>
                {t("foundErrors", {
                  count: previewData.filter((row) => row.hasErrors).length,
                })}
              </span>
            </div>
            {generateErrorSummary()}
          </>
        )}

        {previewData.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>{t("previewData", { count: previewData.length })}</h3>
            <div className="ag-theme-alpine" style={{ width: "100%" }}>
              <AgGridComponent
                loading={loading}
                //thêm unitKey vào rowData để giữ nguyên cấu trúc gốc
                rowData={previewData.map((row) => ({
                  ...row,
                  ...row.data, // Flatten data properties to top level for AG-Grid
                  _original: row, // Keep original structure for reference
                }))}
                gridRef={gridRef}
                columnDefs={gridColumns}
                getRowClass={getRowClass}
                headerHeight={40}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                  flex: 1,
                  minWidth: 100,
                }}
              />
            </div>
            <style jsx global>{`
              .row-with-error {
                background-color: #fff2f0 !important;
              }
              .ag-theme-alpine .ag-row.row-with-error {
                background-color: #fff2f0 !important;
              }
              .ag-theme-alpine .ag-row.row-with-error:hover {
                background-color: #ffe7e7 !important;
              }
            `}</style>
          </div>
        )}
      </Modal>
    </>
  );
}
