/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CellClickedEvent,
  CellEditingStartedEvent,
  CellValueChangedEvent,
  ColDef,
  RowDoubleClickedEvent,
} from "@ag-grid-community/core";
import { InputSearchProps } from "../InputSearch";
import { ActionButtonsProps } from "../action-button";
import { SelectOption } from "@/models/enums";
export interface ExtendedColDef extends ColDef {
  typeColumn?:
    | "Select"
    | "Text"
    | "Number"
    | "Date"
    | "Time"
    | "Checkbox"
    | "CODE"
    | "ContainerNo"; // Add other types as needed
  selectOptions?: SelectOption[]; // Options for Select type
  selectOption?: SelectOption[]; // Alias for selectOptions to prevent typos
  uppercase?: boolean; // Auto-uppercase cell value on edit
  allowSpecialCharacters?: boolean; // If true, skips special character filtering
  allowedSpecialChars?: string[]; // Array of specifically allowed special characters
  isNumber?: boolean; // If true, only allows numbers and allowedSpecialChars
}
export interface AgGridComponentProps {
  rowData: any[];
  columnDefs: ExtendedColDef[];
  onCellValueChanged?: (event: CellValueChangedEvent) => void; //Edit table
  onCellEditingStarted?: (event: CellEditingStartedEvent) => void; //Edit table
  onCellClicked?: (event: CellClickedEvent) => void;
  onRowDoubleClicked?: (event: RowDoubleClickedEvent) => void;
  onSelectionChanged?: () => void; // Add onSelectionChanged prop
  // gridRef: React.RefObject<AgGridReact | null>;
  gridRef: any;
  maxRowsVisible?: number; // Prop to limit the number of visible rows
  minHeightEmpty?: number; // Prop to adjust grid height when no data is present
  columnFlex?: number; // New prop to allow users to define flex
  rowSelection?: "single" | "multiple";
  rownumber?: boolean;
  gridOptions?: any;
  pinnedBottomRowData?: any[];
  getRowStyle?: any;
  headerHeight?: any;
  sideBar?: any;
  onGridReady?: (params: any) => void; // Thêm prop onGridReady
  loading?: boolean; // Prop để quản lý trạng thái loading
  enableFilter?: boolean;
  showSTT?: boolean; // Add new prop to control STT visibility
  showCheckboxSelection?: boolean; // Prop to show/hide checkbox selection column
  pivotMode?: boolean;
  defaultColDef?: ColDef;
  onRowSelected?: (event: any) => void;
  onColumnHeaderClicked?: (event: any) => void;
  domLayout?: string;
  onRowClicked?: (event: any) => void;
  getRowClass?: (params: any) => string;
  // Search feature controls
  showSearch?: boolean;
  // Instead of listing individual props, use InputSearchProps for search component
  inputSearchProps?: Partial<InputSearchProps>;
  onFillChanges?: (changes: any) => void; // Callback for drag-to-copy changes
  // Action buttons controls and props
  showActionButtons?: boolean;
  actionButtonsProps?: Partial<ActionButtonsProps>;

  // Export Excel properties
  showExportExcel?: boolean;
  exportFileName?: string;
  exportDecorated?: boolean;
  importComponent?: React.ReactNode;
  pagination?: boolean;
  paginationPageSize?: number;
  paginationCurrentPage?: number;
  onChangePage?: (page: number, pageSize: number) => void;
  onQuicksearch?: (
    searchText: string,
    showFilterModal: any[],
    filterValues: string,
    pageSize: number,
  ) => void; // Thêm prop onQuicksearch để xử lý tìm kiếm nhanh
  total?: number; // Thêm prop total để custom tổng số dòng
  disablePaste?: boolean; // Prop để tạm thời vô hiệu hóa paste handler
  // Infinite scroll props
  enableInfiniteScroll?: boolean; // Bật tính năng infinite scroll
  onLoadMore?: (currentPage: number, pageSize: number) => void; // Callback khi cần load thêm dữ liệu
  hasMore?: boolean; // Có còn dữ liệu để load thêm hay không
  infiniteScrollThreshold?: number; // Khoảng cách từ cuối để trigger load more (default: 100px)
  // Drag-to-copy (fill handle) control
  disableDragCopy?: boolean; // Vô hiệu hóa tính năng kéo để copy
  editType?: "fullRow" | "cell";
  // Row selection behavior
  rowMultiSelectWithClick?: boolean; // Cho phép chọn nhiều row bằng click thường (không cần Ctrl)
  suppressClientFilter?: boolean; // Nếu true, khi applyFilters sẽ không filter data cục bộ mà chỉ truyền giá trị ra onQuicksearch
  theme?: "light" | "dark";
}
