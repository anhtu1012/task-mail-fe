/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { excelUtils } from "@/utils/client/importExport/excelUtils";
import usePasteHandler from "@/utils/client/usePasteHandler";
import { getItemId } from "@/utils/client/validationHelpers";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import {
  CellClassParams,
  CellStyle,
  ColDef,
  ModuleRegistry,
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
// import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
// import { MenuModule } from "@ag-grid-enterprise/menu";
import { Pagination } from "antd";
import Dropdown from "antd/es/dropdown/dropdown";
import { Tooltip } from "antd/lib";
import { FileSpreadsheet, Upload } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridComponentProps } from "./agProps";
import FilterArrayModal from "./FilterArrayModal";
import "./index.scss";
import { processColumnDefs } from "./featureExtend";
import InputSearch from "../InputSearch";
import ActionButtons from "../action-button";
import ErrorCellRenderer from "./ErrorCellRenderer";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  // ColumnsToolPanelModule,
  // MenuModule,
]);

// Import ActionButtonsProps type for prop spreading

const CustomTooltip = (props: any) => {
  if (!props.value) return null;

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "#ffeeee",
        color: "#d32f2f",
        border: "1px solid #d32f2f",
        maxWidth: "400px",
        whiteSpace: "pre-line", // This preserves line breaks
        fontWeight: "bold",
        fontSize: "14px",
        lineHeight: "2.0", // Increased line height for better spacing
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {props.value}
    </div>
  );
};

