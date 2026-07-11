"use client";

import React from "react";
import CColorPicker from "@/components/ui/CColorPicker";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function ColorPickerShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CColorPicker Showcase
        </Title>
        <Paragraph type="secondary">
          Color selection with label support.
        </Paragraph>
      </header>
      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card title="1. Basic" variant="borderless" className="shadow-sm">
            <Space orientation="vertical" size="middle">
              <CColorPicker label="Primary Color" defaultValue="#0A436D" />
              <CColorPicker label="Success Color" defaultValue="#2A9D8F" />
              <CColorPicker label="Danger Color" defaultValue="#E63946" />
              <CColorPicker
                label="No Alpha"
                defaultValue="#F4A261"
                disabledAlpha
              />
            </Space>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card
            title="2. Sizes & Formats"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CColorPicker size="small" defaultValue="#0A436D" />
              <CColorPicker defaultValue="#2A9D8F" />
              <CColorPicker size="large" defaultValue="#E63946" />
              <CColorPicker label="Disabled" defaultValue="#999" disabled />
            </Space>
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CColorPicker</Text>
      </footer>
    </div>
  );
}
