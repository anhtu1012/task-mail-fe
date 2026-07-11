/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
import { Rnd } from "react-rnd";
import { Button, Form, ConfigProvider } from "antd";
import { X } from "lucide-react";
import type { FilterField } from "./ActionGlobal";
import FormDynamic from "../FormDynamic/FormDynamic";

interface ActionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (values: Record<string, any>) => void;
  config: FilterField[];
  initialValues?: Record<string, any>;
}

const ActionFilterModal: React.FC<ActionFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  config,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const modalRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 200,
        y: 100,
        width: 400,
        height: "auto",
      }}
      minWidth={300}
      bounds="window"
      dragHandleClassName="filter-modal-header"
      style={{
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: "8px",
          boxShadow:
            "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Header kéo thả */}
        <div
          className="filter-modal-header"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "move",
            background: "#fafafa",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#262626" }}>
            Bộ lọc (Filter)
          </span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              color: "#8c8c8c",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body chứa form */}
        <div
          style={{
            padding: "16px",
            flex: 1,
            overflowY: "auto",
            cursor: "default",
          }}
        >
          {config && config.length > 0 ? (
            <ConfigProvider
              getPopupContainer={() => modalRef.current || document.body}
            >
              <FormDynamic
                form={form}
                schema={config}
                layout="vertical"
                onFinish={onApply}
                initialValues={initialValues}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <Button onClick={() => form.resetFields()}>Làm mới</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  Áp dụng
                </Button>
              </div>
            </ConfigProvider>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#8c8c8c",
                padding: "20px 0",
              }}
            >
              Chưa có cấu hình bộ lọc cho màn hình này.
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
};

export default ActionFilterModal;
