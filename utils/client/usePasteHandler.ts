/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef } from "react";
// import { getCntrSztpMap } from "@/services/ca/api";
// import { getLocalSZPT } from "@/services/selectTableApi";
import { FilterOperationType } from "@chax-at/prisma-filter-common";
import { getItemId } from "./validationHelpers";

/**
 * Custom hook xử lý paste dữ liệu từ clipboard và fill operation
 * Tự động fetch isoSztp khi detect localSztp change
 * Tự động fetch và quản lý localSztp options theo oprCD
 * @param {Function} getRowData - Hàm lấy dữ liệu hiện tại của bảng
 * @param {Function} setRowData - Hàm cập nhật dữ liệu cho bảng
 * @param {React.RefObject} gridRef - Tham chiếu tới bảng AgGrid
 * @param {Function} onValuesChanged - Hàm callback để nhận danh sách thay đổi
 * @param {Function} onFillChanges - Hàm callback để xử lý fill operation từ cTableAG (có thể async)
 * @param {boolean} disablePaste - Flag để tạm thời vô hiệu hóa paste handler
 */
const usePasteHandler = (
  getRowData: () => any[],
  setRowData: (newRowData: any[]) => void,
  gridRef: React.RefObject<any>,
  onValuesChanged: (
    changes: { id: string; data: Record<string, any> }[],
  ) => void,
  onFillChanges?: (
    changes: { id: string; data: Record<string, any> }[],
  ) => void | Promise<void>,
  disablePaste: boolean = false,
) => {
  // Ref để lưu localSztp options
  const localSztpOptionsRef = useRef<{ oprCD: string; localSztp: string }[]>(
    [],
  );

  // Fetch localSztp options khi mount
  useEffect(() => {
    const fetchLocalSztp = async () => {
      try {
        // const response = await getLocalSZPT();
        const response = { data: { data: [] } };
        const sorted = response.data.data
          .slice()
          .sort((a: { localSztp: string }, b: { localSztp: string }) =>
            a.localSztp.localeCompare(b.localSztp, "vi"),
          );
        localSztpOptionsRef.current = sorted;
      } catch (error) {
        console.error("Error fetching localSztp data:", error);
      }
    };
    fetchLocalSztp();
  }, []);

  const handlePasteData = useCallback(() => {
    // Kiểm tra nếu paste bị vô hiệu hóa
    if (disablePaste) {
      return;
    }

    // Check if focus is on an input, textarea, or contenteditable element
    const activeElement = document.activeElement;
    const isInputFocused =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true");

    // If input/textarea is focused and grid doesn't have focused cell, don't handle paste
    const focusedCell = gridRef.current?.api.getFocusedCell();
    if (isInputFocused && !focusedCell) {
      return;
    }

    if (gridRef.current?.api.getEditingCells()?.length > 0) {
      return;
    }

    navigator.clipboard.readText().then((data) => {
      const pastedData = data
        .trim()
        .split("\n")
        .map((row) => row.split("\t").map((cell) => cell.trim()));

      const updatedRowData = [...getRowData()];
      const changes: { id: string; data: Record<string, any> }[] = [];

      const focusedCell = gridRef.current?.api.getFocusedCell();
      if (!focusedCell) {
        return;
      }

      const { rowIndex: startRowIndex, column } = focusedCell;
      const currentColumnField = column.getColDef().field;

      if (!currentColumnField) {
        return;
      }

      const columnDefs = gridRef.current?.api.getColumnDefs();
      if (!columnDefs) {
        return;
      }

      const fieldToColDef = new Map<string, any>();
      columnDefs.forEach((colDef: any) => {
        if (colDef?.field) fieldToColDef.set(colDef.field, colDef);
      });

      const buildAgParams = (targetRowIndex: number, colDef: any) => {
        const api = gridRef.current?.api;
        const columnApi = gridRef.current?.columnApi;
        const node = api?.getDisplayedRowAtIndex?.(targetRowIndex);
        return {
          api,
          columnApi,
          node,
          data: node?.data ?? getRowData()[targetRowIndex],
          colDef,
          column: columnApi?.getColumn(colDef.field),
          context: api?.getContext?.(),
        } as any;
      };
      // Xử lý giá trị select
      const getSelectValuesForCol = (
        colDef: any,
        targetRowIndex: number,
      ): { values?: any[]; allowAddOption?: boolean } => {
        if (!colDef) return {};

        const paramsDef = colDef.cellEditorParams;
        let paramsObj: any = null;

        // Ưu tiên lấy values từ cellEditorParams nếu có
        if (typeof paramsDef === "function") {
          try {
            paramsObj = paramsDef(buildAgParams(targetRowIndex, colDef));
          } catch {
            paramsObj = null;
          }
        } else if (typeof paramsDef === "object" && paramsDef) {
          paramsObj = paramsDef;
        }

        // Nếu chưa có values nhưng colDef có selectOptions (cấu hình riêng của dự án)
        // thì dùng nó làm danh sách option cho select
        if ((!paramsObj || !paramsObj.values) && colDef.selectOptions) {
          paramsObj = {
            ...(paramsObj || {}),
            values: colDef.selectOptions,
          };
        }

        return paramsObj || {};
      };
      // Xử lý số thập phân có dấu phẩy
      const normalizeNumberString = (input: any): string => {
        const str = String(input ?? "").trim();
        if (str === "") return str;
        if (str.includes(".") && str.includes(",")) {
          const removedThousands = str.replace(/\./g, "");
          return removedThousands.replace(/,/g, ".");
        }
        if (str.includes(",") && /^[0-9,]+$/.test(str)) {
          return str.replace(/,/g, ".");
        }
        return str;
      };
      // Xử lý giá trị select
      const resolveSelectValue = (
        rawValue: any,
        colDef: any,
        targetRowIndex: number,
      ): { isSelect: boolean; allowed: boolean; stored: any } => {
        const paramsObj = getSelectValuesForCol(colDef, targetRowIndex);
        const values: any[] | undefined = paramsObj?.values;
        const allowAddOption: boolean | undefined = paramsObj?.allowAddOption;

        const typeCol = (colDef as any)?.typeColumn;
        const isSelectType =
          typeCol === "Select" ||
          (colDef?.cellEditor as any)?.name === "AntdSelectCellEditor" ||
          (colDef?.cellEditor as any)?.displayName === "AntdSelectCellEditor" ||
          (typeof typeCol === "string" && typeCol.includes("Select")) ||
          (Array.isArray(typeCol) && typeCol.includes("Select")) ||
          (values && values.length > 0);

        if (!values || !Array.isArray(values)) {
          if (isSelectType) {
            return { isSelect: true, allowed: false, stored: "" };
          }
          return {
            isSelect: false,
            allowed: true,
            stored: String(rawValue ?? ""),
          };
        }
        const candidate = String(rawValue ?? "").trim();
        // Check if values is empty array
        if (values.length === 0) {
          return { isSelect: true, allowed: false, stored: "" };
        }

        for (const option of values) {
          if (option == null) continue;
          if (typeof option === "string" || typeof option === "number") {
            const opt = String(option).trim();
            if (opt === candidate) {
              return { isSelect: true, allowed: true, stored: option };
            }
          } else if (typeof option === "object") {
            const valueKeys = ["value", "code", "key", "id"] as const;
            const labelKeys = ["label", "name", "text", "value"] as const;
            let optionValue: string | undefined;
            for (const k of valueKeys) {
              if (option[k] != null) {
                optionValue = String(option[k]).trim();
                break;
              }
            }
            const labels: string[] = [];
            for (const k of labelKeys) {
              if (option[k] != null) labels.push(String(option[k]).trim());
            }

            // Find the actual value to store (prefer explicitly set 'value' prop)
            const actualValue =
              option.value !== undefined ? option.value : optionValue;

            if (optionValue && optionValue === candidate) {
              return { isSelect: true, allowed: true, stored: actualValue };
            }
            if (labels.includes(candidate)) {
              return {
                isSelect: true,
                allowed: true,
                stored: actualValue ?? candidate,
              };
            }
          }
        }
        if (allowAddOption) {
          return { isSelect: true, allowed: true, stored: candidate };
        }
        return { isSelect: true, allowed: false, stored: "" };
      };

      const columnOrder = columnDefs
        .map((colDef: any) => colDef.field)
        .filter((field: string | undefined): field is string => !!field);

      const currentColIndex = columnOrder.indexOf(currentColumnField);
      if (currentColIndex === -1) {
        return;
      }

      // Helper function to check if a column is boolean type
      const isBooleanColumn = (colDef: any): boolean => {
        if (!colDef) return false;
        // Check explicit typeColumn first
        if (colDef.typeColumn === "Checkbox") return true;
        // Check if it uses checkbox renderer (built-in or custom)
        if (
          colDef.cellRenderer === "agCheckboxCellRenderer" ||
          colDef.cellRenderer?.name === "CheckboxCellEditor" ||
          colDef.cellRenderer?.displayName === "CheckboxCellRenderer"
        ) {
          return true;
        }
        // Check if field name suggests boolean (only for common internal fields)
        const booleanFieldNames = [
          "enabled",
          "disabled",
          "checked",
          "active",
          "isactive",
          "isnew",
          "iserror",
          "issaved",
        ];
        if (
          colDef.field &&
          booleanFieldNames.includes(colDef.field.toLowerCase())
        ) {
          return true;
        }
        return false;
      };

      pastedData.forEach((row, pastedRowIndex) => {
        const targetRowIndex = startRowIndex + pastedRowIndex;

        // Support pasting to newly added rows - check both displayed rows and all row data
        const displayedRowCount =
          gridRef.current?.api.getDisplayedRowCount() || updatedRowData.length;
        const maxRowIndex = Math.max(displayedRowCount, updatedRowData.length);

        if (targetRowIndex < maxRowIndex) {
          // Get the actual row data - try displayed row first, then fallback to rowData
          let targetRow: any;
          const displayedNode =
            gridRef.current?.api.getDisplayedRowAtIndex(targetRowIndex);
          if (displayedNode && displayedNode.data) {
            targetRow = displayedNode.data;
            // Find the index in updatedRowData
            const rowId = getItemId(targetRow);
            const dataIndex = updatedRowData.findIndex(
              (r) => getItemId(r) === rowId,
            );
            if (dataIndex !== -1) {
              targetRow = updatedRowData[dataIndex];
            }
          } else if (targetRowIndex < updatedRowData.length) {
            targetRow = updatedRowData[targetRowIndex];
          } else {
            // Row doesn't exist yet, skip
            return;
          }

          const rowId = getItemId(targetRow);
          const changedData: Record<string, any> = {};

          row.forEach((cellValue, pastedColIndex) => {
            const targetColIndex = currentColIndex + pastedColIndex;
            if (targetColIndex < columnOrder.length) {
              const targetField = columnOrder[targetColIndex];
              const colDef = fieldToColDef.get(targetField);

              // Skip if column definition doesn't exist
              if (!colDef) {
                return;
              }

              // Check if column is editable
              if (colDef.editable === false) {
                return;
              }

              // Skip boolean columns - prevent pasting into them
              if (isBooleanColumn(colDef)) {
                return; // Skip this cell
              }

              // Skip localSztp and isoSztp columns if oprCD is not present
              if (
                (targetField === "localSztp" || targetField === "isoSztp") &&
                (!targetRow.oprCD || String(targetRow.oprCD).trim() === "")
              ) {
                return; // Skip this cell
              }

              // Check if field exists (including nested fields like "groups.name")
              // For nested fields, we check if the column has a valueSetter
              const hasField =
                targetRow.hasOwnProperty(targetField) ||
                colDef.valueSetter !== undefined ||
                colDef.field?.includes(".");

              if (hasField) {
                const raw = cellValue;
                const isNonEmpty =
                  raw !== undefined &&
                  raw !== null &&
                  String(raw).trim() !== "";

                // Use valueSetter if available (for nested fields or special handling)
                if (colDef.valueSetter) {
                  const params = buildAgParams(targetRowIndex, colDef);
                  params.newValue = raw;
                  const setResult = colDef.valueSetter(params);
                  if (setResult) {
                    // Value was set successfully via valueSetter
                    changedData[targetField] = raw;
                  }
                } else if (isNonEmpty) {
                  const { isSelect, allowed, stored } = resolveSelectValue(
                    raw,
                    colDef,
                    targetRowIndex,
                  );
                  if (isSelect) {
                    if (allowed) {
                      // For nested fields, set the value properly
                      if (targetField.includes(".")) {
                        const parts = targetField.split(".");
                        let obj = targetRow;
                        for (let i = 0; i < parts.length - 1; i++) {
                          if (!obj[parts[i]]) {
                            obj[parts[i]] = {};
                          }
                          obj = obj[parts[i]];
                        }
                        obj[parts[parts.length - 1]] = stored;
                      } else {
                        targetRow[targetField] = stored;
                      }
                      changedData[targetField] = stored;
                    } else {
                      if (targetField.includes(".")) {
                        const parts = targetField.split(".");
                        let obj = targetRow;
                        for (let i = 0; i < parts.length - 1; i++) {
                          if (!obj[parts[i]]) {
                            obj[parts[i]] = {};
                          }
                          obj = obj[parts[i]];
                        }
                        obj[parts[parts.length - 1]] = "";
                      } else {
                        targetRow[targetField] = "";
                      }
                      changedData[targetField] = "";
                    }
                  } else {
                    const normalized = normalizeNumberString(raw);
                    // Special handling for orderNo field - convert to number
                    if (targetField === "orderNo") {
                      const numValue = parseFloat(normalized);
                      if (!isNaN(numValue)) {
                        targetRow[targetField] = numValue;
                        changedData[targetField] = numValue;
                      } else {
                        // If not a valid number, set to 0
                        targetRow[targetField] = 0;
                        changedData[targetField] = 0;
                      }
                    } else {
                      // Check if the original field value is boolean — convert pasted string to boolean
                      const originalFieldValue = targetRow[targetField];
                      const isOriginallyBoolean =
                        typeof originalFieldValue === "boolean";
                      // Only perform boolean conversion if it's explicitly a boolean column OR it was originally boolean
                      if (isBooleanColumn(colDef) || isOriginallyBoolean) {
                        const lc = String(raw).toLowerCase().trim();
                        const boolValue = lc === "true" || lc === "1";
                        targetRow[targetField] = boolValue;
                        changedData[targetField] = boolValue;
                      } else {
                        // For nested fields, set the value properly
                        if (targetField.includes(".")) {
                          const parts = targetField.split(".");
                          let obj = targetRow;
                          for (let i = 0; i < parts.length - 1; i++) {
                            if (!obj[parts[i]]) {
                              obj[parts[i]] = {};
                            }
                            obj = obj[parts[i]];
                          }
                          obj[parts[parts.length - 1]] = normalized;
                        } else {
                          targetRow[targetField] = normalized;
                        }
                        changedData[targetField] = normalized;
                      }
                    }
                  }
                } else {
                  // Nếu người dùng paste rỗng, coi như xóa giá trị
                  if (targetField === "orderNo") {
                    targetRow[targetField] = 0;
                    changedData[targetField] = 0;
                  } else {
                    // For nested fields, set empty value properly
                    if (targetField.includes(".")) {
                      const parts = targetField.split(".");
                      let obj = targetRow;
                      for (let i = 0; i < parts.length - 1; i++) {
                        if (!obj[parts[i]]) {
                          obj[parts[i]] = {};
                        }
                        obj = obj[parts[i]];
                      }
                      obj[parts[parts.length - 1]] = "";
                    } else {
                      targetRow[targetField] = "";
                    }
                    changedData[targetField] = "";
                  }
                }
              }
            }
          });

          // Push changes if there are any and the row has an identifier (id or unitKey)
          if (Object.keys(changedData).length > 0 && rowId) {
            changes.push({ id: rowId, data: changedData });
          }
        }
      });

      setRowData(updatedRowData);

      if (changes.length > 0) {
        onValuesChanged(changes);

        // Auto-update localSztp options when oprCd is pasted
        const itemsWithOprCdChanges = changes.filter(
          (change) =>
            change.data.oprCD !== undefined || change.data.oprCd !== undefined,
        );

        console.log("🔍 Paste detected:", {
          allChanges: changes,
          oprCdChanges: itemsWithOprCdChanges,
          localSztpData: localSztpOptionsRef.current.slice(0, 3), // Show first 3 items
        });

        if (itemsWithOprCdChanges.length > 0) {
          const currentData = getRowData();
          const newData = currentData.map((row) => {
            const change = itemsWithOprCdChanges.find(
              (c) => c.id === getItemId(row),
            );
            if (change) {
              const oprCd = change.data.oprCD || change.data.oprCd;
              if (oprCd) {
                const filteredOptions = localSztpOptionsRef.current
                  .filter((item) => item.oprCD === oprCd)
                  .map((item) => item.localSztp);

                console.log("✅ Setting _localSztpOptions for row:", {
                  rowId: getItemId(row),
                  oprCd,
                  optionsCount: filteredOptions.length,
                  options: filteredOptions.slice(0, 5), // Show first 5
                });

                return { ...row, _localSztpOptions: filteredOptions };
              }
            }
            return row;
          });
          setRowData(newData);

          // Refresh cells để update dropdown options
          setTimeout(() => {
            if (gridRef.current?.api) {
              console.log("🔄 Refreshing cells");
              gridRef.current.api.refreshCells({
                columns: ["localSztp"],
                force: true,
              });
            }
          }, 0);
        }

        // Auto-fetch isoSztp for items with localSztp (always enabled)
        if (true) {
          (async () => {
            try {
              const isoSztpChanges: {
                id: string;
                data: Record<string, any>;
              }[] = [];

              // Get IDs of items that had localSztp or oprCD changes
              const itemsWithRelevantChanges = changes.filter(
                (change) =>
                  change.data.localSztp !== undefined ||
                  change.data.oprCD !== undefined,
              );
              const relevantChangedIds = new Set(
                itemsWithRelevantChanges.map((c) => c.id),
              );

              // Handle items where oprCD was changed to empty/null - clear localSztp and isoSztp
              const itemsWithOprCDCleared = updatedRowData.filter((item) => {
                const itemId = getItemId(item);
                // Check if this item had oprCD changed
                const oprCDChange = changes.find(
                  (c) => c.id === itemId && c.data.oprCD !== undefined,
                );
                if (!oprCDChange) return false;

                // Check if oprCD is now empty
                const hasNoOprCD =
                  !item.oprCD || String(item.oprCD).trim() === "";
                const hasLocalOrIso =
                  (item.localSztp && String(item.localSztp).trim() !== "") ||
                  (item.isoSztp && String(item.isoSztp).trim() !== "");

                return hasNoOprCD && hasLocalOrIso;
              });

              // Also handle items without oprCD that had localSztp/isoSztp changes
              const itemsWithoutOprCD = updatedRowData.filter((item) => {
                const itemId = getItemId(item);
                // Skip if already in itemsWithOprCDCleared
                if (itemsWithOprCDCleared.find((i) => getItemId(i) === itemId))
                  return false;

                const hasNoOprCD =
                  !item.oprCD || String(item.oprCD).trim() === "";
                const hasLocalOrIso =
                  (item.localSztp && String(item.localSztp).trim() !== "") ||
                  (item.isoSztp && String(item.isoSztp).trim() !== "");

                // Only for items with relevant changes
                return (
                  relevantChangedIds.has(itemId) && hasNoOprCD && hasLocalOrIso
                );
              });

              const allItemsToClear = [
                ...itemsWithOprCDCleared,
                ...itemsWithoutOprCD,
              ];

              if (allItemsToClear.length > 0) {
                const currentData = getRowData();
                const newData = currentData.map((row) => {
                  const match = allItemsToClear.find(
                    (item) => getItemId(item) === getItemId(row),
                  );
                  if (match) {
                    const itemId = getItemId(row);
                    isoSztpChanges.push({
                      id: itemId,
                      data: { localSztp: null, isoSztp: null },
                    });
                    return { ...row, localSztp: null, isoSztp: null };
                  }
                  return row;
                });
                setRowData(newData);
              }

              // Find items with localSztp and oprCD to fetch isoSztp (only for items with relevant changes)
              const itemsToFetch = updatedRowData.filter((item) => {
                const hasOprCD = item.oprCD && String(item.oprCD).trim() !== "";
                const hasLocalSztp =
                  item.localSztp && String(item.localSztp).trim() !== "";
                return (
                  relevantChangedIds.has(getItemId(item)) &&
                  hasLocalSztp &&
                  hasOprCD
                );
              });

              if (itemsToFetch.length > 0) {
                const results = await Promise.all(
                  itemsToFetch.map(async (item) => {
                    try {
                      // Hardcoded fetch isoSztp from API
                      const searchFilter = [
                        {
                          key: "oprCD",
                          type: FilterOperationType.IContains,
                          value: item.oprCD,
                        },
                        {
                          key: "localSztp",
                          type: FilterOperationType.IContains,
                          value: item.localSztp,
                        },
                      ];
                      // const res = await getCntrSztpMap(searchFilter);
                      const res = { data: { data: [{ isoSztp: "" }] } };
                      const isoSztp =
                        res.data.data.length > 0
                          ? res.data.data[0]?.isoSztp || null
                          : null;
                      return { itemId: getItemId(item), isoSztp };
                    } catch (error) {
                      console.error(
                        `Error fetching isoSztp for item ${getItemId(item)}:`,
                        error,
                      );
                      return { itemId: getItemId(item), isoSztp: null };
                    }
                  }),
                );

                // Update rowData with fetched isoSztp
                const currentData = getRowData();
                const newData = currentData.map((row) => {
                  const result = results.find(
                    (r) => r.itemId === getItemId(row),
                  );
                  if (result) {
                    isoSztpChanges.push({
                      id: result.itemId,
                      data: { isoSztp: result.isoSztp },
                    });
                    return { ...row, isoSztp: result.isoSztp };
                  }
                  return row;
                });
                setRowData(newData);
              }

              // Notify about isoSztp changes via onFillChanges
              if (isoSztpChanges.length > 0 && onFillChanges) {
                onFillChanges(isoSztpChanges);
              }
            } catch (error) {
              console.error("Error in auto-fetch isoSztp:", error);
            }
          })();
        }

        // Trigger cell value changed events immediately to register changes
        // This fixes the issue where pasting doesn't register until focus out
        setTimeout(() => {
          if (gridRef.current?.api) {
            changes.forEach(({ id, data }) => {
              const rowIndex = updatedRowData.findIndex(
                (row) => getItemId(row) === id,
              );
              if (rowIndex !== -1) {
                const node =
                  gridRef.current.api.getDisplayedRowAtIndex(rowIndex);
                if (node) {
                  Object.keys(data).forEach((field) => {
                    // Trigger cell value changed event
                    const column = gridRef.current.api.getColumn(field);
                    if (column) {
                      gridRef.current.api.refreshCells({
                        rowNodes: [node],
                        columns: [field],
                        force: true,
                      });
                    }
                  });
                }
              }
            });
          }
        }, 0);
      }
    });
  }, [
    getRowData,
    setRowData,
    gridRef,
    onValuesChanged,
    disablePaste,
    onFillChanges,
  ]);

  // Hàm xử lý fill operation (được gọi từ AgGridComponent)
  const handleFillChanges = useCallback(
    (changes: { id: string; data: Record<string, any> }[]) => {
      const updatedRowData = [...getRowData()];

      // Step 1: Apply fill changes
      changes.forEach(({ id, data }) => {
        const rowIndex = updatedRowData.findIndex(
          (row) => getItemId(row) === id,
        );
        if (rowIndex !== -1) {
          Object.keys(data).forEach((field) => {
            updatedRowData[rowIndex][field] = data[field];
          });
        }
      });

      // Step 2: Auto-update _localSztpOptions for oprCd changes (merge into same data update)
      const oprCdChanges = changes.filter(
        (change) =>
          change.data.oprCD !== undefined || change.data.oprCd !== undefined,
      );

      if (oprCdChanges.length > 0 && localSztpOptionsRef.current.length > 0) {
        // Map trên updatedRowData (đã có fill values) thay vì getRowData()
        oprCdChanges.forEach((change) => {
          const rowIndex = updatedRowData.findIndex(
            (row) => getItemId(row) === change.id,
          );
          if (rowIndex !== -1) {
            const oprCd = change.data.oprCD ?? change.data.oprCd;
            const filteredOptions = localSztpOptionsRef.current
              .filter((item) => item.oprCD === oprCd)
              .map((item) => item.localSztp);

            // Update trực tiếp trên updatedRowData
            updatedRowData[rowIndex] = {
              ...updatedRowData[rowIndex],
              _localSztpOptions: filteredOptions,
            };
          }
        });
      }

      // Step 3: Chỉ setRowData 1 lần duy nhất với tất cả thay đổi
      setRowData(updatedRowData);

      // Step 4: Refresh cells nếu có oprCd changes
      if (oprCdChanges.length > 0) {
        setTimeout(() => {
          if (gridRef.current?.api) {
            gridRef.current.api.refreshCells({
              columns: ["localSztp"],
              force: true,
            });
          }
        }, 0);
      }

      // Gọi cả onValuesChanged và onFillChanges nếu có
      onValuesChanged(changes);
      if (onFillChanges) {
        onFillChanges(changes);
      }
    },
    [getRowData, setRowData, onValuesChanged, onFillChanges, gridRef],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "v") {
        // Check if focus is on an input, textarea, or contenteditable element
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.getAttribute("contenteditable") === "true");

        if (!isInputFocused && gridRef.current?.api.getFocusedCell()) {
          event.preventDefault();
          handlePasteData();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePasteData, handleFillChanges, gridRef]);

  /**
   * Trả về danh sách localSztp options tương ứng với một oprCD.
   * Dùng trong handleFillMouseUp của cTableAG để update _localSztpOptions ngay khi drag-copy oprCD.
   */
  const getLocalSztpForOprCd = useCallback((oprCd: string): string[] => {
    if (!oprCd || localSztpOptionsRef.current.length === 0) return [];
    return localSztpOptionsRef.current
      .filter((item) => item.oprCD === oprCd)
      .map((item) => item.localSztp);
  }, []);

  // Return handleFillChanges và getLocalSztpForOprCd
  return { handleFillChanges, getLocalSztpForOprCd };
};

export default usePasteHandler;
