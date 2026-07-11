/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState } from "react";
import AgGridComponent from "@/components/global/cTableAG";
import { ExtendedColDef } from "@/components/global/cTableAG/agProps";
import LayoutContent, {
  LayoutSection,
} from "@/components/global/LayoutContent";

const CTableDemoPage = () => {
  const gridRef = useRef<any>(null);

  // Dữ liệu mẫu
  const [rowData] = useState([
    {
      id: 1,
      name: "Nguyễn Văn A",
      age: 25,
      gender: "Nam",
      birthday: "1999-01-01",
      active: true,
      status: "A",
    },
    {
      id: 2,
      name: "Trần Thị B",
      age: 30,
      gender: "Nữ",
      birthday: "1994-05-20",
      active: false,
      status: "B",
    },
    {
      id: 3,
      name: "Lê Văn C",
      age: 22,
      gender: "Nam",
      birthday: "2002-11-15",
      active: true,
      status: "A",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      age: 28,
      gender: "Nữ",
      birthday: "1996-08-10",
      active: true,
      status: "C",
    },
    {
      id: 5,
      name: "Hoàng Văn E",
      age: 35,
      gender: "Nam",
      birthday: "1989-03-25",
      active: false,
      status: "B",
    },
  ]);

  // Cấu hình cột
  const columnDefs: ExtendedColDef[] = useMemo(
    () => [
      {
        headerName: "ID",
        field: "id",
        width: 80,
        typeColumn: "Number",
      },
      {
        headerName: "Họ và Tên",
        field: "name",
        minWidth: 200,
        flex: 1,
        typeColumn: "Text",
        editable: true,
      },
      {
        headerName: "Tuổi",
        field: "age",
        width: 100,
        typeColumn: "Number",
        editable: true,
      },
      {
        headerName: "Giới tính",
        field: "gender",
        width: 120,
        typeColumn: "Select",
        editable: true,
        selectOptions: [
          { label: "Nam", value: "Nam" },
          { label: "Nữ", value: "Nữ" },
        ],
      },
      {
        headerName: "Ngày sinh",
        field: "birthday",
        width: 150,
        typeColumn: "Date",
        editable: true,
      },
      {
        headerName: "Trạng thái",
        field: "status",
        width: 120,
        typeColumn: "Select",
        editable: true,
        selectOptions: [
          { label: "Hoạt động", value: "A" },
          { label: "Tạm dừng", value: "B" },
          { label: "Đã hủy", value: "C" },
        ],
      },
      {
        headerName: "Kích hoạt",
        field: "active",
        width: 120,
        typeColumn: "Checkbox",
        editable: true,
      },
    ],
    [],
  );

  return (
    <LayoutContent type="sticky-header">
      <LayoutSection
        style={{
          padding: "20px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px", color: "#265b8e" }}>
          Demo cTableAG Component
        </h1>
        <p style={{ margin: "8px 0 0", color: "#666" }}>
          Trang demo hướng dẫn sử dụng component bảng AG Grid tùy chỉnh với các
          tính năng: Tìm kiếm, Thêm/Xóa/Lưu, Phân trang và Chỉnh sửa trực tiếp.
        </p>
      </LayoutSection>

      <LayoutSection style={{ padding: "20px" }}>
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            padding: "20px",
          }}
        >
          <AgGridComponent
            gridRef={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            showSearch={true}
            showActionButtons={true}
            pagination={true}
            paginationPageSize={10}
            maxRowsVisible={10}
            rowSelection="single"
            editType="fullRow"
            showSTT={true}
            showCheckboxSelection={false}
            actionButtonsProps={{
              onAdd: () => console.log("[cTableAG] Add clicked"),
              onSave: () => console.log("[cTableAG] Save clicked"),
              onDelete: () => console.log("[cTableAG] Delete clicked"),
            }}
            onRowDoubleClicked={(event) => {
              console.log(
                "[cTableAG] ✅ Row double-clicked → rowIndex:",
                event.rowIndex,
                "| data:",
                event.data,
              );
            }}
            onCellEditingStarted={(params) => {
              console.log(
                "[cTableAG] ✏️ Cell editing started → field:",
                params.colDef.field,
                "| rowIndex:",
                params.rowIndex,
                "| value:",
                params.value,
              );
            }}
            onCellValueChanged={(params) => {
              console.log(
                "[cTableAG] 🔄 Value changed → field:",
                params.colDef.field,
                "| old:",
                params.oldValue,
                "→ new:",
                params.newValue,
              );
            }}
          />
        </div>

        <div style={{ marginTop: "40px" }}>
          <h3>Hướng dẫn sử dụng</h3>
          <ul style={{ lineHeight: "1.8" }}>
            <li>
              <b>showSearch:</b> Hiển thị thanh tìm kiếm nhanh phía trên bảng.
            </li>
            <li>
              <b>showActionButtons:</b> Hiển thị các nút Thêm, Lưu, Xóa.
            </li>
            <li>
              <b>typeColumn:</b> Định nghĩa kiểu dữ liệu cho cột (Text, Number,
              Select, Date, Checkbox).
            </li>
            <li>
              <b>editable:</b> Cho phép chỉnh sửa trực tiếp trên ô.
            </li>
            <li>
              <b>Drag-to-fill:</b> Kéo điểm xanh ở góc ô để copy dữ liệu (giống
              Excel).
            </li>
          </ul>
        </div>
      </LayoutSection>
    </LayoutContent>
  );
};

export default CTableDemoPage;
