import React, { useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import CButton from "../../ui/Cbutton";
import CInput, { CTextArea } from "../../ui/CInput";
import CCheckbox from "../../ui/CCheckbox";
import { X } from "lucide-react";

interface FilterArrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (selectedColumns: string[], filterText: string) => void;
  columns: { field: string; headerName: string }[];
  initialSelectedColumns: string[];
  initialFilterValues: string;
  theme: string;
}

const FilterArrayModal: React.FC<FilterArrayModalProps> = ({
  isOpen,
  onClose,
  onApplyFilter,
  columns,
  initialSelectedColumns,
  initialFilterValues,
  theme,
}) => {
  const t = (key: string) => key;
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state during render when modal opens (React recommended pattern)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedColumns(initialSelectedColumns);
      setFilterText(initialFilterValues);
    }
  }

  // Handle checkbox changes
  const handleColumnToggle = (field: string) => {
    setSelectedColumns((prev) =>
      prev.includes(field)
        ? prev.filter((col) => col !== field)
        : [...prev, field],
    );
  };

  // Toggle all columns
  const toggleAllColumns = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map((col) => col.field));
    }
  };

  // Handle filter application
  const handleApply = () => {
    // Clean up filter text before applying
    const cleanedFilterText = filterText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .join("\n");

    onApplyFilter(selectedColumns, cleanedFilterText);
  };

  // Count the number of filter values (non-empty lines)
  const filterValueCount = filterText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "").length;

  // Filter columns by search term
  const filteredColumns = columns.filter(
    (column) =>
      column.headerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      column.field.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // If modal is not open or we are on server, don't render anything
  if (!isOpen || typeof document === "undefined") return null;

  const isDark = theme === "dark";

  // Styles
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    isolation: "isolate",
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: isDark ? "#1a1a1a" : "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: isDark ? "#eee" : "#333",
    position: "relative",
    zIndex: 1000000,
  };

  const modalHeaderStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderBottom: `1px solid ${isDark ? "#444" : "#eee"}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: isDark ? "#333" : "#f9f9f9",
    cursor: "move", // Added cursor to indicate draggable
  };

  const modalBodyStyle: React.CSSProperties = {
    padding: "20px",
    display: "flex",
    overflowY: "auto",
    flexGrow: 1,
    gap: "20px",
  };

  const columnSectionStyle: React.CSSProperties = {
    width: "40%",
    overflowY: "auto",
    maxHeight: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderRight: `1px solid ${isDark ? "#444" : "#eee"}`,
    paddingRight: "20px",
  };

  const valueSectionStyle: React.CSSProperties = {
    width: "60%",
    display: "flex",
    flexDirection: "column",
  };

  const searchInputStyle: React.CSSProperties = {
    padding: "8px 12px",
    marginBottom: "10px",
    border: `1px solid ${isDark ? "#555" : "#ddd"}`,
    borderRadius: "4px",
    fontSize: "14px",
    width: "100%",
    backgroundColor: isDark ? "#444" : "white",
    color: isDark ? "white" : "black",
  };

  const textareaStyle: React.CSSProperties = {
    height: "100%",
    minHeight: "350px",
    padding: "8px 12px",
    border: `1px solid ${isDark ? "#555" : "#ddd"}`,
    borderRadius: "4px",
    fontSize: "14px",
    resize: "none",
    fontFamily: "monospace",
    backgroundColor: isDark ? "#444" : "white",
    color: isDark ? "white" : "black",
  };

  const footerStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderTop: `1px solid ${isDark ? "#444" : "#eee"}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    backgroundColor: isDark ? "#333" : "#f9f9f9",
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    padding: "6px",
    borderRadius: "4px",
    backgroundColor: isDark ? "#222" : "#f5f5f5",
    cursor: "pointer",
  };

  const checkboxLabelStyle: React.CSSProperties = {
    cursor: "pointer",
    marginLeft: "8px",
    fontSize: "14px",
    userSelect: "none",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    backgroundColor: isDark ? "#2a3f54" : "#e6f7ff",
    color: isDark ? "white" : "#333",
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: isDark ? "#444" : "#f0f0f0",
  };

  const toggleAllStyle: React.CSSProperties = {
    ...buttonStyle,
    marginBottom: "10px",
    textAlign: "center",
  };

  const columnHelpTextStyle: React.CSSProperties = {
    fontSize: "12px",
    color: isDark ? "#aaa" : "#888",
    marginBottom: "10px",
  };

  const modalContent = (
    <div style={modalOverlayStyle}>
      <Rnd
        default={{
          x: typeof window !== "undefined" ? window.innerWidth / 2 - 400 : 100,
          y: 50,
          width: 800,
          height: "auto",
        }}
        minWidth={400}
        bounds="window"
        dragHandleClassName="modal-draggable-handle"
        style={{
          zIndex: 1000000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={modalContentStyle} className="filter-array-modal">
          <div style={modalHeaderStyle} className="modal-draggable-handle">
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              Tìm kiếm theo danh sách
            </h3>
            <CButton
              onClick={onClose}
              type="text"
              icon={<X size={18} />}
              style={{
                color: isDark ? "#ccc" : "#666",
              }}
            />
          </div>

          <div style={modalBodyStyle}>
            {/* Left side - Column selection */}
            <div style={columnSectionStyle}>
              <div style={columnHelpTextStyle}>
                Chọn các cột để cột để tìm kiếm:
                {selectedColumns.length > 0 && (
                  <span
                    style={{
                      color: isDark ? "#8bd8f4" : "#0078d7",
                    }}
                  >
                    {" "}
                    ({selectedColumns.length} cột)
                  </span>
                )}
              </div>
              <CInput
                placeholder="Tìm kiếm cột..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />

              <CButton onClick={toggleAllColumns} style={toggleAllStyle}>
                {selectedColumns.length === columns.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </CButton>

              <div style={{ overflowY: "auto" }}>
                {filteredColumns.map((column) => (
                  <div
                    key={column.field}
                    style={checkboxContainerStyle}
                    onClick={() => handleColumnToggle(column.field)}
                  >
                    <CCheckbox
                      checked={selectedColumns.includes(column.field)}
                      style={{ cursor: "pointer" }}
                    />
                    <label
                      htmlFor={`col-${column.field}`}
                      style={checkboxLabelStyle}
                    >
                      {column.headerName}
                    </label>
                  </div>
                ))}

                {filteredColumns.length === 0 && (
                  <div
                    style={{
                      color: isDark ? "#999" : "#666",
                      padding: "10px 0",
                    }}
                  >
                    {t("NoColumnsFound")}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Filter values */}
            <div style={valueSectionStyle}>
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>Nhập giá trị:</span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: isDark ? "#aaa" : "#888",
                      marginTop: "2px",
                    }}
                  >
                    Ngăn cách các giá trị bằng cách xuống dòng
                  </span>
                </div>
                {filterValueCount > 0 && (
                  <span
                    style={{
                      color: isDark ? "#8bd8f4" : "#0078d7",
                    }}
                  >
                    {filterValueCount} values
                  </span>
                )}
              </div>
              <CTextArea
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={textareaStyle}
                placeholder="Nhập giá trị cần tìm kiếm..."
              />
            </div>
          </div>

          <div style={footerStyle}>
            <CButton style={cancelButtonStyle} onClick={onClose}>
              Đóng
            </CButton>
            <CButton
              // style={buttonStyle}
              onClick={handleApply}
              disabled={selectedColumns.length === 0 || filterValueCount === 0}
              type="primary"
            >
              Áp dụng
            </CButton>
          </div>
        </div>
      </Rnd>
    </div>
  );

  // Render modal using portal to document.body to escape container constraints
  return createPortal(modalContent, document.body);
};

export default FilterArrayModal;
