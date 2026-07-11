"use client";

import React from "react";
import CMessage from "@/components/ui/CMessage";
import CButton from "@/components/ui/Cbutton";
import { Card, Space, Typography, Row, Col, App } from "antd";

const { Title, Paragraph } = Typography;

export default function MessageShowcasePage() {
  const { message } = App.useApp();

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title level={1} style={{ color: "var(--color-primary)" }}>CMessage Showcase</Title>
        <Paragraph type="secondary">Global feedback messages with custom timing and positioning.</Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Trigger Messages" variant="borderless" className="shadow-sm">
            <Space wrap size="middle">
              <CButton onClick={() => message.info("Normal message info")}>Info</CButton>
              <CButton type="primary" onClick={() => message.success("Operation successful!")}>Success</CButton>
              <CButton onClick={() => message.warning("Careful with this action")}>Warning</CButton>
              <CButton danger onClick={() => message.error("Critical error occurred")}>Error</CButton>
              <CButton loading onClick={() => message.loading("Processing...")}>Loading</CButton>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