const AgGridComponent: React.FC<AgGridComponentProps> = ({
  rowData,
  columnDefs,
  onCellValueChanged,
  onCellEditingStarted,
  onCellClicked,
  onRowDoubleClicked,
  onSelectionChanged,
  onRowSelected,
  gridRef,
  getRowStyle,
  maxRowsVisible = 11,
  minHeightEmpty,
  columnFlex = 0,
  rowSelection = "multiple",
  gridOptions = {},
  pinnedBottomRowData = [],
  headerHeight,
  // sideBar = {},
  loading = false,
  enableFilter = true,
  showSTT = true,
  showCheckboxSelection = true,
  pivotMode = false,
  onGridReady,
  onColumnHeaderClicked,
  domLayout = "normal" as "normal" | "autoHeight" | "print",
  onRowClicked = () => {},
  getRowClass = () => "",
  // Search props
  showSearch = false,
  inputSearchProps = {},
  // Action button props
  showActionButtons = false,
  actionButtonsProps = {},
  // Excel export props
  showExportExcel = true,
  exportFileName = "Dữ-liệu-bảng",
  exportDecorated = true,
  importComponent,
  pagination = false, // Thêm default value cho pagination
  paginationPageSize = 10,
  paginationCurrentPage = 1,
  onChangePage,
  onQuicksearch,
  total,
  disablePaste = false,
  // Infinite scroll props
  enableInfiniteScroll = false,
  onLoadMore,
  hasMore = false,
  infiniteScrollThreshold = 100,
  // Drag-to-copy control
  disableDragCopy = false,
  editType = "fullRow",
  rowMultiSelectWithClick = false,
  suppressClientFilter = false,
  theme = "light",
}) => {
  const t = (key: string) => key;
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDraggingCells, setIsDraggingCells] = useState(false); // Thêm state để track cell dragging
  const isMouseDownRef = useRef(false); // Track trạng thái giữ chuột để tránh auto-reset khi đang kéo chọn
  const [startCell, setStartCell] = useState<{
    rowIndex: number;
    colField: string;
  } | null>(null);
  const clickStartTimeRef = useRef<number>(0); // Track click time
  const infiniteScrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackMapRef = useRef(new WeakMap<object, string>());
  // Refs để cellStyle đọc selectedCells/fillTargetCells mà KHÔNG làm
  // defaultColDef phụ thuộc vào state — tránh AG Grid stop editing mỗi khi selection thay đổi
  const selectedCellsRef = useRef<Set<string>>(new Set());
  const fillTargetCellsRef = useRef<Set<string>>(new Set());
  // Add state for filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilterColumns, setSelectedFilterColumns] = useState<string[]>(
    columnDefs.map((col) => col.field || ""),
  );
  const [filterValues, setFilterValues] = useState<string>("");
  const [originalRowData, setOriginalRowData] = useState<any[]>([]);

  // Refs to always have access to latest props in async callbacks (like handleSave)
  const onSaveRef = useRef(actionButtonsProps?.onSave);
  const onCellValueChangedRef = useRef(onCellValueChanged);
  const onCellEditingStartedRef = useRef(onCellEditingStarted);

  useEffect(() => {
    onSaveRef.current = actionButtonsProps?.onSave;
  }, [actionButtonsProps?.onSave]);

  useEffect(() => {
    onCellValueChangedRef.current = onCellValueChanged;
  }, [onCellValueChanged]);

  useEffect(() => {
    onCellEditingStartedRef.current = onCellEditingStarted;
  }, [onCellEditingStarted]);

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(paginationCurrentPage);
  const [pageSize, setPageSize] = useState(paginationPageSize);

  // Infinite scroll states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isQuicksearching, setIsQuicksearching] = useState(false);
  const [maxReachedPage, setMaxReachedPage] = useState(paginationCurrentPage); // Track highest page reached

  // Adjust internal state when props change (React recommend doing this during render to avoid cascading renders)
  const [prevPaginationCurrentPage, setPrevPaginationCurrentPage] = useState(
    paginationCurrentPage,
  );
  const [prevPaginationPageSize, setPrevPaginationPageSize] =
    useState(paginationPageSize);
  const [prevRowDataProp, setPrevRowDataProp] = useState(rowData);

  if (rowData !== prevRowDataProp) {
    // Reset infinite scroll when data changes (moved from useEffect to avoid cascading renders)
    if (enableInfiniteScroll) {
      const currentLength = rowData.length;
      const prevLength = prevRowDataProp.length;

      // Only reset if data is replaced (length decreased or reset to initial load)
      if (
        currentLength < prevLength ||
        (currentLength > 0 && prevLength === 0)
      ) {
        if (maxReachedPage !== 1) setMaxReachedPage(1);
        if (isLoadingMore) setIsLoadingMore(false);
      }
    }

    setPrevRowDataProp(rowData);
    if (!isFiltered || originalRowData.length === 0) {
      setOriginalRowData([...rowData]);
    }
  }

  if (paginationCurrentPage !== prevPaginationCurrentPage) {
    setPrevPaginationCurrentPage(paginationCurrentPage);
    setCurrentPage(paginationCurrentPage);

    // Sync maxReachedPage when page changes
    if (paginationCurrentPage === 1) {
      setMaxReachedPage(1);
    } else {
      setMaxReachedPage(Math.max(maxReachedPage, paginationCurrentPage));
    }
  }

  if (paginationPageSize !== prevPaginationPageSize) {
    setPrevPaginationPageSize(paginationPageSize);
    setPageSize(paginationPageSize);
  }

  // Sync isQuicksearching with loading prop (to avoid cascading renders)
  const [prevLoadingState, setPrevLoadingState] = useState(loading);
  if (loading !== prevLoadingState) {
    setPrevLoadingState(loading);
    if (!loading && isQuicksearching) {
      setIsQuicksearching(false);
    }
  }

  // Adjust page when search parameters change (to avoid cascading renders in useEffect)
  const [prevSearchTextState, setPrevSearchTextState] = useState(searchText);
  const [prevSelectedFilterColumns, setPrevSelectedFilterColumns] = useState(
    selectedFilterColumns,
  );
  const [prevFilterValues, setPrevFilterValues] = useState(filterValues);

  if (
    searchText !== prevSearchTextState ||
    selectedFilterColumns !== prevSelectedFilterColumns ||
    filterValues !== prevFilterValues
  ) {
    setPrevSearchTextState(searchText);
    setPrevSelectedFilterColumns(selectedFilterColumns);
    setPrevFilterValues(filterValues);

    // Reset to page 1 during render phase
    if (pagination && currentPage !== 1) {
      setCurrentPage(1);
    }

    // Set quicksearching status during render phase
    if (onQuicksearch && !isQuicksearching) {
      setIsQuicksearching(true);
    }
  }

  // Fill handle states
  const [fillHandleVisible, setFillHandleVisible] = useState(false);
  const [fillHandlePosition, setFillHandlePosition] = useState<{
    top: number | undefined;
    left: number | undefined;
  }>({
    top: undefined,
    left: undefined,
  });

  const lastCalculateTime = useRef(0);

  const [fillSourceCell, setFillSourceCell] = useState<{
    rowIndex: number;
    colField: string;
    value: any;
    isEditable: boolean;
  } | null>(null);
  const [fillSourceCellInfo, setFillSourceCellInfo] = useState<{
    rowIndex: number;
    colField: string;
    cellElement: HTMLElement | null;
    isEditable: boolean;
  } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillTargetCells, setFillTargetCells] = useState<Set<string>>(
    new Set(),
  );
  // Multi-selection fill support
  const [multiSelectionBounds, setMultiSelectionBounds] = useState<{
    startRow: number;
    endRow: number;
    startColIndex: number;
    endColIndex: number;
  } | null>(null);
  const [multiSelectionPattern, setMultiSelectionPattern] = useState<
    any[][] | null
  >(null);

  // Auto-scroll states for fill handle
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Refs để track state real-time trong intervals
  const isDraggingFillRef = useRef(false);
  const isSelectingRef = useRef(false);

  // Initialize usePasteHandler để xử lý paste và fill operations
  const { handleFillChanges: pasteHandlerFillChanges, getLocalSztpForOprCd } =
    usePasteHandler(
      () => (isFiltered ? filteredData : rowData),
      (newData) => {
        if (isFiltered) {
          setFilteredData(newData);
        }
        // Note: Không cần setRowData vì rowData là prop từ parent
      },
      gridRef,
      (changes) => {
        // Trigger onCellValueChanged for each changed cell to register changes immediately
        // This fixes the issue where pasting doesn't register until focus out
        if (onCellValueChanged && gridRef.current?.api) {
          const api = gridRef.current.api;
          changes.forEach(({ id, data }) => {
            const currentData = isFiltered ? filteredData : rowData;
            // Find row by ID using getItemId helper
            const rowIndex = currentData.findIndex(
              (row: any) => getItemId(row) === id,
            );
            if (rowIndex !== -1) {
              const node = api.getDisplayedRowAtIndex(rowIndex);
              if (node) {
                Object.keys(data).forEach((field) => {
                  const column = api.getColumn(field);
                  if (column && node.data) {
                    // Create a synthetic CellValueChangedEvent
                    const syntheticEvent = {
                      type: "cellValueChanged",
                      api: api,
                      columnApi:
                        (gridRef.current as any)?.columnApi || undefined,
                      context: undefined,
                      data: node.data,
                      node: node,
                      colDef: column.getColDef(),
                      column: column,
                      oldValue: node.data[field],
                      newValue: data[field],
                      source: "paste",
                    } as any;
                    onCellValueChanged(syntheticEvent);
                  }
                });
              }
            }
          });
        }
      },
      undefined, // onFillChanges - not needed, usePasteHandler handles everything
      disablePaste, // Truyền prop disablePaste
    );

  // Khi rowData thay đổi (load mới / load more), tự động enrich _localSztpOptions
  // vào node.data của từng row có oprCD để cellEditorParams hiển thị đúng options.
  // Dùng forEachNode (cover cả virtual rows) và mutate trực tiếp node.data.
  useEffect(() => {
    const applyEnrich = () => {
      if (!gridRef.current?.api) return;
      const api = gridRef.current.api;
      api.forEachNode((node: any) => {
        if (!node.data) return;
        const oprCd = node.data.oprCD ?? node.data.oprCd;
        if (!oprCd) return;
        const options = getLocalSztpForOprCd(oprCd);
        if (!options.length) return;
        const current: string[] = node.data._localSztpOptions ?? [];
        const isSame =
          current.length === options.length &&
          current.every((v, j) => v === options[j]);
        if (isSame) return;

        if (!Object.isExtensible(node.data)) {
          node.setData({ ...node.data, _localSztpOptions: options });
        } else {
          // Mutate trực tiếp — AG Grid đọc node.data khi editor mở
          node.data._localSztpOptions = options;
        }
      });
    };

    // Chạy ở task tiếp theo để tránh flushSync warning khi React đang render
    setTimeout(applyEnrich, 0);
    // Retry 300ms sau để xử lý race condition (localSztpOptionsRef fetch chậm hơn rowData)
    const timer = setTimeout(applyEnrich, 300);
    return () => clearTimeout(timer);
  }, [rowData, filteredData, isFiltered, getLocalSztpForOprCd]);

  const getColumnOrder = useCallback(() => {
    return columnDefs
      .map((col) => col.field)
      .filter((field): field is string => !!field);
  }, [columnDefs]);

  // Helper function to check if a column is editable
  const isColumnEditable = useCallback(
    (colField: string | undefined): boolean => {
      if (!colField) return false;
      // Check in grid API first (this will have merged defaults)
      if (gridRef.current?.api) {
        const column = gridRef.current.api.getColumn(colField);
        if (column) {
          const colDef = column.getColDef();
          // Return true if editable is not explicitly false
          // (defaultColDef has editable: true, so undefined means true)
          return colDef.editable !== false;
        }
      }
      // Fallback: check in columnDefs
      const colDef = columnDefs.find((col) => col.field === colField);
      if (colDef && colDef.editable !== undefined) {
        return colDef.editable === true;
      }
      // Default to true if not specified (matching defaultColDef)
      return true;
    },
    [columnDefs],
  );

  // Helper function to get the typeColumn of a field
  const getColumnTypeColumn = useCallback(
    (colField: string | undefined): string | undefined => {
      if (!colField) return undefined;
      if (gridRef.current?.api) {
        const column = gridRef.current.api.getColumn(colField);
        if (column) {
          const colDef = column.getColDef();
          return (
            (colDef.context?.typeColumn as string) || (colDef as any).typeColumn
          );
        }
      }
      const colDef = columnDefs.find((col) => col.field === colField);
      return (colDef as any)?.typeColumn;
    },
    [columnDefs],
  );

  // Helper to check if two columns have compatible types for dragging/filling
  const isTypeCompatible = useCallback(
    (
      sourceField: string | undefined,
      targetField: string | undefined,
    ): boolean => {
      if (!sourceField || !targetField) return false;
      if (sourceField === targetField) return true;

      const sourceType = getColumnTypeColumn(sourceField);
      const targetType = getColumnTypeColumn(targetField);

      // If either is a Checkbox, they MUST both be Checkboxes
      if (sourceType === "Checkbox" || targetType === "Checkbox") {
        return sourceType === targetType;
      }

      // If either is a Select, and they are different, consider them incompatible for safety
      if (sourceType === "Select" || targetType === "Select") {
        return sourceType === targetType;
      }

      // Default compatibility for other types
      return true;
    },
    [getColumnTypeColumn],
  );

  /**
   * Force reset all drag/selection states immediately.
   * Used when mouse leaves grid or window loses focus to prevent stuck states.
   */
  const forceResetAllStates = useCallback(() => {
    // Reset all refs immediately
    isMouseDownRef.current = false;
    isSelectingRef.current = false;
    isDraggingFillRef.current = false;

    // Reset all states
    setIsSelecting(false);
    setIsDraggingFill(false);
    setIsDraggingCells(false);
    setFillHandleVisible(false);
    setFillSourceCell(null);
    setFillSourceCellInfo(null);
    setFillTargetCells(new Set());
    setStartCell(null);
    setMultiSelectionPattern(null);
    setMultiSelectionBounds(null);

    // Stop auto-scroll
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Clear attributes
    if (gridWrapperRef.current) {
      gridWrapperRef.current.removeAttribute("data-selecting");
      gridWrapperRef.current.removeAttribute("data-dragging");
    }
  }, []);

  /**
   * Always query a FRESH cell element from the DOM by row-index + col-id.
   * Avoids stale-reference bugs where a stored cellElement becomes detached
   * after AG Grid re-renders the cell (e.g. fullRow edit mode on Checkbox toggle).
   */
  const getFreshCellElement = useCallback(
    (rowIndex: number, colField: string): HTMLElement | null => {
      if (!gridWrapperRef.current) return null;
      const rowEl = gridWrapperRef.current.querySelector(
        `[row-index="${rowIndex}"]`,
      );
      if (!rowEl) return null;
      // Try col-id first (AG Grid may use the column id, not the field name)
      const colId =
        gridRef.current?.api?.getColumn(colField)?.getId() ?? colField;
      return (
        (rowEl.querySelector(`[col-id="${colId}"]`) as HTMLElement) ??
        (rowEl.querySelector(`[col-id="${colField}"]`) as HTMLElement) ??
        null
      );
    },
    [],
  );

  useEffect(() => {
    // Preserve scroll position before data update
    let scrollPosition = null;
    if (gridRef.current?.api) {
      const viewport = gridRef.current.api.getVerticalPixelRange();
      if (viewport) {
        scrollPosition = viewport.top;
      }
    }

    // Restore scroll position after data update
    if (scrollPosition !== null && gridRef.current?.api) {
      setTimeout(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.ensureIndexVisible(
            Math.floor(scrollPosition / 40),
            "top",
          );
        }
      }, 50);
    }
  }, [rowData, isFiltered, originalRowData.length]);

  // Update fill handle position when scrolling
  useEffect(() => {
    if (!fillHandleVisible || !fillSourceCellInfo || !gridWrapperRef.current)
      return;

    const updateFillHandlePosition = () => {
      // Không cập nhật vị trí khi đang drag fill handle
      if (isDraggingFill || isDraggingFillRef.current) return;

      // Always re-query the cell element to avoid stale references after cell re-renders
      const cellElement = fillSourceCellInfo
        ? (getFreshCellElement(
            fillSourceCellInfo.rowIndex,
            fillSourceCellInfo.colField,
          ) ?? fillSourceCellInfo.cellElement)
        : null;
      if (!cellElement || !gridWrapperRef.current) return;

      const rect = cellElement.getBoundingClientRect();
      const gridRect = gridWrapperRef.current.getBoundingClientRect();

      // If the element is detached, getBoundingClientRect returns all zeros — skip
      if (rect.width === 0 && rect.height === 0) return;

      const newPosition = {
        top: rect.bottom - gridRect.top - 5,
        left: rect.right - gridRect.left - 5,
      };

      setFillHandlePosition(newPosition);
    };

    // Lắng nghe scroll event trên cả grid container, viewport và window
    const gridViewport =
      gridWrapperRef.current.querySelector(".ag-body-viewport");
    const gridContainer = gridWrapperRef.current;

    if (gridViewport) {
      gridViewport.addEventListener("scroll", updateFillHandlePosition);
    }
    if (gridContainer) {
      gridContainer.addEventListener("scroll", updateFillHandlePosition);
    }
    // Thêm window scroll event để đảm bảo bắt được mọi scroll
    window.addEventListener("scroll", updateFillHandlePosition);

    // Thêm listener cho tất cả các element có thể scroll
    const allScrollableElements = gridContainer?.querySelectorAll(
      '[style*="overflow"], [class*="scroll"]',
    );
    allScrollableElements?.forEach((element) => {
      element.addEventListener("scroll", updateFillHandlePosition);
    });

    // Thêm listener cho các AG Grid specific containers
    const gridBody = gridContainer?.querySelector(".ag-body");
    const gridCenter = gridContainer?.querySelector(
      ".ag-center-cols-container",
    );
    const centerViewport = gridContainer?.querySelector(
      ".ag-center-cols-viewport",
    );
    const gridHeader = gridContainer?.querySelector(".ag-header-viewport");

    if (gridBody) {
      gridBody.addEventListener("scroll", updateFillHandlePosition);
    }
    if (gridCenter) {
      gridCenter.addEventListener("scroll", updateFillHandlePosition);
    }
    if (centerViewport) {
      centerViewport.addEventListener("scroll", updateFillHandlePosition);
    }
    if (gridHeader) {
      gridHeader.addEventListener("scroll", updateFillHandlePosition);
    }

    // Thêm wheel event để bắt scroll ngang
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        updateFillHandlePosition();
      }
    };

    if (gridContainer) {
      gridContainer.addEventListener("wheel", handleWheel, { passive: true });
    }

    // Thêm ResizeObserver để theo dõi thay đổi kích thước
    const resizeObserver = new ResizeObserver(() => {
      updateFillHandlePosition();
    });

    if (gridContainer) {
      resizeObserver.observe(gridContainer);
    }

    // Thêm MutationObserver để theo dõi thay đổi DOM
    const mutationObserver = new MutationObserver(() => {
      updateFillHandlePosition();
    });

    if (gridContainer) {
      mutationObserver.observe(gridContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    // Thêm continuous update loop cho scroll ngang (chỉ khi fill handle visible)
    let animationId: number;
    let lastScrollLeft = 0;
    let lastScrollTop = 0;

    const continuousUpdate = () => {
      if (fillHandleVisible && fillSourceCellInfo) {
        // Kiểm tra scroll position changes trên nhiều container
        const gridViewport =
          gridWrapperRef.current?.querySelector(".ag-body-viewport");
        const centerViewport = gridWrapperRef.current?.querySelector(
          ".ag-center-cols-viewport",
        );
        const gridBody = gridWrapperRef.current?.querySelector(".ag-body");

        const currentScrollLeft =
          centerViewport?.scrollLeft ||
          gridViewport?.scrollLeft ||
          gridBody?.scrollLeft ||
          0;
        const currentScrollTop =
          gridViewport?.scrollTop || gridBody?.scrollTop || 0;

        if (
          currentScrollLeft !== lastScrollLeft ||
          currentScrollTop !== lastScrollTop
        ) {
          updateFillHandlePosition();
          lastScrollLeft = currentScrollLeft;
          lastScrollTop = currentScrollTop;
        }
      }
      animationId = requestAnimationFrame(continuousUpdate);
    };
    animationId = requestAnimationFrame(continuousUpdate);

    return () => {
      if (gridViewport) {
        gridViewport.removeEventListener("scroll", updateFillHandlePosition);
      }
      if (gridContainer) {
        gridContainer.removeEventListener("scroll", updateFillHandlePosition);
        gridContainer.removeEventListener("wheel", handleWheel);

        // Remove listeners từ tất cả scrollable elements
        const allScrollableElements = gridContainer.querySelectorAll(
          '[style*="overflow"], [class*="scroll"]',
        );
        allScrollableElements.forEach((element) => {
          element.removeEventListener("scroll", updateFillHandlePosition);
        });

        // Remove listeners từ AG Grid specific containers
        const gridBody = gridContainer.querySelector(".ag-body");
        const gridCenter = gridContainer.querySelector(
          ".ag-center-cols-container",
        );
        const centerViewport = gridContainer.querySelector(
          ".ag-center-cols-viewport",
        );
        const gridHeader = gridContainer.querySelector(".ag-header-viewport");

        if (gridBody) {
          gridBody.removeEventListener("scroll", updateFillHandlePosition);
        }
        if (gridCenter) {
          gridCenter.removeEventListener("scroll", updateFillHandlePosition);
        }
        if (centerViewport) {
          centerViewport.removeEventListener(
            "scroll",
            updateFillHandlePosition,
          );
        }
        if (gridHeader) {
          gridHeader.removeEventListener("scroll", updateFillHandlePosition);
        }
      }
      window.removeEventListener("scroll", updateFillHandlePosition);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [fillHandleVisible, fillSourceCellInfo, isDraggingFill]);

  // Adjust fill handle state when selection or editability changes (Render phase)
  if (fillHandleVisible) {
    const source = fillSourceCellInfo || fillSourceCell;
    if (source) {
      const cellId = `${source.rowIndex}-${source.colField}`;
      if (!source.isEditable || !selectedCells.has(cellId)) {
        setFillHandleVisible(false);
        setFillHandlePosition({ top: undefined, left: undefined });
        setFillSourceCell(null);
        setFillSourceCellInfo(null);
      }
    } else {
      // No source but handle visible? Clean up.
      setFillHandleVisible(false);
      setFillHandlePosition({ top: undefined, left: undefined });
    }
  } else if (selectedCells.size > 0) {
    const source = fillSourceCellInfo || fillSourceCell;
    if (source?.isEditable) {
      setFillHandleVisible(true);
    }
  }

  // Sử dụng useLayoutEffect để cập nhật vị trí trước khi render
  useLayoutEffect(() => {
    if (fillHandleVisible && fillSourceCellInfo && gridWrapperRef.current) {
      // Không cập nhật vị trí khi đang drag fill handle
      if (isDraggingFill || isDraggingFillRef.current) return;

      // Always re-query to avoid stale reference after cell re-renders
      const cellElement: any =
        getFreshCellElement(
          fillSourceCellInfo.rowIndex,
          fillSourceCellInfo.colField,
        ) ?? fillSourceCellInfo.cellElement;
      const rect = cellElement.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return; // detached
      const gridRect = gridWrapperRef.current.getBoundingClientRect();

      const newPosition = {
        top: rect.bottom - gridRect.top - 5,
        left: rect.right - gridRect.left - 5,
      };

      setFillHandlePosition(newPosition);
    }
  }, [
    fillHandleVisible,
    fillSourceCellInfo,
    isDraggingFill,
    getFreshCellElement,
  ]);

  // Quản lý trạng thái loading khi nhận props mới

  // Function to apply filters from the modal (improved)
  const applyFilters = useCallback(
    (selectedColumns: string[], values: string[]) => {
      // If no columns selected or no values provided, reset to original data
      if (selectedColumns.length === 0 || values.length === 0) {
        setFilteredData([]);
        setIsFiltered(false);
        return;
      }

      if (suppressClientFilter) {
        setIsFiltered(true);
        return;
      }

      // Filter the data based on selected columns and values
      const newFilteredData = originalRowData.filter((row) => {
        // For each row, check if any of the selected columns contain any of the filter values
        return selectedColumns.some((column) => {
          if (row[column] === undefined || row[column] === null) return false;

          // Get the cell value - this could be a direct value or something that needs label lookup
          const cellValue = String(row[column]).toLowerCase();
          let cellLabel = cellValue;

          // Check if this is a field with value/label pairs in column definitions
          const colDef = columnDefs.find((col) => col.field === column);
          const selectOptions =
            colDef?.context?.selectOptions ||
            (colDef as any)?.selectOptions ||
            (colDef as any)?.selectOption;

          if (selectOptions && Array.isArray(selectOptions)) {
            // Find matching option to get the label
            const option = selectOptions.find(
              (opt: any) => opt.value === row[column] || opt === row[column],
            );
            if (option && option.label) {
              cellLabel = option.label.toLowerCase();
            }
          }

          // Check if any filter value is included in the cell value or cell label
          return values.some((value) => {
            const trimmedValue = value.trim().toLowerCase();
            return (
              trimmedValue !== "" &&
              (cellValue.includes(trimmedValue) ||
                cellLabel.includes(trimmedValue))
            );
          });
        });
      });

      // Update the filtered data state
      setFilteredData(newFilteredData);
      setIsFiltered(true);

      // If grid reference exists, update the grid data
      if (gridRef.current?.api) {
        // Preserve scroll position before applying transaction
        const viewport = gridRef.current.api.getVerticalPixelRange();
        const scrollTop = viewport ? viewport.top : 0;

        gridRef.current.api.applyTransaction({ update: newFilteredData });

        // Restore scroll position after transaction
        setTimeout(() => {
          if (gridRef.current?.api) {
            gridRef.current.api.ensureIndexVisible(
              Math.floor(scrollTop / 40),
              "top",
            );
            gridRef.current?.api?.refreshCells({
              columns: [""],
              force: true,
            });
          }
        }, 100);
      }
    },
    [originalRowData, suppressClientFilter, columnDefs],
  );

  // Function to handle opening the filter modal
  const handleOpenFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  // Function to handle closing the filter modal
  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  // Function to handle filter application from the modal
  const handleApplyFilter = useCallback(
    (selectedColumns: string[], filterText: string) => {
      setSelectedFilterColumns(selectedColumns);
      setFilterValues(filterText);

      // Convert multi-line text to array of values, filtering out empty lines
      const values = filterText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

      // Apply the filters
      applyFilters(selectedColumns, values);

      // Close the modal
      handleCloseFilterModal();
    },
    [applyFilters, handleCloseFilterModal],
  );

  // Function to reset filters
  const handleResetFilters = useCallback(() => {
    setSelectedFilterColumns([]);
    setFilterValues("");
    setFilteredData([]);
    setIsFiltered(false);

    if (gridRef.current?.api) {
      // Preserve scroll position before resetting
      const viewport = gridRef.current.api.getVerticalPixelRange();
      const scrollTop = viewport ? viewport.top : 0;

      setTimeout(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.ensureIndexVisible(
            Math.floor(scrollTop / 40),
            "top",
          );
          gridRef.current?.api?.refreshCells({
            columns: [""],
            force: true,
          });
        }
      }, 100);
    }
  }, [originalRowData]);

  // Hàm xử lý sự kiện Grid Ready
  // Hàm hiển thị fill handle khi có ô được chọn
  const showFillHandle = useCallback(
    (event: any) => {
      if (disableDragCopy) return;
      // Kiểm tra nếu đang trong trạng thái drag fill thì không xử lý
      if (isDraggingFill || isDraggingFillRef.current) {
        return;
      }

      if (event.rowIndex != null && event.colDef?.field) {
        // Kiểm tra nếu cột không editable thì không hiển thị fill-handle và clear tất cả state
        if (!isColumnEditable(event.colDef.field)) {
          setFillHandleVisible(false);
          setFillHandlePosition({ top: undefined, left: undefined });
          setFillSourceCell(null);
          setFillSourceCellInfo(null);
          return;
        }

        let cellElement: HTMLElement | null =
          event.event?.target?.closest?.(".ag-cell") ?? null;

        // Fallback: find the cell via the DOM using row-index + col-id attributes.
        // Needed when there is no native mouse event attached (e.g. onCellFocused for Checkbox cells).
        if (!cellElement && gridWrapperRef.current && event.column?.getId) {
          const colId = event.column.getId();
          const rowEl = gridWrapperRef.current.querySelector(
            `[row-index="${event.rowIndex}"]`,
          );
          if (rowEl) {
            cellElement =
              (rowEl.querySelector(`[col-id="${colId}"]`) as HTMLElement) ??
              null;
          }
        }

        if (cellElement && gridWrapperRef.current) {
          const rect = cellElement.getBoundingClientRect();
          const gridRect = gridWrapperRef.current.getBoundingClientRect();

          // Cập nhật vị trí và các thông tin
          const newPosition = {
            top: rect.bottom - gridRect.top - 5,
            left: rect.right - gridRect.left - 5,
          };

          setFillHandlePosition(newPosition);
          setFillSourceCell({
            rowIndex: event.rowIndex,
            colField: event.colDef.field,
            value: event.data[event.colDef.field],
            isEditable: isColumnEditable(event.colDef.field),
          });
          setFillSourceCellInfo({
            rowIndex: event.rowIndex,
            colField: event.colDef.field,
            cellElement: cellElement,
            isEditable: isColumnEditable(event.colDef.field),
          });

          // Hiển thị fill handle với delay nhỏ để tránh bị ẩn ngay lập tức
          setTimeout(() => {
            setFillHandleVisible(true);
          }, 10);

          // Đảm bảo ô được thêm vào selectedCells nếu chưa có
          const cellId = `${event.rowIndex}-${event.colDef.field}`;
          if (!selectedCells.has(cellId)) {
            setSelectedCells(
              (prev) => new Set(Array.from(prev).concat(cellId)),
            );
          }
        }
      }
    },
    [isDraggingFill, selectedCells, disableDragCopy, isColumnEditable],
  );

  // Ref để track double-click: lưu cellId và timestamp của click trước
  const lastClickRef = useRef<{ cellId: string; time: number } | null>(null);

  // Hàm xử lý sự kiện chuột được nhấn xuống trên ô
  const handleMouseDown = useCallback(
    (event: any) => {
      if (disableDragCopy) return;
      // Kiểm tra xem sự kiện có chứa thông tin về rowIndex và colField hay không
      if (event.rowIndex != null && event.colDef?.field) {
        // Đánh dấu đang giữ chuột để phục vụ auto-reset logic
        isMouseDownRef.current = true;

        // Track click start time
        clickStartTimeRef.current = Date.now();

        // ── ĐANG EDIT: BỎ QUA SELECTION LOGIC ─────────────────────────────
        // Nếu grid hiện đang có ô trong edit mode (fullRow hoặc cell),
        // KHÔNG chạy selection/fill logic — để user thoải mái click vào
        // input, dropdown, datepicker, checkbox bên trong row đang edit
        // mà không bị cancel editor do state re-render.
        if (gridRef.current?.api) {
          const editingCells = gridRef.current.api.getEditingCells();
          if (editingCells && editingCells.length > 0) {
            // Nếu click vào CÙNG hàng đang edit, ngăn chặn sự kiện lan tới AG Grid
            // để tránh việc AG Grid hiểu lầm double click là thao tác tắt edit mode.
            const currentEditRow = editingCells[0].rowIndex;
            if (currentEditRow === event.rowIndex && event.event) {
              event.event.stopPropagation();
            }

            return;
          }
        }
        // ──────────────────────────────────────────────────────────────────

        // ── DOUBLE-CLICK DETECTION ──────────────────────────────────────────
        // Nếu 2 click liên tiếp < 300ms trên cùng cell → đây là double-click.
        // Bỏ qua toàn bộ selection/fill logic để AG Grid tự mở full-row editor
        // mà không bị reset state làm cancel editor ngay sau khi mở.
        const cellId = `${event.rowIndex}-${event.colDef.field}`;
        const now = Date.now();
        const last = lastClickRef.current;
        const isDoubleClick =
          last !== null && last.cellId === cellId && now - last.time < 300;
        lastClickRef.current = { cellId, time: now };

        if (isDoubleClick) {
          if (gridRef.current?.api) {
            // Delay slightly to avoid conflict with React render cycle
            setTimeout(() => {
              if (gridRef.current?.api) {
                gridRef.current.api.stopEditing();
                gridRef.current.api.startEditingCell({
                  rowIndex: event.rowIndex,
                  colKey: event.colDef.field,
                });
              }
            }, 10);
          }
          return;
        }
        // ───────────────────────────────────────────────────────────────────

        // Nếu đang drag fill, không xử lý mouse down
        if (isDraggingFill || isDraggingFillRef.current) {
          return;
        }

        // Lưu lại thông tin ô bắt đầu được chọn
        setStartCell({
          rowIndex: event.rowIndex,
          colField: event.colDef.field,
        });

        // Đánh dấu ô đầu tiên là đã chọn
        setSelectedCells(new Set([cellId]));

        // Bật trạng thái đang chọn (isSelecting = true) - giữ nguyên như yêu cầu
        setIsSelecting(true);
        isSelectingRef.current = true;

        // Set attribute để interval có thể check
        if (gridWrapperRef.current) {
          gridWrapperRef.current.setAttribute("data-selecting", "true");
        }
        // Hiển thị fill handle cho cell được chọn ngay lập tức
        showFillHandle(event);

        // Đảm bảo fill handle được hiển thị ngay lập tức (chỉ nếu editable)
        if (event.colDef?.field && isColumnEditable(event.colDef.field)) {
          setFillHandleVisible(true);
        }

        // Cập nhật vị trí fill handle
        let mdCellElement: HTMLElement | null =
          event.event?.target?.closest?.(".ag-cell") ?? null;
        // Fallback for cells without native mouse event (e.g. Checkbox)
        if (!mdCellElement && gridWrapperRef.current && event.column?.getId) {
          const colId = event.column.getId();
          const rowEl = gridWrapperRef.current.querySelector(
            `[row-index="${event.rowIndex}"]`,
          );
          if (rowEl) {
            mdCellElement =
              (rowEl.querySelector(`[col-id="${colId}"]`) as HTMLElement) ??
              null;
          }
        }
        if (mdCellElement && gridWrapperRef.current) {
          const rect = mdCellElement.getBoundingClientRect();
          const gridRect = gridWrapperRef.current.getBoundingClientRect();
          setFillHandlePosition({
            top: rect.bottom - gridRect.top - 5,
            left: rect.right - gridRect.left - 5,
          });
        }

        // Reset multi-fill helpers at new selection start
        setMultiSelectionPattern(null);
        setMultiSelectionBounds(null);
      }
    },
    [
      disableDragCopy,
      isDraggingFill,
      setStartCell,
      setSelectedCells,
      setIsSelecting,
      showFillHandle,
      isColumnEditable,
      setFillHandleVisible,
      setFillHandlePosition,
      setMultiSelectionPattern,
      setMultiSelectionBounds,
    ],
  );

  // Hàm xử lý auto-scroll khi drag fill handle
  const handleAutoScroll = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (disableDragCopy) return;
      if (!gridWrapperRef.current || (!isDraggingFill && !isSelecting)) {
        return;
      }

      // Lấy tất cả các container có thể scroll
      const gridViewport = gridWrapperRef.current.querySelector(
        ".ag-body-viewport",
      ) as HTMLElement;
      const centerViewport = gridWrapperRef.current.querySelector(
        ".ag-center-cols-viewport",
      ) as HTMLElement;

      if (!gridViewport) {
        return;
      }

      const scrollStep = 4; // Bước cuộn mỗi lần (giảm để mượt hơn)
      const scrollInterval = 8; // Thời gian giữa các lần cuộn (ms) - nhanh hơn

      // Dừng interval cũ nếu có
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
        setIsAutoScrolling(false);
      }

      const interval = setInterval(() => {
        if (!isDraggingFillRef.current && !isSelectingRef.current) {
          clearInterval(interval);
          autoScrollIntervalRef.current = null;
          setIsAutoScrolling(false);
          return;
        }

        // Kiểm tra xem có thể scroll thêm không
        let canScroll = false;
        switch (direction) {
          case "up":
            canScroll = gridViewport.scrollTop > 0;
            if (canScroll) {
              // Sử dụng DOM manipulation để kiểm soát tốt hơn
              const newScrollTop = Math.max(
                0,
                gridViewport.scrollTop - scrollStep,
              );
              gridViewport.scrollTop = newScrollTop;
            }
            break;
          case "down":
            const maxScrollTop =
              gridViewport.scrollHeight - gridViewport.clientHeight;
            canScroll = gridViewport.scrollTop < maxScrollTop;
            if (canScroll) {
              const newScrollTop = Math.min(
                maxScrollTop,
                gridViewport.scrollTop + scrollStep,
              );
              gridViewport.scrollTop = newScrollTop;
            }
            break;
          case "left":
            // Scroll ngang trái - ưu tiên centerViewport
            const leftScrollContainer = centerViewport || gridViewport;
            canScroll =
              leftScrollContainer && leftScrollContainer.scrollLeft > 0;

            if (canScroll) {
              const newScrollLeft = Math.max(
                0,
                leftScrollContainer.scrollLeft - scrollStep,
              );
              leftScrollContainer.scrollLeft = newScrollLeft;
            }
            break;
          case "right":
            // Scroll ngang phải - ưu tiên centerViewport
            const rightScrollContainer = centerViewport || gridViewport;
            const maxScrollLeft = rightScrollContainer
              ? rightScrollContainer.scrollWidth -
                rightScrollContainer.clientWidth
              : 0;
            canScroll =
              rightScrollContainer &&
              rightScrollContainer.scrollLeft < maxScrollLeft;

            if (canScroll) {
              const newScrollLeft = Math.min(
                maxScrollLeft,
                rightScrollContainer.scrollLeft + scrollStep,
              );
              rightScrollContainer.scrollLeft = newScrollLeft;
            }
            break;
        }

        // Nếu không thể scroll thêm, dừng interval
        if (!canScroll) {
          clearInterval(interval);
          autoScrollIntervalRef.current = null;
          setIsAutoScrolling(false);
        }
      }, scrollInterval);

      autoScrollIntervalRef.current = interval;
      setIsAutoScrolling(true);
    },
    [isDraggingFill, isSelecting, disableDragCopy],
  );

  // Hàm dừng auto-scroll
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
      setIsAutoScrolling(false);
    }

    // KHÔNG reset refs ở đây vì stopAutoScroll có thể được gọi khi chuột ra khỏi vùng scroll
    // nhưng vẫn đang trong quá trình drag/select
    // Refs chỉ nên được reset khi thực sự kết thúc drag/select operations
  }, []);

  // Hàm xử lý auto-scroll dựa trên vị trí chuột
  const handleAutoScrollByMousePosition = useCallback(
    (mouseX: number, mouseY: number) => {
      if (disableDragCopy) return;
      if (!gridWrapperRef.current || (!isDraggingFill && !isSelecting)) {
        return;
      }

      const gridRect = gridWrapperRef.current.getBoundingClientRect();
      const scrollThreshold = 50; // Giảm threshold để nhạy hơn

      // Kiểm tra vị trí chuột so với khung grid
      const isNearTop = mouseY - gridRect.top < scrollThreshold;
      const isNearBottom = gridRect.bottom - mouseY < scrollThreshold;
      const isNearLeft = mouseX - gridRect.left < scrollThreshold;
      const isNearRight = gridRect.right - mouseX < scrollThreshold;

      // Dừng auto-scroll nếu chuột không ở gần viền
      if (!isNearTop && !isNearBottom && !isNearLeft && !isNearRight) {
        stopAutoScroll();
      } else {
        // Bắt đầu auto-scroll theo hướng tương ứng (dựa vào vị trí chuột)
        if (isNearTop) {
          handleAutoScroll("up");
        } else if (isNearBottom) {
          handleAutoScroll("down");
        } else if (isNearLeft) {
          handleAutoScroll("left");
        } else if (isNearRight) {
          handleAutoScroll("right");
        }
      }
    },
    [
      isDraggingFill,
      isSelecting,
      handleAutoScroll,
      stopAutoScroll,
      disableDragCopy,
    ],
  );

  // Hàm xử lý khi drag fill handle qua các cell
  const handleFillDrag = useCallback(
    (event: any) => {
      if (disableDragCopy) return;
      if (!isDraggingFill) return;

      // QUAN TRỌNG: Không xử lý nếu chuột đã được nhả ra
      if (!isMouseDownRef.current) return;

      // Xử lý auto-scroll dựa trên vị trí chuột
      const mouseX = event.event?.clientX || 0;
      const mouseY = event.event?.clientY || 0;
      handleAutoScrollByMousePosition(mouseX, mouseY);

      if (event.rowIndex != null && event.colDef?.field) {
        const targetRowIndex = event.rowIndex;
        const targetColField = event.colDef.field;
        const columnOrder = getColumnOrder();
        const targetColIndex = columnOrder.indexOf(targetColField);

        const fillCells = new Set<string>();

        // Trường hợp chọn nhiều ô: kéo để fill cả block theo pattern
        if (
          selectedCells.size > 1 &&
          multiSelectionBounds &&
          multiSelectionPattern
        ) {
          const startRow = Math.min(
            multiSelectionBounds.startRow,
            targetRowIndex,
          );
          const endRow = Math.max(multiSelectionBounds.endRow, targetRowIndex);
          const startCol = Math.min(
            multiSelectionBounds.startColIndex,
            targetColIndex,
          );
          const endCol = Math.max(
            multiSelectionBounds.endColIndex,
            targetColIndex,
          );

          const patternW = multiSelectionPattern[0]?.length || 0;
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              if (c >= 0 && c < columnOrder.length) {
                const targetField = columnOrder[c];
                const relCol =
                  (((c - multiSelectionBounds.startColIndex) % patternW) +
                    patternW) %
                  patternW;
                const sourceField =
                  columnOrder[multiSelectionBounds.startColIndex + relCol];

                if (isTypeCompatible(sourceField, targetField)) {
                  fillCells.add(`${r}-${targetField}`);
                }
              }
            }
          }
        } else if (fillSourceCell) {
          // Trường hợp 1 ô như cũ
          const sourceRowIndex = fillSourceCell.rowIndex;
          const sourceColField = fillSourceCell.colField;
          const sourceColIndex = columnOrder.indexOf(sourceColField);

          if (sourceColIndex !== -1 && targetColIndex !== -1) {
            const startRow = Math.min(sourceRowIndex, targetRowIndex);
            const endRow = Math.max(sourceRowIndex, targetRowIndex);
            const startCol = Math.min(sourceColIndex, targetColIndex);
            const endCol = Math.max(sourceColIndex, targetColIndex);
            for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
              for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
                const targetField = columnOrder[colIndex];
                if (isTypeCompatible(sourceColField, targetField)) {
                  fillCells.add(`${rowIndex}-${targetField}`);
                }
              }
            }
          }
        }

        setFillTargetCells(fillCells);
        setSelectedCells(fillCells);
      }
    },
    [
      disableDragCopy,
      isDraggingFill,
      getColumnOrder,
      selectedCells,
      multiSelectionBounds,
      multiSelectionPattern,
      isTypeCompatible,
      fillSourceCell,
      setFillTargetCells,
      setSelectedCells,
    ],
  );

  // Hàm xử lý khi chuột di chuyển qua các ô trong khi đang chọn
  const handleMouseOver = useCallback(
    (event: any) => {
      if (disableDragCopy) return;

      // QUAN TRỌNG: Không xử lý nếu chuột đã được nhả ra
      if (!isMouseDownRef.current) return;

      // Nếu đang drag fill handle - xử lý fill drag
      if (isDraggingFill) {
        handleFillDrag(event);
        return; // Return sớm khi đang drag fill để tránh conflict
      }

      // Chỉ xử lý khi có startCell (đã mousedown) và event hợp lệ
      if (startCell && event.rowIndex != null && event.colDef?.field) {
        const currentCellId = `${event.rowIndex}-${event.colDef.field}`;
        const startCellId = `${startCell.rowIndex}-${startCell.colField}`;

        // Nếu di chuyển đến cell khác từ cell ban đầu, bắt đầu cell dragging mode
        if (currentCellId !== startCellId && !isDraggingCells) {
          // console.log("Starting cell dragging mode");
          setIsDraggingCells(true);
        }

        // Nếu đang drag cells hoặc vừa bắt đầu drag
        if (isDraggingCells || currentCellId !== startCellId) {
          // Lấy thông tin về ô bắt đầu và ô hiện tại
          const startRowIndex = startCell.rowIndex;
          const endRowIndex = event.rowIndex;
          const startColField = startCell.colField;
          const endColField = event.colDef.field;

          // Lấy danh sách các cột từ columnDefs để xác định thứ tự
          const columnOrder = columnDefs
            .map((col) => col.field) // Lấy `field` từ cột
            .filter((field): field is string => !!field); // Bỏ qua các cột không hợp lệ

          // Xác định vị trí của các cột bắt đầu và kết thúc
          const startColIndex = columnOrder.indexOf(startColField);
          const endColIndex = columnOrder.indexOf(endColField);

          // Nếu không tìm thấy cột, thoát khỏi hàm
          if (startColIndex === -1 || endColIndex === -1) return;

          // Tạo tập hợp các ô đã chọn
          const selectedCellsSet = new Set<string>();

          // Duyệt qua tất cả các hàng và cột nằm trong vùng được chọn
          for (
            let rowIndex = Math.min(startRowIndex, endRowIndex);
            rowIndex <= Math.max(startRowIndex, endRowIndex);
            rowIndex++
          ) {
            for (
              let colIndex = Math.min(startColIndex, endColIndex);
              colIndex <= Math.max(startColIndex, endColIndex);
              colIndex++
            ) {
              const colField = columnOrder[colIndex]; // Tên cột hiện tại
              selectedCellsSet.add(`${rowIndex}-${colField}`); // Thêm ID ô vào tập hợp
            }
          }

          // Cập nhật danh sách các ô đã chọn
          setSelectedCells(selectedCellsSet);

          // Cập nhật bounds cho multi-selection để hỗ trợ drag-fill nhiều ô
          const minRow = Math.min(startRowIndex, endRowIndex);
          const maxRow = Math.max(startRowIndex, endRowIndex);
          const minCol = Math.min(startColIndex, endColIndex);
          const maxCol = Math.max(startColIndex, endColIndex);
          setMultiSelectionBounds({
            startRow: minRow,
            endRow: maxRow,
            startColIndex: minCol,
            endColIndex: maxCol,
          });

          // Hiển thị fill handle cả khi chọn nhiều ô (đặt theo vị trí ô hiện tại)
          showFillHandle(event);
        }
      }
    },
    [
      disableDragCopy,
      isDraggingFill,
      handleFillDrag,
      startCell,
      isDraggingCells,
      columnDefs,
      setSelectedCells,
      setMultiSelectionBounds,
      showFillHandle,
      setIsDraggingCells,
    ],
  );

  // Hàm xử lý khi kết thúc drag fill handle
  const handleFillMouseUp = async () => {
    // Reset mouse state ngay lập tức
    isMouseDownRef.current = false;

    // Dừng auto-scroll khi kết thúc drag
    stopAutoScroll();

    if (isDraggingFill && fillTargetCells.size > 0) {
      const newRowData = [...(isFiltered ? filteredData : rowData)];
      const changes: { id: string; data: Record<string, any> }[] = [];
      const columnOrder = getColumnOrder();

      if (
        selectedCells.size > 1 &&
        multiSelectionBounds &&
        multiSelectionPattern
      ) {
        // Tính bounds của vùng đích từ fillTargetCells
        let minRow = Number.POSITIVE_INFINITY;
        let maxRow = Number.NEGATIVE_INFINITY;
        let minColIdx = Number.POSITIVE_INFINITY;
        let maxColIdx = Number.NEGATIVE_INFINITY;

        fillTargetCells.forEach((cellId) => {
          const [rowStr, field] = cellId.split("-");
          const r = parseInt(rowStr, 10);
          const c = columnOrder.indexOf(field);
          if (!isNaN(r) && c !== -1) {
            minRow = Math.min(minRow, r);
            maxRow = Math.max(maxRow, r);
            minColIdx = Math.min(minColIdx, c);
            maxColIdx = Math.max(maxColIdx, c);
          }
        });

        const patternH = multiSelectionPattern.length;
        const patternW = multiSelectionPattern[0]?.length || 0;

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minColIdx; c <= maxColIdx; c++) {
            const field = columnOrder[c];
            if (!field) continue;
            const relRow =
              (((r - multiSelectionBounds.startRow) % patternH) + patternH) %
              patternH;
            const relCol =
              (((c - multiSelectionBounds.startColIndex) % patternW) +
                patternW) %
              patternW;
            const newValue = multiSelectionPattern[relRow]?.[relCol];
            const sourceField =
              columnOrder[multiSelectionBounds.startColIndex + relCol];

            if (
              r === fillSourceCell?.rowIndex &&
              field === fillSourceCell?.colField
            ) {
              continue;
            }

            // Check if column is editable and type is compatible
            if (
              !isColumnEditable(field) ||
              !isTypeCompatible(sourceField, field)
            )
              continue;

            // Kiểm tra nếu cột là select thì chỉ set nếu hợp lệ
            const colDef = columnDefs.find((col) => col.field === field);
            let isValid = true;

            // Build params for cellEditorParams function if needed
            const buildParams = () => {
              const node = gridRef.current?.api.getDisplayedRowAtIndex(r);
              return {
                node,
                data: node?.data,
                colDef,
                api: gridRef.current?.api,
                columnApi: (gridRef.current as any)?.columnApi, // columnApi might be deprecated in newer versions but kept for compat
                context: (gridRef.current?.api as any)?.getContext?.(),
              };
            };

            let options: any[] | undefined;
            const paramsDef = colDef?.cellEditorParams;

            // Fix: Khi cột là localSztp và drag cùng với oprCD,
            // dùng oprCD mới từ newRowData để tính options thay vì đọc node.data cũ
            if (field === "localSztp") {
              const currentRow = newRowData[r];
              const newOprCd = currentRow?.oprCD ?? currentRow?.oprCd;
              if (newOprCd) {
                const dynamicOptions = getLocalSztpForOprCd(newOprCd);
                if (dynamicOptions.length > 0) {
                  options = dynamicOptions;
                }
              }
              if (!options && typeof paramsDef === "function") {
                try {
                  const params = buildParams();
                  const res = paramsDef(params);
                  if (res && Array.isArray(res.values)) options = res.values;
                } catch {
                  /* ignore */
                }
              }
            } else if (typeof paramsDef === "function") {
              try {
                const params = buildParams();
                const res = paramsDef(params);
                if (res && Array.isArray(res.values)) {
                  options = res.values;
                }
              } catch {
                // Ignore error
              }
            } else if (
              paramsDef &&
              typeof paramsDef === "object" &&
              Array.isArray(paramsDef.values)
            ) {
              options = paramsDef.values;
            }

            // Fallback: nếu là Select column dùng cấu hình typeColumn/selectOptions
            // thì lấy options từ colDef.selectOptions (giống logic usePasteHandler)
            if (!options || options.length === 0) {
              options =
                (colDef as any).selectOptions || (colDef as any).selectOption;
            }

            // Check if it's a select type column (either explicit type or has options)
            // Also check if cellEditor name suggests it's a select
            const isSelectType =
              (colDef as any)?.typeColumn === "Select" ||
              (colDef?.cellEditor as any)?.name === "AntdSelectCellEditor" ||
              (colDef?.cellEditor as any)?.displayName ===
                "AntdSelectCellEditor" ||
              !!options;

            if (isSelectType) {
              if (!options || options.length === 0) {
                isValid = false;
              } else {
                isValid = options.some((opt: any) => {
                  const optValue = typeof opt === "object" ? opt.value : opt;
                  return String(optValue ?? "") === String(newValue ?? "");
                });
              }
            }

            // Normalization for Checkbox columns
            let normalizedValue = newValue;
            if (colDef && (colDef as any).typeColumn === "Checkbox") {
              normalizedValue =
                newValue === true ||
                newValue === "true" ||
                newValue === 1 ||
                newValue === "1";
            }

            if (isValid && r < newRowData.length && newRowData[r]) {
              const oldValue = newRowData[r][field];
              if (oldValue !== normalizedValue) {
                newRowData[r][field] = normalizedValue;
                const rowId = getItemId(newRowData[r]);
                if (rowId) {
                  const existing = changes.find((ch) => ch.id === rowId);
                  if (existing) {
                    existing.data[field] = normalizedValue;
                  } else {
                    changes.push({
                      id: rowId,
                      data: { [field]: normalizedValue },
                    });
                  }
                }
              }
            }
          }
        }
      } else if (fillSourceCell && fillTargetCells.size > 1) {
        // Trường hợp 1 ô nguồn: giữ nguyên hành vi cũ
        fillTargetCells.forEach((cellId) => {
          const [rowIndexStr, colField] = cellId.split("-");
          const rowIndex = parseInt(rowIndexStr, 10);

          // BỎ QUA Ô GÓC (ô bắt đầu fill)
          if (
            rowIndex === fillSourceCell?.rowIndex &&
            colField === fillSourceCell?.colField
          ) {
            return;
          }

          // Check if column is editable
          if (!isColumnEditable(colField)) return;

          // Kiểm tra nếu cột là select thì chỉ set nếu hợp lệ
          const colDef = columnDefs.find((col) => col.field === colField);
          let isValid = true;

          // Build params for cellEditorParams function if needed
          const buildParams = () => {
            const node = gridRef.current?.api.getDisplayedRowAtIndex(rowIndex);
            return {
              node,
              data: node?.data,
              colDef,
              api: gridRef.current?.api,
              columnApi: (gridRef.current as any)?.columnApi,
              context: (gridRef.current?.api as any)?.getContext?.(),
            };
          };

          let options: any[] | undefined;
          const paramsDef = colDef?.cellEditorParams;

          // Fix: Khi cột là localSztp và drag cùng với oprCD,
          // dùng oprCD mới từ newRowData để tính options thay vì đọc node.data cũ
          // (node.data._localSztpOptions chưa được update lúc này)
          if (colField === "localSztp") {
            const currentRow = newRowData[rowIndex];
            const newOprCd = currentRow?.oprCD ?? currentRow?.oprCd;
            if (newOprCd) {
              const dynamicOptions = getLocalSztpForOprCd(newOprCd);
              if (dynamicOptions.length > 0) {
                options = dynamicOptions; // string[] — sẽ được compare đúng bên dưới
              }
            }
            if (!options && typeof paramsDef === "function") {
              try {
                const params = buildParams();
                const res = paramsDef(params);
                if (res && Array.isArray(res.values)) options = res.values;
              } catch {
                /* ignore */
              }
            }
          } else if (typeof paramsDef === "function") {
            try {
              const params = buildParams();
              const res = paramsDef(params);
              if (res && Array.isArray(res.values)) options = res.values;
            } catch {
              /* ignore */
            }
          } else if (
            paramsDef &&
            typeof paramsDef === "object" &&
            Array.isArray(paramsDef.values)
          ) {
            options = paramsDef.values;
          }

          // Fallback: nếu là Select column dùng cấu hình typeColumn/selectOptions
          if (!options || options.length === 0) {
            options =
              (colDef as any).selectOptions || (colDef as any).selectOption;
          }

          // Check if it's a select type column (either explicit type or has options)
          const isSelectType =
            (colDef as any)?.typeColumn === "Select" ||
            (colDef?.cellEditor as any)?.name === "AntdSelectCellEditor" ||
            (colDef?.cellEditor as any)?.displayName ===
              "AntdSelectCellEditor" ||
            !!options;

          if (isSelectType) {
            if (!options || options.length === 0) {
              isValid = false;
            } else {
              isValid = options.some((opt: any) => {
                const optValue = typeof opt === "object" ? opt.value : opt;
                return (
                  String(optValue ?? "") === String(fillSourceCell.value ?? "")
                );
              });
            }
          }

          if (
            isValid &&
            rowIndex < newRowData.length &&
            newRowData[rowIndex] &&
            isTypeCompatible(fillSourceCell.colField, colField)
          ) {
            const oldValue = newRowData[rowIndex][colField];
            let newValue = fillSourceCell.value;

            // Normalization for Checkbox columns
            if (colDef && (colDef as any).typeColumn === "Checkbox") {
              newValue =
                newValue === true ||
                newValue === "true" ||
                newValue === 1 ||
                newValue === "1";
            }

            if (oldValue !== newValue) {
              newRowData[rowIndex][colField] = newValue;
              const rowId = getItemId(newRowData[rowIndex]);
              if (rowId) {
                const existing = changes.find((ch) => ch.id === rowId);
                if (existing) {
                  existing.data[colField] = newValue;
                } else {
                  changes.push({ id: rowId, data: { [colField]: newValue } });
                }
              }
            }
          }
        });
      }
      let isoSztpSource: any = null;
      if (fillSourceCell) {
        const sourceRow = newRowData[fillSourceCell.rowIndex];
        if (sourceRow) {
          isoSztpSource = sourceRow.isoSztp;
        }
      }

      // Sau khi fill localSztp, dán luôn isoSztp của ô gốc cho các ô đang fill localSztp
      const localSztpField = columnDefs.find(
        (col) => col.field === "localSztp",
      );
      if (localSztpField && isoSztpSource !== undefined) {
        const filledLocalSztpCells = Array.from(fillTargetCells).filter(
          (cellId) => {
            const [, colField] = cellId.split("-");
            return colField === "localSztp";
          },
        );

        for (const cellId of filledLocalSztpCells) {
          const [rowIndexStr] = cellId.split("-");
          const rowIndex = parseInt(rowIndexStr, 10);
          const row = newRowData[rowIndex];
          if (!row) continue;
          // BỎ QUA nếu chưa có hãng khai thác (oprCd hoặc oprCD)
          if (!row.oprCd && !row.oprCD) continue;
          // Dán isoSztp của ô gốc
          if (row.isoSztp !== isoSztpSource) {
            row.isoSztp = isoSztpSource;
            const rowId = getItemId(row);
            if (rowId) {
              const existing = changes.find((ch) => ch.id === rowId);
              if (existing) {
                existing.data["isoSztp"] = isoSztpSource;
              } else {
                changes.push({ id: rowId, data: { isoSztp: isoSztpSource } });
              }
            }
          }
        }
      }

      // Khi drag-copy oprCD/oprCd, update _localSztpOptions trực tiếp vào node.data
      // Dùng forEachNode để tìm node theo ID, tránh lỗi index with virtual scrolling
      const oprCdChangesInFill = changes.filter(
        (ch) => ch.data.oprCD !== undefined || ch.data.oprCd !== undefined,
      );
      if (oprCdChangesInFill.length > 0 && gridRef.current?.api) {
        const api = gridRef.current.api;
        // Build lookup map: itemId → oprCd mới
        const oprCdMap = new Map<string, string>();
        oprCdChangesInFill.forEach((ch) => {
          const oprCd = ch.data.oprCD ?? ch.data.oprCd;
          if (oprCd && ch.id) oprCdMap.set(ch.id, oprCd);
        });
        // Duyệt tất cả nodes để tìm và mutate đúng node
        api.forEachNode((node: any) => {
          if (!node.data) return;
          const nodeId = getItemId(node.data);
          const oprCd = oprCdMap.get(nodeId);
          if (!oprCd) return;

          if (!Object.isExtensible(node.data)) {
            node.setData({
              ...node.data,
              _localSztpOptions: getLocalSztpForOprCd(oprCd),
            });
          } else {
            node.data._localSztpOptions = getLocalSztpForOprCd(oprCd);
          }
        });
      }

      if (isFiltered) {
        setFilteredData(newRowData);
      }

      if (changes.length > 0) {
        pasteHandlerFillChanges(changes);
      }

      if (gridRef.current?.api) {
        gridRef.current.api.refreshCells({ force: true });
      }
    }

    setIsDraggingFill(false);
    isDraggingFillRef.current = false;
    setFillTargetCells(new Set());

    // Giữ fill handle visible và không reset selection ngay lập tức
    // setFillHandleVisible(false);

    setFillSourceCell(null);
    setMultiSelectionPattern(null);
    setMultiSelectionBounds(null);

    // Delay reset isSelecting state để tránh conflict
    setTimeout(() => {
      setIsSelecting(false);
      isSelectingRef.current = false;

      // Clear attributes để interval dừng
      if (gridWrapperRef.current) {
        gridWrapperRef.current.removeAttribute("data-dragging");
        gridWrapperRef.current.removeAttribute("data-selecting");
      }

      // Xóa thông tin về ô bắt đầu
      setStartCell(null);
    }, 100);
  };

  const handleMouseUp = useCallback(() => {
    // Chuột đã nhả ra
    isMouseDownRef.current = false;

    // ── ĐANG EDIT: BỎ QUA SELECTION RESET ─────────────────────────────────
    // Khi grid đang có cell trong edit mode, không reset selection state
    // để tránh re-render cancel editor (vd: click vào dropdown, datepicker...)
    if (gridRef.current?.api) {
      const editingCells = gridRef.current.api.getEditingCells();
      if (editingCells && editingCells.length > 0) {
        return;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const clickDuration = Date.now() - clickStartTimeRef.current;
    const isQuickClick = clickDuration < 200 && !isDraggingCells; // Quick click under 200ms without dragging

    // Xử lý fill handle mouse up trước
    if (isDraggingFill) {
      handleFillMouseUp();
      return; // Return sớm để tránh conflict với selection logic
    }

    // Reset cell dragging state
    if (isDraggingCells) {
      setIsDraggingCells(false);
    }

    // Reset selection state nếu đang active
    if (isSelecting) {
      stopAutoScroll();

      // LUÔN LUÔN delay việc reset isSelecting để không interrupt row selection
      // Bất kể quick click hay không, AG Grid cần thời gian để process row selection
      const delay = isQuickClick ? 100 : 50; // Tăng delay cho quick click
      setTimeout(() => {
        setIsSelecting(false);
        isSelectingRef.current = false;

        // Clear attributes
        if (gridWrapperRef.current) {
          gridWrapperRef.current.removeAttribute("data-selecting");
        }
      }, delay);
    }

    // Delay việc clear startCell để preserve fill handle hiển thị
    if (startCell) {
      if (selectedCells.size > 1) {
        // Multi-cell selection - delay clear để preserve fill handle
        setTimeout(() => {
          setStartCell(null);
        }, 100);
      } else {
        // Single cell selection - delay ngắn hoặc ngay nếu là quick click
        const delay = isQuickClick ? 10 : 50;
        setTimeout(() => {
          setStartCell(null);
        }, delay);
      }
    }

    // KHÔNG clear selectedCells ở đây - để cho AG Grid quản lý row selection
  }, [
    isDraggingCells,
    isDraggingFill,
    isSelecting,
    startCell,
    selectedCells,
    setStartCell,
    setIsSelecting,
    setIsDraggingCells,
  ]);

  // Hàm xử lý khi người dùng click ra ngoài bảng
  const handleClickOutside = (event: MouseEvent) => {
    // THÊM: Không reset selection states khi đang loading more data
    if (isLoadingMore) {
      return;
    }

    // FIX (Detached Dropdown Bug): Khi Antd unmount popup (chọn option Select,
    // bấm OK DatePicker), event.target bị detach khỏi DOM ngay lập tức.
    // closest() trên detached node trả về null → nhầm là "outside click" → stopEditing().
    // Check này phải là bước đầu tiên, trước cả Antd selector check.
    const clickTarget = event.target as HTMLElement;
    if (!document.body.contains(clickTarget)) {
      return; // Target đã bị unmount (Antd popup đóng) — bỏ qua
    }

    // FIX: Không reset khi click vào Antd overlay popup (Select dropdown, DatePicker, v.v.)
    // Các popup này render ra document.body nên nằm NGOÀI gridWrapperRef
    // → nếu không bỏ qua, editor sẽ bị đóng ngay khi user click vào dropdown
    const isInsideAntdPopup =
      !!clickTarget?.closest?.(".ant-select-dropdown") ||
      !!clickTarget?.closest?.(".ant-picker-dropdown") ||
      !!clickTarget?.closest?.(".ant-picker-panel-container") ||
      !!clickTarget?.closest?.(".ant-dropdown") ||
      !!clickTarget?.closest?.(".ant-select-item") ||
      !!clickTarget?.closest?.(".ant-time-picker-panel") ||
      !!clickTarget?.closest?.("[class*='ant-picker']") ||
      !!clickTarget?.closest?.("[class*='ant-select-dropdown']");
    if (isInsideAntdPopup) return;

    // Cải thiện detection: kiểm tra tất cả các AG Grid elements
    const isInsideGrid =
      gridWrapperRef.current?.contains(clickTarget) ||
      clickTarget?.closest?.(".ag-grid") ||
      clickTarget?.closest?.(".ag-root-wrapper") ||
      clickTarget?.closest?.(".ag-body-viewport") ||
      clickTarget?.closest?.(".ag-row");

    // Nếu click không nằm trong vùng bảng
    if (gridWrapperRef.current && !isInsideGrid) {
      // FIX: Nếu đang edit, gọi stopEditing() trước khi reset states
      // (vì stopEditingWhenCellsLoseFocus=false nên cần tự quản lý)
      if (gridRef.current?.api) {
        const editingCells = gridRef.current.api.getEditingCells();
        if (editingCells && editingCells.length > 0) {
          gridRef.current.api.stopEditing();
        }
      }

      isMouseDownRef.current = false;

      // Reset chỉ CELL selection states, KHÔNG ảnh hưởng row selection
      setFillHandleVisible(false);
      setFillSourceCell(null);
      setFillSourceCellInfo(null);
      setIsSelecting(false);
      isSelectingRef.current = false;
      setIsDraggingFill(false);
      isDraggingFillRef.current = false;
      setIsDraggingCells(false);
      setStartCell(null);

      // Clear selectedCells khi click ra ngoài table
      setSelectedCells(new Set());

      // Clear attributes
      if (gridWrapperRef.current) {
        gridWrapperRef.current.removeAttribute("data-selecting");
        gridWrapperRef.current.removeAttribute("data-dragging");
      }
    }
  };

  // Hàm xử lý khi bắt đầu drag fill handle
  const handleFillMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (disableDragCopy) return;
      event.preventDefault();
      event.stopPropagation();

      // Đánh dấu đang giữ chuột khi bắt đầu drag fill handle
      isMouseDownRef.current = true;

      // Đảm bảo fill handle vẫn hiển thị khi bắt đầu drag (chỉ nếu editable)
      if (
        !fillHandleVisible &&
        fillSourceCellInfo &&
        isColumnEditable(fillSourceCellInfo.colField)
      ) {
        setFillHandleVisible(true);
      }

      // Không cần tính offset vì fill handle không di chuyển theo chuột

      // Set drag state
      setIsDraggingFill(true);
      isDraggingFillRef.current = true;
      setFillTargetCells(new Set());

      // Đảm bảo không bị conflict với selection state - nhưng không tắt ngay lập tức
      if (isSelecting) {
        // Delay việc tắt isSelecting để tránh conflict
        setTimeout(() => {
          setIsSelecting(false);
          isSelectingRef.current = false;
        }, 50);
      }
    },
    [isSelecting, disableDragCopy, fillSourceCellInfo, fillHandleVisible],
  );

  // Hàm tính toán các ô mục tiêu khi drag fill handle
  const calculateFillTargetCells = useCallback(
    (mouseX: number, mouseY: number) => {
      if (disableDragCopy) return;
      if (!isDraggingFill || !gridWrapperRef.current) return;

      // QUAN TRỌNG: Không xử lý nếu chuột đã được nhả ra
      if (!isMouseDownRef.current) return;

      // Throttle để tránh tính toán quá nhiều lần (giảm để mượt hơn)
      const now = Date.now();
      if (now - lastCalculateTime.current < 8) return; // ~120fps
      lastCalculateTime.current = now;

      // Tìm cell element tại vị trí chuột
      // Tạm thời disable pointer events của fill-handle để tránh che khuất
      const fillHandleElement = document.querySelector(
        ".fill-handle",
      ) as HTMLElement;
      const originalPointerEvents = fillHandleElement?.style.pointerEvents;
      if (fillHandleElement) {
        fillHandleElement.style.pointerEvents = "none";
      }

      const elementAtPoint = document.elementFromPoint(mouseX, mouseY);

      // Khôi phục pointer events của fill-handle
      if (fillHandleElement) {
        fillHandleElement.style.pointerEvents = originalPointerEvents || "";
      }

      let targetRowIndex: number;
      let targetColField: string;

      if (elementAtPoint) {
        // Tìm cell element gần nhất
        const cellElement = elementAtPoint.closest(".ag-cell");
        if (cellElement) {
          // Lấy thông tin row và column từ cell element
          const rowElement = cellElement.closest("[row-index]");
          if (rowElement) {
            targetRowIndex = parseInt(
              rowElement.getAttribute("row-index") || "0",
              10,
            );
            const colId = cellElement.getAttribute("col-id");
            if (colId !== null) {
              targetColField = colId;
            } else {
              return;
            }
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        // Fallback: tính toán dựa trên vị trí fill-handle
        if (!gridWrapperRef.current) return;

        const gridRect = gridWrapperRef.current.getBoundingClientRect();
        const relativeX = mouseX - gridRect.left;
        const relativeY = mouseY - gridRect.top;

        // Ước tính row và column dựa trên vị trí
        const rowHeight = 40; // Chiều cao mỗi row
        const headerHeight = 45; // Chiều cao header

        targetRowIndex = Math.max(
          0,
          Math.floor((relativeY - headerHeight) / rowHeight),
        );

        // Tìm column dựa trên vị trí X (cần cải thiện logic này)
        const columnOrder = getColumnOrder();
        if (columnOrder.length === 0) return;

        // Ước tính column index (có thể cần điều chỉnh)
        const estimatedColIndex = Math.min(
          columnOrder.length - 1,
          Math.max(0, Math.floor(relativeX / 100)),
        );
        targetColField = columnOrder[estimatedColIndex];
      }

      // Tính toán fill cells trực tiếp
      const columnOrder = getColumnOrder();
      const targetColIndex = columnOrder.indexOf(targetColField);

      const fillCells = new Set<string>();

      // Trường hợp chọn nhiều ô: kéo để fill cả block theo pattern
      if (
        selectedCells.size > 1 &&
        multiSelectionBounds &&
        multiSelectionPattern
      ) {
        const startRow = Math.min(
          multiSelectionBounds.startRow,
          targetRowIndex,
        );
        const endRow = Math.max(multiSelectionBounds.endRow, targetRowIndex);
        const startCol = Math.min(
          multiSelectionBounds.startColIndex,
          targetColIndex,
        );
        const endCol = Math.max(
          multiSelectionBounds.endColIndex,
          targetColIndex,
        );

        const patternW = multiSelectionPattern[0]?.length || 0;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            if (c >= 0 && c < columnOrder.length) {
              const targetField = columnOrder[c];
              const relCol =
                (((c - multiSelectionBounds.startColIndex) % patternW) +
                  patternW) %
                patternW;
              const sourceField =
                columnOrder[multiSelectionBounds.startColIndex + relCol];

              if (isTypeCompatible(sourceField, targetField)) {
                fillCells.add(`${r}-${targetField}`);
              }
            }
          }
        }
      } else if (fillSourceCell) {
        // Trường hợp 1 ô như cũ
        const sourceRowIndex = fillSourceCell.rowIndex;
        const sourceColField = fillSourceCell.colField;
        const sourceColIndex = columnOrder.indexOf(sourceColField);

        if (sourceColIndex !== -1 && targetColIndex !== -1) {
          const startRow = Math.min(sourceRowIndex, targetRowIndex);
          const endRow = Math.max(sourceRowIndex, targetRowIndex);
          const startCol = Math.min(sourceColIndex, targetColIndex);
          const endCol = Math.max(sourceColIndex, targetColIndex);
          for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
            for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
              const targetField = columnOrder[colIndex];
              if (isTypeCompatible(sourceColField, targetField)) {
                fillCells.add(`${rowIndex}-${targetField}`);
              }
            }
          }
        }
      }

      setFillTargetCells(fillCells);
      setSelectedCells(fillCells);

      // Cập nhật vị trí fill handle đến ô cuối cùng trong vùng fill
      if (fillCells.size > 0) {
        // Tìm ô cuối cùng dựa trên row và column index
        let maxRowIndex = -1;
        let maxColIndex = -1;
        let lastCellId = "";

        fillCells.forEach((cellId) => {
          const [rowIndex, colField] = cellId.split("-");
          const rowIdx = parseInt(rowIndex, 10);
          const colIdx = columnOrder.indexOf(colField);

          if (
            rowIdx > maxRowIndex ||
            (rowIdx === maxRowIndex && colIdx > maxColIndex)
          ) {
            maxRowIndex = rowIdx;
            maxColIndex = colIdx;
            lastCellId = cellId;
          }
        });
        if (lastCellId) {
          const [lastRowIndex, lastColField] = lastCellId.split("-");

          // Tìm cell element của ô cuối cùng
          const lastCellElement = gridWrapperRef.current?.querySelector(
            `[row-index="${lastRowIndex}"] .ag-cell[col-id="${lastColField}"]`,
          );

          if (lastCellElement && gridWrapperRef.current) {
            const rect = lastCellElement.getBoundingClientRect();
            const gridRect = gridWrapperRef.current.getBoundingClientRect();

            const newPosition = {
              top: rect.bottom - gridRect.top - 5,
              left: rect.right - gridRect.left - 5,
            };

            setFillHandlePosition(newPosition);
          }
        }
      }
    },
    [
      isDraggingFill,
      selectedCells,
      multiSelectionBounds,
      multiSelectionPattern,
      fillSourceCell,
      getColumnOrder,
      disableDragCopy,
      isTypeCompatible,
    ],
  );

  // Global mouse move handler cho auto-scroll và fill handle drag
  const handleGlobalMouseMove = useCallback(
    (event: MouseEvent) => {
      if (disableDragCopy) return;
      if (isDraggingFill || isSelecting) {
        handleAutoScrollByMousePosition(event.clientX, event.clientY);

        // Chỉ tính toán fill target cells, KHÔNG di chuyển fill handle
        if (isDraggingFill) {
          calculateFillTargetCells(event.clientX, event.clientY);
        }
      }
    },
    [
      isDraggingFill,
      isSelecting,
      handleAutoScrollByMousePosition,
      calculateFillTargetCells,
      disableDragCopy,
    ],
  );

  // Chỉ register mousemove ở đây — mouseup đã được register ở document listener bên dưới
  // Tránh duplicate mouseup handlers gây conflict khi editor đang mở
  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [handleGlobalMouseMove]);

  // Hàm xử lý sự kiện nhấn phím (Ctrl+C để sao chép các ô đã chọn)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Kiểm tra tổ hợp phím Ctrl+C
      if (
        (event.ctrlKey && event.key === "c") ||
        (event.metaKey && event.key === "c")
      ) {
        const clipboardData: string[] = [];
        const gridApi = gridRef.current?.api;
        if (!gridApi) return;

        try {
          // Lấy danh sách các cột theo thứ tự trong columnDefs
          const columnDefs = gridApi.getColumnDefs();
          if (!columnDefs) {
            // console.error("Column definitions are undefined.");
            return;
          }

          // Lọc và lấy `field` từ các đối tượng ColDef
          const columnOrder = (columnDefs as ColDef[])
            .filter(
              (colDef) =>
                colDef &&
                typeof colDef === "object" &&
                "field" in colDef &&
                !!colDef.field,
            )
            .map((colDef) => colDef.field as string);

          if (columnOrder.length === 0) {
            // console.warn("No valid column fields found in columnDefs");
            return;
          }

          // Parse và sắp xếp các ô đã chọn
          const sortedCells = Array.from(selectedCells).sort((a, b) => {
            const [rowA, colFieldA] = a.split("-");
            const [rowB, colFieldB] = b.split("-");

            // Kiểm tra giá trị hợp lệ
            if (!rowA || !rowB || !colFieldA || !colFieldB) return 0;

            const colIndexA = columnOrder.indexOf(colFieldA);
            const colIndexB = columnOrder.indexOf(colFieldB);

            // Xử lý trường hợp không tìm thấy cột
            if (colIndexA === -1 || colIndexB === -1) {
              return colIndexA === -1 ? 1 : -1; // Đẩy cột không tìm thấy xuống cuối
            }

            return rowA === rowB
              ? colIndexA - colIndexB
              : parseInt(rowA, 10) - parseInt(rowB, 10);
          });

          // Tạo cấu trúc dữ liệu clipboard
          const rowDataMap: { [key: number]: { [key: string]: string } } = {};

          sortedCells.forEach((cellId) => {
            const parts = cellId.split("-");
            if (parts.length !== 2) return;

            const [rowIndexString, colField] = parts;
            const rowIndex = parseInt(rowIndexString, 10);

            if (isNaN(rowIndex)) return;

            const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
            if (!rowNode || !rowNode.data) return;

            if (!rowDataMap[rowIndex]) {
              rowDataMap[rowIndex] = {};
            }

            // Xử lý dữ liệu của ô an toàn
            let cellValue = "";
            try {
              cellValue =
                rowNode.data[colField] !== undefined &&
                rowNode.data[colField] !== null
                  ? String(rowNode.data[colField]).replace(/\r/g, "").trim()
                  : "";
            } catch (err) {
              // console.warn(
              //   `Error processing cell value at ${rowIndex}-${colField}:`,
              //   err,
              // );
            }

            rowDataMap[rowIndex][colField] = cellValue;
          });

          // Chỉ xây dựng dữ liệu cho các ô đã chọn
          const rowKeys = Object.keys(rowDataMap)
            .map(Number)
            .sort((a, b) => a - b);

          rowKeys.forEach((rowKey) => {
            const row = rowDataMap[rowKey];
            const rowValues: string[] = [];

            // Đảm bảo sử dụng đúng thứ tự cột theo bảng hiện tại
            columnOrder.forEach((colField) => {
              if (
                sortedCells.some((cellId) => cellId === `${rowKey}-${colField}`)
              ) {
                rowValues.push(row[colField] || "");
              }
            });

            if (rowValues.length > 0) {
              clipboardData.push(rowValues.join("\t")); // Kết hợp các ô trong hàng bằng tab
            }
          });

          // Ghi dữ liệu vào clipboard
          if (clipboardData.length > 0) {
            navigator.clipboard
              .writeText(clipboardData.join("\n"))
              .then(() => {})
              .catch((err) => console.error("Copy failed!", err));
          }
        } catch (error) {
          console.error("Error processing clipboard data:", error);
        }
      }
    },
    [selectedCells],
  );
  const handleImportClick = useCallback(() => {
    // Close the dropdown after a short delay to allow the click event to complete
    setTimeout(() => {
      setImportDropdownOpen(false);
    }, 300);
  }, []);

  // Hàm xử lý khi scroll để cập nhật vị trí fill handle
  const handleScroll = useCallback(() => {
    if (
      fillHandleVisible &&
      !isDraggingFill &&
      !isSelecting &&
      selectedCells.size === 0
    ) {
      setFillSourceCell(null);
    }
  }, [fillHandleVisible, isDraggingFill, isSelecting, selectedCells.size]);

  // Hàm xử lý infinite scroll
  const handleInfiniteScroll = useCallback(() => {
    if (
      !enableInfiniteScroll ||
      !gridRef.current?.api ||
      !onLoadMore ||
      !hasMore ||
      isLoadingMore
    ) {
      return;
    }

    // THÊM: Không trigger infinite scroll khi đang trong cell/row selection operations
    if (isSelecting || isDraggingCells || isDraggingFill) {
      // console.log("Skipping infinite scroll during selection operations");
      return;
    }

    // THÊM: Debounce để tránh trigger quá nhiều lần
    if (infiniteScrollDebounceTimerRef.current) {
      clearTimeout(infiniteScrollDebounceTimerRef.current);
    }

    const timer = setTimeout(() => {
      // Lấy viewport của grid
      const gridViewport =
        gridWrapperRef.current?.querySelector(".ag-body-viewport");
      if (!gridViewport) return;

      const { scrollTop, scrollHeight, clientHeight } = gridViewport;
      const maxScrollTop = scrollHeight - clientHeight;
      const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      const distanceFromBottom = maxScrollTop - scrollTop;

      // Kích hoạt khi cuộn tới 70% chiều cao bảng hoặc còn cách đáy khoảng infiniteScrollThreshold
      if (
        scrollPercentage >= 0.7 ||
        distanceFromBottom <= infiniteScrollThreshold
      ) {
        // Tính trang tiếp theo dựa trên total
        const totalPages = total ? Math.ceil(total / pageSize) : 1;
        const nextPage = maxReachedPage + 1;

        if (nextPage <= totalPages) {
          // console.log("Triggering infinite scroll load more:", nextPage);
          setIsLoadingMore(true);
          setMaxReachedPage(nextPage);
          onLoadMore(nextPage, pageSize);

          // Reset loading state sau 1 giây (có thể tùy chỉnh)
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 1000);
        }
      }
      infiniteScrollDebounceTimerRef.current = null;
    }, 150); // Debounce 150ms

    infiniteScrollDebounceTimerRef.current = timer;
  }, [
    enableInfiniteScroll,
    onLoadMore,
    hasMore,
    isLoadingMore,
    infiniteScrollThreshold,
    total,
    pageSize,
    maxReachedPage,
    gridRef,
    isSelecting, // THÊM: Dependencies để check selection state
    isDraggingCells,
    isDraggingFill,
  ]);

  // Auto-reset mechanism để tránh bị stuck trong selection/drag state
  useEffect(() => {
    let resetTimeout: NodeJS.Timeout;

    if (isSelecting || isDraggingFill || isDraggingCells) {
      // Nếu state active quá lâu (3 giây), tự động reset
      resetTimeout = setTimeout(() => {
        // Chỉ auto-reset khi KHÔNG còn giữ chuột
        // để tránh cắt ngang thao tác đang diễn ra
        if (!isMouseDownRef.current) {
          // console.log("Auto-resetting stuck drag/selection state");
          forceResetAllStates();
        }
      }, 3000); // Giảm xuống 3 giây để phát hiện stuck nhanh hơn
    }

    return () => {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
    };
  }, [isSelecting, isDraggingFill, isDraggingCells, forceResetAllStates]);

  useEffect(() => {
    const documentMouseUpHandler = (event: MouseEvent) => {
      // LUÔN reset isMouseDownRef khi có bất kỳ mouseup nào
      isMouseDownRef.current = false;

      const target = event.target as HTMLElement;
      const isInsideGrid =
        gridWrapperRef.current?.contains(target) ||
        target?.closest?.(".ag-grid") ||
        target?.closest?.(".ag-root-wrapper");

      // Nếu mouseup xảy ra ngoài grid và đang có active drag/selection state
      if (!isInsideGrid) {
        const hasActiveState =
          isSelectingRef.current ||
          isDraggingFillRef.current ||
          isDraggingCells;

        if (hasActiveState) {
          // Force reset tất cả states để tránh bị stuck
          setTimeout(() => {
            forceResetAllStates();
          }, 50);
        }
      }
    };

    // Handler khi window mất focus (Alt+Tab, switch window, etc.)
    const handleWindowBlur = () => {
      if (
        isMouseDownRef.current ||
        isSelectingRef.current ||
        isDraggingFillRef.current
      ) {
        forceResetAllStates();
      }
    };

    // Handler khi tab bị ẩn
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        (isMouseDownRef.current ||
          isSelectingRef.current ||
          isDraggingFillRef.current)
      ) {
        forceResetAllStates();
      }
    };

    // Handler khi chuột rời khỏi document (chuột di chuyển quá nhanh ra ngoài)
    const handleMouseLeave = (event: MouseEvent) => {
      // Chỉ reset khi chuột thực sự rời khỏi window
      if (!event.relatedTarget && isMouseDownRef.current) {
        forceResetAllStates();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mouseup", handleMouseUp);

    // Thêm backup mouseup listener
    document.addEventListener("mouseup", documentMouseUpHandler, {
      capture: true,
    });

    // Thêm listeners cho các trường hợp đặc biệt
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Thêm scroll listener
    const gridElement = gridWrapperRef.current;
    if (gridElement) {
      gridElement.addEventListener("scroll", handleScroll);
    }

    let lastNativeClickTime = 0;
    let lastNativeCellId = "";

    const handleNativeMouseDown = (event: MouseEvent) => {
      const clickTarget = event.target as HTMLElement;
      const cellElement = clickTarget.closest(".ag-cell");
      if (!cellElement) return;

      const colId = cellElement.getAttribute("col-id");
      const rowElement = clickTarget.closest(".ag-row");
      if (!rowElement) return;
      const rowIndex = rowElement.getAttribute("row-index");

      const cellId = `${rowIndex}-${colId}`;
      const now = Date.now();
      const isDoubleClick =
        cellId === lastNativeCellId && now - lastNativeClickTime < 300;
      lastNativeClickTime = now;
      lastNativeCellId = cellId;

      if (isDoubleClick) {
        if (gridRef.current?.api) {
          const editingCells = gridRef.current.api.getEditingCells();
          if (editingCells && editingCells.length > 0) {
            event.stopPropagation();
          }
        }
      }
    };

    if (gridElement) {
      gridElement.addEventListener("mousedown", handleNativeMouseDown, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseup", documentMouseUpHandler, {
        capture: true,
      });

      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("mouseleave", handleMouseLeave);

      if (gridElement) {
        gridElement.removeEventListener("scroll", handleScroll);
        gridElement.removeEventListener(
          "mousedown",
          handleNativeMouseDown,
          true,
        );
      }

      // Cleanup auto-scroll interval khi component unmount
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [
    selectedCells,
    handleKeyDown,
    isDraggingFill,
    isDraggingCells,
    fillSourceCell,
    fillTargetCells,
    handleScroll,
    forceResetAllStates,
  ]);

  // Thêm global mouse move listener cho auto-scroll và fill handle drag
  useEffect(() => {
    if (isDraggingFill || isSelecting) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [isDraggingFill, isSelecting, handleGlobalMouseMove]);

  // useEffect cho infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll) return;

    const gridViewport =
      gridWrapperRef.current?.querySelector(".ag-body-viewport");
    if (!gridViewport) return;

    gridViewport.addEventListener("scroll", handleInfiniteScroll);

    return () => {
      gridViewport.removeEventListener("scroll", handleInfiniteScroll);
      // THÊM: Cleanup debounce timer khi component unmount
      if (infiniteScrollDebounceTimerRef.current) {
        clearTimeout(infiniteScrollDebounceTimerRef.current);
        infiniteScrollDebounceTimerRef.current = null;
      }
    };
  }, [enableInfiniteScroll, handleInfiniteScroll]);

  // useEffect để đảm bảo fill handle luôn hiển thị khi có ô được chọn
  useEffect(() => {
    if (selectedCells.size > 0 && !fillHandleVisible && fillSourceCell) {
      // Nếu có ô được chọn nhưng fill handle không hiển thị, hiển thị lại (chỉ nếu editable)
      if (isColumnEditable(fillSourceCell.colField)) {
        const cellElement = gridWrapperRef.current?.querySelector(
          `[row-index="${fillSourceCell.rowIndex}"] .ag-cell[col-id="${fillSourceCell.colField}"]`,
        );
        if (cellElement && gridWrapperRef.current) {
          const rect = cellElement.getBoundingClientRect();
          const gridRect = gridWrapperRef.current.getBoundingClientRect();
          setFillHandlePosition({
            top: rect.bottom - gridRect.top - 5,
            left: rect.right - gridRect.left - 5,
          });
          setFillHandleVisible(true);
        }
      }
    }
  }, [selectedCells.size, fillHandleVisible, fillSourceCell, isColumnEditable]);

  // FIX: Sync selectedCells → ref và trigger refreshCells
  // QUAN TRỌNG: Kiểm tra edit mode trước khi gọi refreshCells({ force: true })
  // vì force=true sẽ destroy và recreate cell components — bao gồm cả cell editors đang mở!
  useEffect(() => {
    selectedCellsRef.current = selectedCells;
    if (gridRef.current?.api) {
      const editing = gridRef.current.api.getEditingCells();
      if (!editing || editing.length === 0) {
        gridRef.current.api.refreshCells({ suppressFlash: true });
      }
    }
  }, [selectedCells]);

  useEffect(() => {
    fillTargetCellsRef.current = fillTargetCells;
    if (gridRef.current?.api) {
      const editing = gridRef.current.api.getEditingCells();
      if (!editing || editing.length === 0) {
        gridRef.current.api.refreshCells({ suppressFlash: true });
      }
    }
  }, [fillTargetCells]);

  // Theme removed as per request

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: columnFlex,
      editable: true,
      resizable: true,
      sortable: true,
      filter: enableFilter,
      suppressHeaderMenuButton: true,
      singleClickEdit: false, // false = phải double-click mới vào edit mode
      // FIX: Tắt auto cell data type inference của AG Grid v33+
      // AG Grid tự detect type từ data (number/boolean/date) rồi validate khi edit
      // → nếu editor trả về string cho cột number → "Data type mismatch" → cancel edit
      cellDataType: false,
      cellStyle: (params: any): CellStyle => {
        const cellId = `${params.rowIndex}-${params.colDef.field}`;
        // Đọc từ ref — defaultColDef không rebuild khi selection thay đổi
        if (selectedCellsRef.current.has(cellId)) {
          return {
            backgroundColor: "#d3ebf5",
            border: "2px solid #0078d7",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          };
        }
        if (fillTargetCellsRef.current.has(cellId)) {
          return {
            backgroundColor: "rgba(0, 120, 215, 0.2)",
            border: "1px dashed #0078d7",
            fontWeight: "normal",
            display: "flex",
            alignItems: "center",
          };
        }
        return {
          backgroundColor:
            theme === "dark" ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.8)",
          border: "1px solid #b9e7f8",
          fontWeight: "normal",
          display: "flex",
          alignItems: "center",
        };
      },
      cellClass: (params: any) => {
        const cellId = `${params.rowIndex}-${params.colDef.field}`;
        if (selectedCellsRef.current.has(cellId)) return "selected-cell";
        if (fillTargetCellsRef.current.has(cellId)) return "fill-target";
        return "";
      },
    }),
    [columnFlex, enableFilter, theme], // selectedCells/fillTargetCells đã chuyển sang ref + refreshCells
  );

  const extendedColumnDefs: ColDef[] = useMemo(() => {
    const processedColumnDefs = processColumnDefs(columnDefs);
    if (!showSTT) {
      return processedColumnDefs;
    }

    const sttColumn: ColDef = {
      headerName: "",
      field: "__stt",
      cellRenderer: (params: any) => {
        if (params.data?.isError) {
          return <ErrorCellRenderer {...params} />;
        }

        // Tối ưu: Sử dụng rowIndex thay vì lặp qua tất cả các node
        if (params.node && params.node.rowIndex != null) {
          const index = params.node.rowIndex;
          // Nếu có server-side pagination (có onChangePage), tính STT từ trang hiện tại
          if (onChangePage && (!isFiltered || suppressClientFilter)) {
            return (currentPage - 1) * pageSize + index + 1;
          }
          // Client-side pagination hoặc filtered data
          return index + 1;
        }

        return "";
      },
      width: 70,
      pinned: "left",
      lockPosition: true,
      editable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      resizable: false,
      cellStyle: (params: CellClassParams<any>): CellStyle => {
        if (params.data.isSaved) {
          return {
            backgroundColor: "#8bd8f4",
            textAlign: "center",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          };
        } else if (params.data.isError) {
          return {
            backgroundColor: "#efb008",
            textAlign: "center",
            cursor: "pointer",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          };
        }
        return {
          backgroundColor: "#e6f7ff",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };
      },
      tooltipValueGetter: (params) => {
        const errorMessages = params?.data?.errorMessages;

        // If no errorMessages, return empty string
        if (errorMessages === undefined || errorMessages === null) return "";

        // Normalize to string. If it's an array join with newlines.
        let msgString: string;
        if (Array.isArray(errorMessages)) {
          msgString = errorMessages.join("\n");
        } else if (typeof errorMessages === "string") {
          msgString = errorMessages;
        } else {
          // Fallback: check for message property or coerce to string safely
          if (
            typeof errorMessages === "object" &&
            (errorMessages as any)?.message
          ) {
            msgString = (errorMessages as any).message;
          } else {
            try {
              msgString = String(errorMessages);
            } catch {
              return "";
            }
          }
        }

        const formattedMessage = msgString
          .split(/\r?\n/)
          .map((line: string) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("-")) {
              return trimmed.replace(/^-/, "• ");
            }
            return trimmed;
          })
          .join("\n");

        return formattedMessage;
      },
      tooltipComponent: "CustomTooltip",
      getQuickFilterText: () => "",
    };

    return [sttColumn, ...processedColumnDefs];
  }, [columnDefs, showSTT, currentPage, pageSize, onChangePage, isFiltered]);

  // Giữ onFilterChanged để refresh STT khi filter thay đổi
  const onFilterChanged = useCallback(() => {
    if (gridRef.current?.api) {
      // Refresh STT column sau khi filter
      setTimeout(() => {
        if (!gridRef.current?.api) return;
        const editing = gridRef.current.api.getEditingCells();
        if (!editing || editing.length === 0) {
          gridRef.current.api.refreshCells({
            columns: ["__stt"],
            force: true,
            suppressFlash: true,
          });
        }
      }, 50);
    }
  }, []);

  // Thêm onModelUpdated để tự động cập nhật STT khi data thay đổi (thêm/xóa dòng)
  const onModelUpdated = useCallback(() => {
    if (gridRef.current?.api) {
      const editing = gridRef.current.api.getEditingCells();
      if (!editing || editing.length === 0) {
        gridRef.current.api.refreshCells({
          columns: ["__stt"],
          force: true,
          suppressFlash: true,
        });
      }
    }
  }, []);

  // Register the custom components
  const mergedGridOptions = useMemo(() => {
    return {
      ...gridOptions,
      components: {
        ...gridOptions.components,
        CustomTooltip: CustomTooltip,
        ErrorCellRenderer: ErrorCellRenderer,
      },
      tooltipShowDelay: 0,
      tooltipMouseTrack: true,
      suppressScrollOnNewData: true,
      suppressAnimationFrame: true,
      suppressRowTransform: true,
    };
  }, [gridOptions]);

  // Add useEffect to handle loading state changes
  useEffect(() => {
    if (gridRef.current?.api) {
      // Khi đang load data do infinite scroll hoặc đang quicksearch, không show loading overlay chính
      if (
        loading &&
        (!enableInfiniteScroll || !isLoadingMore) &&
        !isQuicksearching
      ) {
        gridRef.current.api.showLoadingOverlay();
      } else {
        gridRef.current.api.hideOverlay();
      }
    }
  }, [loading, isLoadingMore, enableInfiniteScroll, isQuicksearching, gridRef]);

  // Custom selection changed handler that preserves scroll position
  const handleSelectionChanged = useCallback(() => {
    // Chỉ block khi đang drag fill hoặc đang actively drag cells
    // Không block khi chỉ có isSelecting = true (single click)
    if (isDraggingFill || isDraggingCells) {
      // console.log("Blocking selection changed due to drag operation");
      return;
    }

    if (gridRef.current?.api) {
      // const selectedRows = gridRef.current.api.getSelectedRows();
      const viewport = gridRef.current.api.getVerticalPixelRange();
      // Gọi callback của parent để cập nhật state rowSelected
      if (onSelectionChanged) {
        // Delay callback để AG Grid hoàn thành selection process trước
        setTimeout(() => {
          onSelectionChanged();
        }, 10);
      }

      // SỬA: Không gọi ensureIndexVisible khi infinite scroll đang hoạt động
      // để tránh conflict giữa selection và infinite loading
      if (viewport && !enableInfiniteScroll && !isLoadingMore) {
        setTimeout(() => {
          if (gridRef.current?.api) {
            gridRef.current.api.ensureIndexVisible(
              Math.floor(viewport.top / 40),
              "top",
            );
          }
        }, 10);
      }
    }

    if (selectedCells.size > 0 && !fillHandleVisible && fillSourceCellInfo) {
      // Chỉ hiển thị fill handle nếu cột editable
      if (isColumnEditable(fillSourceCellInfo.colField)) {
        setFillHandleVisible(true);
      }
    }
  }, [
    onSelectionChanged,
    selectedCells,
    fillHandleVisible,
    fillSourceCellInfo,
    isDraggingFill,
    isDraggingCells,
    isColumnEditable,
    enableInfiniteScroll,
    isLoadingMore,
  ]);

  // Add scroll position preservation for grid updates
  useEffect(() => {
    if (gridRef.current?.api) {
      const api = gridRef.current.api;

      // Store scroll position in a ref to avoid accessing internal properties
      const scrollPositionRef = { current: 0 };

      // Restore scroll position after grid operation
      const restoreScrollPosition = () => {
        if (scrollPositionRef.current > 0) {
          setTimeout(() => {
            api.ensureIndexVisible(
              Math.floor(scrollPositionRef.current / 40),
              "top",
            );
          }, 50);
        }
      };

      // Add event listeners to preserve scroll position
      const handleAfterRefresh = () => {
        restoreScrollPosition();
      };

      // Listen for grid events that might cause scroll jumping
      api.addEventListener("modelUpdated", handleAfterRefresh);
      api.addEventListener("rowDataUpdated", handleAfterRefresh);

      return () => {
        api.removeEventListener("modelUpdated", handleAfterRefresh);
        api.removeEventListener("rowDataUpdated", handleAfterRefresh);
      };
    }
  }, []);

  const overlayLoadingTemplate = `
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.95);
      z-index: 1000;
    ">
      <div style="
        display: flex;
        gap: 4px;
        margin-bottom: 20px;
        font-family: 'Roboto', sans-serif;
        font-weight: bold;
        font-size: 32px;
        color: #1890ff;
      ">
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0s;">V</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.1s;">T</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.2s;">O</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.3s;">S</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.4s;">-</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.5s;">P</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.6s;">R</span>
        <span style="animation: letter-bounce 1.4s ease-in-out infinite 0.7s;">O</span>
      </div>
      <div style="
        font-size: 16px;
        color: #666;
        font-weight: 500;
        font-family: 'Roboto', sans-serif;
      ">Đang tải dữ liệu...</div>
    </div>
    <style>
      @keyframes letter-bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
    </style>
  `;

  // Đồng bộ với prop rowHeight của AgGridReact (bên dưới đặt 40)
  const rowHeight = 40;

  // Function to handle Excel export
  const handleExportExcel = useCallback(() => {
    if (!gridRef.current?.api) {
      return;
    }

    // Get the current visible data from the grid
    const dataToExport =
      isFiltered && !suppressClientFilter ? filteredData : rowData;

    // Format data to display labels instead of values for select columns and handle boolean columns
    const formattedData = dataToExport.map((row) => {
      const formattedRow = { ...row };

      // Process select columns to show labels instead of values
      columnDefs.forEach((col) => {
        const fieldName = col.field;
        const fieldValue = formattedRow[fieldName!];

        const selectOptions =
          col.context?.selectOptions ||
          (col as any).selectOptions ||
          (col as any).selectOption;
        if (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== "" &&
          selectOptions
        ) {
          const option = selectOptions.find(
            (opt: any) => opt.value === fieldValue,
          );
          if (option && option.label !== undefined && option.label !== null) {
            formattedRow[fieldName!] = option.label;
          }
        }

        // Process boolean columns to show "True"/"False" instead of true/false
        if (
          (col as any)?.type === "boolean" &&
          formattedRow[fieldName!] !== undefined
        ) {
          formattedRow[fieldName!] = formattedRow[fieldName!]
            ? "True"
            : "False";
        }
      });

      return formattedRow;
    });
    const columnsForExport = columnDefs.map((col) => ({
      field: col.field,
      headerName: col.headerName || col.field || "",
      headerClass: col.headerClass, // Include headerClass for preserving required field indicators
      valueFormatter: col.valueFormatter, // Include valueFormatter for proper data display
    }));

    // Use the excelUtils to export the data
    excelUtils.exportToExcelSimple({
      columns: columnsForExport,
      data: formattedData,
      fileName: `${exportFileName}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
      decorated: exportDecorated,
    });
  }, [
    isFiltered,
    suppressClientFilter,
    filteredData,
    rowData,
    columnDefs,
    exportFileName,
    exportDecorated,
  ]);

  const searchedData = useMemo(() => {
    let data = isFiltered && !suppressClientFilter ? filteredData : rowData;

    // Apply client-side quick filter in React if onQuicksearch is not provided
    if (searchText && !onQuicksearch) {
      data = data.filter((row) => {
        return columnDefs.some((col) => {
          const field = col.field;
          if (!field) return false;
          const value = row[field];

          const selectOptions =
            col.context?.selectOptions ||
            (col as any).selectOptions ||
            (col as any).selectOption;

          let cellText = value;
          if (selectOptions) {
            const option = selectOptions.find((opt: any) => opt.value === value);
            cellText = option ? option.label : value;
          }

          return String(cellText || "")
            .toLowerCase()
            .includes(searchText.toLowerCase());
        });
      });
    }
    return data;
  }, [
    isFiltered,
    suppressClientFilter,
    filteredData,
    rowData,
    searchText,
    onQuicksearch,
    columnDefs,
  ]);

  const pagedData = useMemo(() => {
    const data = searchedData;

    // Infinite scroll mode: chỉ khi có onLoadMore callback, hiển thị tất cả dữ liệu từ trang 1 đến maxReachedPage
    // Nếu không có onLoadMore thì hoạt động như pagination bình thường
    if (enableInfiniteScroll && onLoadMore && !onChangePage) {
      const maxItems = maxReachedPage * pageSize;
      return data.slice(0, Math.max(maxItems, data.length));
    }

    // Chỉ slice data khi không có onChangePage callback (client-side pagination)
    // Nếu có onChangePage callback thì server đã xử lý pagination rồi
    if (pagination && !onChangePage) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return data.slice(start, end);
    }
    return data;
  }, [
    searchedData,
    enableInfiniteScroll,
    onLoadMore,
    onChangePage,
    maxReachedPage,
    pageSize,
    pagination,
    currentPage,
  ]);

  // Tính chiều cao grid dựa trên dữ liệu đang hiển thị (pagedData)
  const gridHeight = useMemo(() => {
    const dataLen = pagedData.length;

    // Chiều cao header (mặc định ~45px với theme Quartz nếu không truyền)
    const headerPx = typeof headerHeight === "number" ? headerHeight : 45;

    if (dataLen === 0) {
      return typeof minHeightEmpty === "number"
        ? headerPx + rowHeight * minHeightEmpty
        : 200;
    }

    // Tính số dòng hiển thị dựa trên maxRowsVisible
    const visibleRows = Math.min(
      dataLen,
      Math.max(1, Math.floor(maxRowsVisible)),
    );

    // Chiều cao phần body (các dòng)
    const bodyHeight = Math.max(rowHeight, visibleRows * rowHeight);

    // Tổng chiều cao = header + body
    return headerPx + bodyHeight;
  }, [pagedData.length, maxRowsVisible, rowHeight, headerHeight]);

  const pageSizeOptions = useMemo(() => {
    const baseOptions = ["20", "50", "100", "500", "1000"];
    const apiTotal = typeof total === "number" ? total : rowData.length;
    if (apiTotal > 1000) {
      const roundedToThousand = Math.ceil(apiTotal / 1000) * 1000;
      return [...baseOptions, String(roundedToThousand)];
    }
    return baseOptions;
  }, [total, rowData.length]);

  useEffect(() => {
    // Only call onQuicksearch here, as state updates are now handled in render phase
    if (onQuicksearch) {
      onQuicksearch(searchText, selectedFilterColumns, filterValues, pageSize);
    }
  }, [
    selectedFilterColumns,
    searchText,
    filterValues,
    pageSize,
    onQuicksearch,
  ]);

  // Wrapper function để debug row clicks
  const handleRowClickWithDebug = useCallback(
    (event: any) => {
      // FIX: Nếu đang edit một row KHÁC, dừng editing trước
      // (vì stopEditingWhenCellsLoseFocus=false, phải tự quản lý)
      if (gridRef.current?.api) {
        const editingCells = gridRef.current.api.getEditingCells();
        if (
          editingCells &&
          editingCells.length > 0 &&
          editingCells[0].rowIndex !== event.rowIndex
        ) {
          gridRef.current.api.stopEditing();
        }
      }
      if (onRowClicked) {
        onRowClicked(event);
      }
    },
    [
      onRowClicked,
      enableInfiniteScroll,
      isSelecting,
      isDraggingCells,
      isDraggingFill,
    ],
  );

  // Handler double-click vào cell — log để theo dõi và forward cho prop
  const handleCellDoubleClicked = useCallback((event: any) => {}, []);

  const handleSave = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.stopEditing();
    }
    // Small timeout to allow onCellValueChanged to update parent state before onSave is called
    // We use onSaveRef.current to ensure we call the latest version of onSave that has updated closure state
    setTimeout(() => {
      if (onSaveRef.current) {
        onSaveRef.current();
      }
    }, 150);
  }, [gridRef]);

  return (
    <div>
      {showSearch || showActionButtons ? (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "top",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "left",
                gap: "10px",
                marginBottom: `${showActionButtons ? "0px" : "10px"}`,
              }}
            >
              {showSearch && (
                <InputSearch
                  {...inputSearchProps}
                  gridRef={gridRef}
                  isFiltered={isFiltered}
                  onFilterClick={handleOpenFilterModal}
                  enableFilterButton={enableFilter}
                  onInputValueChange={(setValue: string) => {
                    setSearchText(setValue);
                  }}
                  onResetFilter={handleResetFilters}
                  filterCount={selectedFilterColumns.length}
                />
              )}
              {isFiltered && filterValues && (
                <div
                  className="filter-summary-container"
                  onClick={handleResetFilters}
                >
                  <Tooltip title={filterValues} placement="bottom">
                    <div className="filter-summary">
                      <strong
                        className="filter-text"
                        style={{ cursor: "pointer" }}
                      >
                        Lọc bởi:{" "}
                      </strong>
                      <strong
                        className="remove-filter"
                        style={{ cursor: "pointer" }}
                      >
                        Xóa lọc
                      </strong>
                      <span>
                        {filterValues.length > 100
                          ? `${filterValues.substring(0, 50)}...`
                          : filterValues}
                      </span>
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>

            {showActionButtons && (
              <ActionButtons {...actionButtonsProps} onSave={handleSave} />
            )}
          </div>
        </div>
      ) : (
        ""
      )}

      <div
        ref={gridWrapperRef}
        onMouseUp={handleMouseUp}
        style={{
          position: "relative",
          height: `${gridHeight}px`,
          minHeight: pagedData.length === 0 ? `${gridHeight}px` : "260px",
          width: "100%",
          overflowY: "hidden",
          overflowX: "hidden", // Để AG Grid tự quản lý scroll ngang
          scrollBehavior: "auto", // Prevent smooth scrolling that can cause jumping
        }}
        className={
          theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz"
        } // Áp dụng theme dựa trên trạng thái
      >
        <AgGridReact
          ref={gridRef}
          getRowId={useCallback((params: any) => {
            const id = getItemId(params.data);
            if (id) return String(id);
            if (!fallbackMapRef.current.has(params.data)) {
              fallbackMapRef.current.set(
                params.data,
                Math.random().toString(36).substring(2, 9),
              );
            }
            return fallbackMapRef.current.get(params.data) as string;
          }, [])}
          rowData={pagedData}
          quickFilterText={onQuicksearch ? undefined : searchText}
          onRowSelected={onRowSelected}
          columnDefs={extendedColumnDefs}
          defaultColDef={defaultColDef}
          editType={editType === "cell" ? undefined : editType}
          pivotMode={pivotMode}
          onRowDoubleClicked={onRowDoubleClicked}
          onCellDoubleClicked={handleCellDoubleClicked}
          onCellValueChanged={useCallback((event: any) => {
            if (onCellValueChangedRef.current) {
              onCellValueChangedRef.current(event);
            }
          }, [])}
          onCellEditingStarted={useCallback((event: any) => {
            if (onCellEditingStartedRef.current) {
              onCellEditingStartedRef.current(event);
            }
          }, [])}
          onSelectionChanged={handleSelectionChanged}
          onCellMouseDown={handleMouseDown}
          onCellClicked={useCallback(
            (event: any) => {
              // KHÔNG xử lý khi đang edit
              if (gridRef.current?.api) {
                const editingCells = gridRef.current.api.getEditingCells();
                if (editingCells && editingCells.length > 0) {
                  if (onCellClicked) {
                    onCellClicked(event);
                  }
                  return;
                }
              }
              showFillHandle(event);
              if (onCellClicked) {
                onCellClicked(event);
              }
            },
            [showFillHandle, onCellClicked, gridRef],
          )}
          onCellFocused={useCallback(
            (event: any) => {
              // KHÔNG xử lý khi đang edit
              if (gridRef.current?.api) {
                const editingCells = gridRef.current.api.getEditingCells();
                if (editingCells && editingCells.length > 0) {
                  return;
                }
              }
              // Chỉ hiển thị fill handle khi focus nếu không đang trong trạng thái selection hoặc drag
              if (!isSelecting && !isDraggingFill) {
                // CellFocusedEvent does NOT include colDef/data — enrich it from the grid API
                const enriched: any = { ...event };
                if (
                  enriched.colDef == null &&
                  enriched.column != null &&
                  gridRef.current?.api
                ) {
                  const col = gridRef.current.api.getColumn(
                    enriched.column as any,
                  );
                  if (col) {
                    enriched.colDef = col.getColDef();
                  }
                  if (enriched.rowIndex != null) {
                    const node = gridRef.current.api.getDisplayedRowAtIndex(
                      enriched.rowIndex,
                    );
                    if (node) {
                      enriched.data = node.data;
                    }
                  }
                }
                showFillHandle(enriched);
              }
            },
            [isSelecting, isDraggingFill, showFillHandle, gridRef],
          )}
          onRowEditingStopped={useCallback(
            (event: any) => {
              // After a row exits edit mode (e.g. CheckboxCellEditor closing),
              // the cell DOM has been recreated. Re-query and re-show the fill handle.
              if (fillSourceCellInfo && !isDraggingFill) {
                setTimeout(() => {
                  const freshEl = getFreshCellElement(
                    fillSourceCellInfo.rowIndex,
                    fillSourceCellInfo.colField,
                  );
                  if (freshEl && gridWrapperRef.current) {
                    const rect = freshEl.getBoundingClientRect();
                    const gridRect =
                      gridWrapperRef.current.getBoundingClientRect();
                    if (rect.width > 0) {
                      setFillHandlePosition({
                        top: rect.bottom - gridRect.top - 5,
                        left: rect.right - gridRect.left - 5,
                      });
                      setFillHandleVisible(true);
                    }
                  }
                }, 50); // Small delay to let AG Grid finish re-rendering the row
              }
            },
            [
              fillSourceCellInfo,
              isDraggingFill,
              getFreshCellElement,
              setFillHandlePosition,
              setFillHandleVisible,
            ],
          )}
          onCellMouseOver={handleMouseOver}
          getRowStyle={getRowStyle}
          rowSelection={{
            mode: rowSelection === "multiple" ? "multiRow" : "singleRow",
            enableClickSelection: false,
            checkboxes: showCheckboxSelection,
            enableSelectionWithoutKeys: rowMultiSelectWithClick,
          }}
          domLayout={domLayout as "normal" | "autoHeight" | "print"}
          rowHeight={40}
          headerHeight={headerHeight}
          stopEditingWhenCellsLoseFocus={false}
          suppressClickEdit={true}
          gridOptions={mergedGridOptions}
          reactiveCustomComponents={true}
          tooltipShowDelay={0}
          pinnedBottomRowData={pinnedBottomRowData}
          animateRows={true}
          onFilterChanged={onFilterChanged}
          onModelUpdated={onModelUpdated}
          getRowClass={getRowClass}
          onRowClicked={handleRowClickWithDebug}
          // sideBar={sideBar}
          suppressColumnMoveAnimation={true}
          suppressScrollOnNewData={true}
          onColumnHeaderClicked={onColumnHeaderClicked}
          onGridReady={(params) => {
            // Configure tooltip parameters directly on the API for immediate effect
            params.api.setGridOption("tooltipShowDelay", 0);

            // Apply loading overlay immediately if needed
            // if (loading) {
            //   // Small delay to ensure grid is ready
            //   setTimeout(() => {
            //     params.api.showLoadingOverlay();
            //   }, 50);
            // } else {
            //   params.api.hideOverlay();
            // }

            // Store original row data for filtering (only if not already in filtered state)
            if (!isFiltered && originalRowData.length === 0) {
              setOriginalRowData([...rowData]);
            }

            // Preserve scroll position when grid is ready
            const viewport = params.api.getVerticalPixelRange();
            if (viewport) {
              params.api.ensureIndexVisible(
                Math.floor(viewport.top / 40),
                "top",
              );
            }

            if (onGridReady) {
              onGridReady(params);
            }
          }}
          overlayLoadingTemplate={overlayLoadingTemplate} // Updated loading template
          overlayNoRowsTemplate={`<span style="font-size: 16px; color: #666;">Không có dữ liệu</span>`} // Thêm nội dung khi không có dữ liệu
        />

        {/* Fill Handle */}
        {!disableDragCopy &&
          fillHandleVisible &&
          fillHandlePosition.top !== undefined &&
          fillHandlePosition.left !== undefined &&
          fillSourceCellInfo &&
          fillSourceCellInfo.isEditable && (
            <div
              key={`${fillHandlePosition.top}-${fillHandlePosition.left}`} // Force re-render khi vị trí thay đổi
              className={`fill-handle ${
                isAutoScrolling ? "auto-scrolling" : ""
              }`}
              style={{
                position: "absolute",
                top: `${fillHandlePosition.top}px`,
                left: `${fillHandlePosition.left}px`,
                cursor: "crosshair",
                transform: "translate3d(0, 0, 0)",
                willChange: "transform",
              }}
              onMouseDown={handleFillMouseDown}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!fillHandleVisible) {
                  setFillHandleVisible(true);
                }
              }}
            />
          )}
      </div>

      {/* Footer area with export button and row count */}
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          {showExportExcel && (
            <Tooltip title="Xuất Excel" placement="top">
              <FileSpreadsheet
                size={24}
                onClick={handleExportExcel}
                style={{ cursor: "pointer" }}
              />
            </Tooltip>
          )}
          {importComponent && (
            <Dropdown
              menu={{ items: [] }}
              dropdownRender={() => (
                <div
                  className="dark-dropdown-content"
                  style={{
                    padding: "8px",
                    background: "#fff",
                    borderRadius: "2px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                  onClick={handleImportClick}
                >
                  {importComponent}
                </div>
              )}
              trigger={["click"]}
              open={importDropdownOpen}
              onOpenChange={setImportDropdownOpen}
            >
              <Tooltip title="Nhập dữ liệu">
                <Upload
                  size={24}
                  style={{
                    cursor: "pointer",
                  }}
                />
              </Tooltip>
            </Dropdown>
          )}
        </div>

        {pagination && !enableInfiniteScroll && (
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={
              typeof total === "number" && total > 0
                ? total
                : searchedData.length
            }
            showSizeChanger
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
              // Chỉ gọi onChangePage khi không trong filtered state (server-side pagination)
              if (onChangePage && !isFiltered) {
                onChangePage(page, size);
              }
            }}
            locale={{
              items_per_page: "dòng/trang",
              jump_to: "Đi đến",
              page: "",
              prev_page: "Trang trước",
              next_page: "Trang sau",
            }}
            showQuickJumper
            pageSizeOptions={pageSizeOptions}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} / ${total} dòng`
            }
          />
        )}

        {/* Infinite Scroll Info */}
        {enableInfiniteScroll && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <div>
              {`Hiển thị: ${pagedData.length}`}
              {total && ` / ${total} tổng`}
              {/* {hasMore && ` (cuộn để tải thêm)`} */}
            </div>
          </div>
        )}

        {!pagination && !enableInfiniteScroll && (
          <div>
            {(() => {
              const resolvedTotal =
                typeof total === "number" && total > 0
                  ? total
                  : isFiltered && !suppressClientFilter
                    ? filteredData.length
                    : rowData.length;
              return (
                <div style={{ fontWeight: "bold" }}>
                  {`Tổng số dòng: ${resolvedTotal} `}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterArrayModal
        isOpen={showFilterModal}
        onClose={handleCloseFilterModal}
        onApplyFilter={handleApplyFilter}
        columns={columnDefs
          .filter(
            (col) =>
              col.field && col.field !== "id" && typeof col.field === "string",
          )
          .map((col) => ({
            field: col.field as string,
            headerName: col.headerName || (col.field as string),
          }))}
        initialSelectedColumns={selectedFilterColumns}
        initialFilterValues={filterValues}
        theme={theme || "light"}
      />
    </div>
  );
};

export default AgGridComponent;
