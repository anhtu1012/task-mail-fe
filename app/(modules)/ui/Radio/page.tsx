"use client";

import React, { useState } from "react";
import { Typography, Card, Space, Row, Col } from "antd";
import CRadio from "@/components/ui/CRadio";

const { Title, Paragraph, Text } = Typography;

export default function RadioShowcasePage() {
  const [value, setValue] = useState(1);

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title level={1} style={{ color: "var(--color-primary)", marginBottom: "8px" }}>
          CRadio Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Selection buttons for choosing a single option from a set.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card title="1. Basic Radio" variant="borderless" className="shadow-sm">
            <Space orientation="vertical" size="large">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Default</Text>
                <CRadio>Option A</CRadio>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Checked</Text>
                <CRadio defaultChecked>Option B</CRadio>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Disabled</Text>
                <Space>
                  <CRadio disabled>Disabled Off</CRadio>
                  <CRadio disabled defaultChecked>Disabled On</CRadio>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card title="2. Radio Group" variant="borderless" className="shadow-sm">
            <Space orientation="vertical" size="large">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Horizontal Group</Text>
                <CRadio.Group onChange={(e) => setValue(e.target.value)} value={value}>
                  <CRadio value={1}>Item 1</CRadio>
                  <CRadio value={2}>Item 2</CRadio>
                  <CRadio value={3}>Item 3</CRadio>
                </CRadio.Group>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>Vertical Group</Text>
                <CRadio.Group>
                  <Space orientation="vertical">
                    <CRadio value={1}>Option 1</CRadio>
                    <CRadio value={2}>Option 2</CRadio>
                    <CRadio value={3}>Option 3</CRadio>
                  </Space>
                </CRadio.Group>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
