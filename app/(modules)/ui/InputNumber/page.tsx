"use client";

import React from "react";
import CInputNumber from "@/components/ui/CInputNumber";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function InputNumberShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CInputNumber Showcase
        </Title>
        <Paragraph type="secondary">
          Numeric input with controls, ranges, and formatting.
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
              <CInputNumber placeholder="Enter number" full />
              <CInputNumber min={1} max={100} defaultValue={50} full />
              <CInputNumber
                min={0}
                max={10}
                step={0.1}
                defaultValue={3.7}
                full
              />
              <CInputNumber placeholder="Required" mandatory full />
              <CInputNumber defaultValue={42} disabled full />
            </Space>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="2. Sizes" variant="borderless" className="shadow-sm">
            <Space wrap size="large" align="center">
              <CInputNumber size="small" defaultValue={10} />
              <CInputNumber size="middle" defaultValue={20} />
              <CInputNumber size="large" defaultValue={30} />
            </Space>
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CInputNumber</Text>
      </footer>
    </div>
  );
}
