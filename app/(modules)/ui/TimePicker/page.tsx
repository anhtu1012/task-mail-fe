"use client";

import React from "react";
import CTimePicker from "@/components/ui/CTimePicker";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function TimePickerShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CTimePicker Showcase
        </Title>
        <Paragraph type="secondary">
          Time selection with various formats.
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
              <CTimePicker placeholder="Select time" full />
              <CTimePicker placeholder="Required" mandatory full />
              <CTimePicker placeholder="Disabled" disabled full />
            </Space>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="2. Formats" variant="borderless" className="shadow-sm">
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <CTimePicker format="HH:mm" placeholder="HH:mm" full />
              <CTimePicker format="HH:mm:ss" placeholder="HH:mm:ss" full />
              <CTimePicker
                use12Hours
                format="h:mm A"
                placeholder="12-hour"
                full
              />
            </Space>
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CTimePicker</Text>
      </footer>
    </div>
  );
}
