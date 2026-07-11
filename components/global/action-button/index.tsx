/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */

import { Button, Modal, Popconfirm, Popover, Space, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./index.scss";
import { PlusCircle, Save, Trash2, Loader2 } from "lucide-react";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { getCookie } from "@/utils/client/getCookie";
import {
  checkPermissionByRsname,
  selectPermissions,
} from "@/store/slices/permissions";

// Export the type so it can be imported by other components
export type ActionButtonsProps = {
  onAdd?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  hideAdd?: boolean;
  hideSave?: boolean;
  hideDelete?: boolean;
  hideDivider?: boolean;
  rowSelected?: string | number | undefined;
  style?: React.CSSProperties;
  // New props for modal functionality
  showAddRowsModal?: boolean;
  modalTitle?: string;
  modalInputLabel?: string;
  modalInitialCount?: number;
  onModalOk?: (count: number) => void;
  onModalCancel?: () => void;
  // Updated type to accept both ReactNode and objects with return property
  buttonProps?: React.ReactNode | { return: React.ReactNode } | any;
  saveButtonContent?: React.ReactNode; // add this line
  saveButtonDelete?: React.ReactNode;
  confirmDeleteText?: React.ReactNode; // optional custom confirm delete text
  haveQuery?: boolean;
  onQuery?: () => void;
  loading?: boolean; // Loading state for save button
  noMarginBottom?: boolean; // If true remove default bottom margin
  disabledSave?: boolean; // If true disable the save button
  hideDeleteAll?: boolean;
  onDeleteAll?: () => void;
  noDeleteConfirm?: boolean;
  disabledDelete?: boolean; // New prop to disable the delete button
};

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(
  ({
    onAdd,
    onSave,
    onDelete,
    rowSelected,
    hideAdd = false,
    hideSave = false,
    hideDelete = false,
    hideDivider = false,
    style,
    // New props with default values
    showAddRowsModal = false,
    modalInitialCount = 1,
    onModalOk,
    onModalCancel,
    buttonProps, // Add buttonProps to destructuring
    saveButtonContent, // add this line
    saveButtonDelete,
    haveQuery = false,
    onQuery,
    loading = false, // Add loading prop with default value
    noMarginBottom = false,
    confirmDeleteText,
    disabledSave = false,
    hideDeleteAll = true,
    onDeleteAll,
    noDeleteConfirm = false,
    disabledDelete = false, // Default to false
  }) => {
    const dispatch = useDispatch();
    const url = getCookie("_url");
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [newRowsCount, setNewRowsCount] = useState<number>(modalInitialCount);
    const [isDeletePopoverOpen, setIsDeletePopoverOpen] =
      useState<boolean>(false);

    const urlMain = url?.toString().replace(/^\/+/, "");
    // Get selectedPermission from Redux store
    const { selectedPermission } = useSelector(selectPermissions);
    useEffect(() => {
      if (urlMain) {
        // Dispatch the action to find the permission by rsname
        dispatch(checkPermissionByRsname(urlMain));
      }
    }, [dispatch, urlMain]);
    const normalizedScopes = selectedPermission?.props?.scopes.map((scope) =>
      scope.toLowerCase(),
    );
    // const normalizedMenuScopes = selectedPermission?.props?.menuScopes?.map(
    //   (menuScope) => menuScope.toLowerCase()
    // );

    const canAdd = normalizedScopes?.includes("create");
    const canSave = normalizedScopes?.includes("update");
    const canDelete = normalizedScopes?.includes("delete");
    // const hiddenAdd = normalizedMenuScopes?.includes("create");
    // const hiddenSave = normalizedMenuScopes?.includes("update");
    // const hiddenDelete = normalizedMenuScopes?.includes("delete");

    // Handle add button click
    const handleAddClick = () => {
      if (showAddRowsModal) {
        setIsModalVisible(true);
      } else if (onAdd) {
        onAdd();
      }
    };

    // Handle modal ok button
    const handleModalOk = () => {
      if (onModalOk && !isNaN(newRowsCount)) {
        onModalOk(newRowsCount);
        setIsModalVisible(false);
      }
    };

    // Handle modal cancel button
    const handleModalCancel = () => {
      if (onModalCancel) {
        onModalCancel();
      }
      setIsModalVisible(false);
    };

    // Function to safely render buttonProps
    const renderButtonProps = () => {
      if (!buttonProps) {
        return null;
      }

      // If buttonProps has a return property, render that
      if (typeof buttonProps === "object" && buttonProps.return) {
        return buttonProps.return;
      }

      // Otherwise render buttonProps directly
      return buttonProps;
    };

    const handleDeleteAll = () => {
      setIsDeletePopoverOpen(false);
      Modal.confirm({
        title: "Bạn có chắc chắn muốn xóa tất cả?",
        content:
          "Hành động này không thể hoàn tác. Bạn có thực sự muốn xóa toàn bộ dữ liệu không?",
        okText: "Có",
        cancelText: "Không",
        centered: true,
        onOk: () => {
          if (onDeleteAll) {
            onDeleteAll();
          }
        },
      });
    };

    const handleDelete = () => {
      if (onDelete) {
        onDelete();
      }
      setIsDeletePopoverOpen(false);
    };

    const deletePopoverContent = (
      <div style={{ padding: "4px", maxWidth: "280px" }}>
        <Space align="start" style={{ marginBottom: 12, gap: "8px" }}>
          <ExclamationCircleFilled style={{ color: "#faad14", fontSize: 20 }} />
          <Typography.Text style={{ fontSize: "14px", lineHeight: "1.4" }}>
            {confirmDeleteText ?? `Xác nhận xóa ${rowSelected || ""} dòng`}
          </Typography.Text>
        </Space>
        <Space
          style={{ width: "100%", justifyContent: "flex-end", gap: "6px" }}
        >
          <Button
            danger
            size="small"
            onClick={handleDeleteAll}
            style={{ fontWeight: "bold" }}
          >
            Xóa tất cả
          </Button>
          <Button
            size="small"
            onClick={() => setIsDeletePopoverOpen(false)}
            style={{ borderRadius: "4px" }}
          >
            Không
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={handleDelete}
            style={{
              backgroundColor: "#5bc0eb",
              borderColor: "#5bc0eb",
              borderRadius: "4px",
            }}
          >
            Có
          </Button>
        </Space>
      </div>
    );

    return (
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          marginBottom: noMarginBottom ? 0 : "12px",
          ...style,
        }}
      >
        <>
          {/* Custom Button Props */}
          {renderButtonProps()}
          {haveQuery && (
            <>
              <Button
                htmlType="submit"
                className="btn-query"
                onClick={onQuery}
                type="default"
                style={{
                  padding: "18px",
                  border: "1px solid #EFB008",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  backgroundColor: "white",
                  color: "#EFB008",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginLeft: "12px",
                }}
              >
                <Loader2 size={20} className="animate-spin" /> Tra cứu
              </Button>
              <div
                className="vertical-divider"
                style={{
                  display: hideDivider ? "none" : "inline-block",
                }}
              ></div>
            </>
          )}

          {/* Button Add */}
          {!hideAdd && (
            <Button
              className="btn-add"
              type="primary"
              onClick={handleAddClick}
              disabled={!canAdd}
              style={{
                padding: "18px",
                border: "1px solid #265b8e",
                borderRadius: "4px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "#265b8e",
                opacity: !canAdd ? 0.3 : 1,
              }}
            >
              <PlusCircle size={20} /> Thêm
            </Button>
          )}
          {/* Button Save */}
          {!hideSave && (
            <Button
              className="btn-save"
              type="primary"
              onClick={onSave}
              disabled={!canSave || loading || disabledSave}
              loading={loading}
              style={{
                padding: "18px",
                border: "1px solid #106754",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#106754",
                fontWeight: "bold",
                opacity: !canSave || loading || disabledSave ? 0.6 : 1,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {saveButtonContent ?? (
                  <>
                    <Save size={20} /> Lưu
                  </>
                )}
              </span>
            </Button>
          )}

          {!hideDivider && !hideSave && !hideDelete && (
            <div className="vertical-divider"></div>
          )}

          {noDeleteConfirm ? (
            !hideDelete && (
              <Button
                className="btn-delete"
                danger
                icon={saveButtonDelete ? undefined : <Trash2 size={18} />}
                disabled={!canDelete || disabledDelete}
                onClick={onDelete}
                style={{
                  padding: "18px",
                  border: "1px solid rgba(235, 11, 11, 1)",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  color: "rgba(235, 11, 11, 1)",
                  fontWeight: "bold",
                  opacity: !canDelete || disabledDelete ? 0.3 : 1,
                }}
              >
                {saveButtonDelete ?? <>Xóa</>}
              </Button>
            )
          ) : !hideDeleteAll ? (
            <Popover
              content={deletePopoverContent}
              trigger="click"
              open={isDeletePopoverOpen}
              onOpenChange={setIsDeletePopoverOpen}
              placement="bottomRight"
            >
              <Button
                className="btn-delete"
                danger
                icon={<Trash2 size={18} />}
                disabled={!canDelete || disabledDelete}
                style={{
                  padding: "18px",
                  border: "1px solid rgba(235, 11, 11, 1)",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  color: "rgba(235, 11, 11, 1)",
                  fontWeight: "bold",
                  opacity: !canDelete || disabledDelete ? 0.3 : 1,
                  display: hideDelete ? "none" : "",
                }}
              >
                {saveButtonDelete ?? <>Xóa</>}
              </Button>
            </Popover>
          ) : (
            <Popconfirm
              title={confirmDeleteText ?? `Xác nhận xóa ${rowSelected} dòng`}
              onConfirm={onDelete}
              okText="Có"
              cancelText="Không"
              placement="bottom"
              icon={
                <ExclamationCircleFilled
                  style={{ color: "#faad14", fontSize: 22 }}
                />
              }
              okButtonProps={{
                style: {
                  backgroundColor: "#5bc0eb",
                  borderColor: "#5bc0eb",
                  borderRadius: "4px",
                },
              }}
              cancelButtonProps={{
                style: {
                  borderRadius: "4px",
                },
              }}
            >
              <Button
                className="btn-delete"
                danger
                icon={saveButtonDelete ? undefined : <Trash2 size={18} />}
                disabled={!canDelete || disabledDelete}
                style={{
                  padding: "18px",
                  border: "1px solid rgba(235, 11, 11, 1)",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  color: "rgba(235, 11, 11, 1)",
                  fontWeight: "bold",
                  opacity: !canDelete || disabledDelete ? 0.3 : 1,
                  display: hideDelete ? "none" : "",
                }}
              >
                {saveButtonDelete ?? <>Xóa</>}
              </Button>
            </Popconfirm>
          )}

          {/* Modal for adding rows */}
          <Modal
            title="Thêm dòng"
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <label htmlFor="newRowsCount">Số lượng dòng:</label>
            <input
              type="number"
              id="newRowsCount"
              min={1}
              max={1000}
              value={isNaN(newRowsCount) ? "" : newRowsCount}
              onChange={(e) => {
                const rawValue = e.target.value;
                const parsed = Number(rawValue);

                if (rawValue === "") {
                  setNewRowsCount(NaN);
                } else if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
                  setNewRowsCount(parsed);
                }
              }}
              onBlur={(e) => {
                const parsed = Number(e.target.value);
                if (parsed < 1 || parsed > 1000 || isNaN(parsed)) {
                  setNewRowsCount(1);
                }
              }}
              style={{
                marginLeft: "5px",
                border: "1px solid #ccc",
                padding: "4px",
                borderRadius: "4px",
              }}
            />
          </Modal>
        </>
      </div>
    );
  },
);

export default ActionButtons;
