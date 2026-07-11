"use client";

import React from "react";
import CAutoComplete from "@/components/ui/CAutoComplete";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const mockOptions = [
  { value: "HCMC" },
  { value: "Hanoi" },
  { value: "Da Nang" },
  { value: "Hai Phong" },
  { value: "Can Tho" },
];

export default function AutoCompleteShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CAutoComplete Showcase
        </Title>
        <Paragraph type="secondary">
          Auto-complete suggestions as you type.
        </Paragraph>
      </header>
      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card title="1. Basic" variant="borderless" className="shadow-sm">
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <CAutoComplete
                options={mockOptions}
                placeholder="Type a city..."
                full
              />
              <CAutoComplete
                options={mockOptions}
                placeholder="Required"
                mandatory
                full
              />
              <CAutoComplete
                options={mockOptions}
                placeholder="Disabled"
                disabled
                full
              />
            </Space>
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CAutoComplete</Text>
      </footer>
    </div>
  );
}
