"use client";

import React from "react";
import CUpload from "@/components/ui/CUpload";
import { CButton } from "@/components/ui";
import { Card, Space, Typography, Row, Col, Divider } from "antd";
import { Upload as UploadIcon } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function UploadShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CUpload Showcase
        </Title>
        <Paragraph type="secondary">
          File upload component with standard and drag-and-drop variants.
        </Paragraph>
      </header>
      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic Upload"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CUpload>
                <CButton icon={<UploadIcon size={16} />}>
                  Click to Upload
                </CButton>
              </CUpload>
            </Space>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title="2. Drag and Drop"
            variant="borderless"
            className="shadow-sm"
          >
            <CUpload
              variant="dragger"
              multiple
              draggerDescription="Click or drag file to this area to upload"
              draggerHint="Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files"
            />
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CUpload</Text>
      </footer>
    </div>
  );
}
