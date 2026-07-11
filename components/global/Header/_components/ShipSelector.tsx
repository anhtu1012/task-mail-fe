"use client";

import CModal from "@/components/ui/CModal";
import CButton from "@/components/ui/Cbutton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectShipData, updateShipData } from "@/store/slices/shipDataSlice";
import { Repeat, Ship } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { GridReadyEvent, RowClickedEvent } from "@ag-grid-community/core";
import AgGridComponent from "@/components/global/cTableAG";
import { ExtendedColDef } from "@/components/global/cTableAG/agProps";
import styles from "./ShipSelector.module.scss";

// List of available ships in the new format
const SHIPS_LIST = [
  { shipCD: "BDFO", shipName: "BIEN DONG FORTUNE", oprCD: "VLC", shipType: "V" },
  { shipCD: "BDMR", shipName: "BIEN DONG MARINER", oprCD: "VLC", shipType: "V" },
  { shipCD: "VT01", shipName: "Viet Thuan 01", oprCD: "VLC", shipType: "V" },
  { shipCD: "PH02", shipName: "Phu Hung Star", oprCD: "VLC", shipType: "V" },
  { shipCD: "ST03", shipName: "Song Tien Express", oprCD: "VLC", shipType: "V" },
];


export default function ShipSelector() {
  const dispatch = useAppDispatch();
  const { shipData } = useAppSelector(selectShipData);
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedShip, setTempSelectedShip] = useState<typeof SHIPS_LIST[0] | null>(null);
  const gridRef = useRef<AgGridReact | null>(null);

  // Default to BDFO on mount if no ship has been selected yet
  useEffect(() => {
    if (!shipData) {
      dispatch(updateShipData(SHIPS_LIST[0]));
    }
  }, [shipData, dispatch]);

  const activeShip = shipData || SHIPS_LIST[0];

  const handleOpenModal = () => {
    setTempSelectedShip(activeShip);
    setIsOpen(true);
  };

  // Helper getters to handle both old and new ship property shapes
  const activeShipCD = activeShip.shipCD || activeShip.maT || "";
  const activeShipName = activeShip.shipName || activeShip.tenTau || "";

  const handleSelectShip = (ship: typeof SHIPS_LIST[0]) => {
    dispatch(updateShipData(ship));
    setIsOpen(false);
  };

  const onGridReady = (params: GridReadyEvent) => {
    // Select the active ship in the grid when ready
    params.api.forEachNode((node) => {
      if (node.data && (node.data.shipCD === activeShipCD)) {
        node.setSelected(true);
      }
    });
  };

  const handleSelectionChanged = () => {
    if (!gridRef.current?.api) return;
    const selectedRows = gridRef.current.api.getSelectedRows();
    if (selectedRows.length > 0) {
      setTempSelectedShip(selectedRows[0]);
    } else {
      setTempSelectedShip(null);
    }
  };

  const columnDefs: ExtendedColDef[] = [
    {
      headerName: "Mã Tàu",
      field: "shipCD",
      width: 100,
      editable:false,
      typeColumn: "Text",
    },
    {
      headerName: "Tên Tàu",
      field: "shipName",
      minWidth: 180,
      flex: 1,
         editable:false,
      typeColumn: "Text",
    },
    {
      headerName: "Hãng Tàu",
      field: "oprCD",
      width: 150,
         editable:false,
      typeColumn: "Text",
    },
    {
      headerName: "Loại Tàu",
      field: "shipType",
      width: 150,
         editable:false,
      typeColumn: "Select",
      selectOption:[
        {
          label:"Tàu", value:"V"
        },
        {
          label:"Sà Lan", value:"B"
        }
      ]
    },
  ];

  return (
    <>
      <button className={styles.selectorBtn} onClick={handleOpenModal} type="button">
        <Ship size={16} className={styles.shipIcon} />
        <span className={styles.shipName}>
          {activeShipCD} / {activeShipName}
        </span>
        <Repeat size={14} className={styles.arrowIcon} />
      </button>

      <CModal
        title="Chọn Tàu"
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        width={800}
        zIndex={2000}
        destroyOnHidden
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <CButton onClick={() => setIsOpen(false)}>
              Hủy
            </CButton>
            <CButton
              type="primary"
              disabled={!tempSelectedShip}
              onClick={() => {
                if (tempSelectedShip) {
                  handleSelectShip(tempSelectedShip);
                }
              }}
            >
              Chọn
            </CButton>
          </div>
        }
      >
        <div className={styles.modalContent} style={{  display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AgGridComponent
              gridRef={gridRef}
              rowData={SHIPS_LIST}
              columnDefs={columnDefs}
              showSearch={true}
              showActionButtons={false}
              showExportExcel={false}
              showCheckboxSelection={false}
              rowSelection="single"
              pagination={false}
              showSTT={true}
              maxRowsVisible={10}
              disableDragCopy={true}
              disablePaste={true}
              onGridReady={onGridReady}
              onSelectionChanged={handleSelectionChanged}
              onRowDoubleClicked={(event) => {
                if (event.data) {
                  handleSelectShip(event.data);
                }
              }}
              onRowClicked={(event: RowClickedEvent) => {
                if (event.data) {
                  setTempSelectedShip(event.data);
                  event.node.setSelected(true);
                }
              }}
            />
          </div>
        </div>
      </CModal>
    </>
  );
}
