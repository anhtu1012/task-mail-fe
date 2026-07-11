"use client";

import React from "react";
import CDatePicker, { CRangePicker } from "@/components/ui/CDatePicker";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function DatePickerShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CDatePicker Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Date selection with single and range picker modes.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic DatePicker"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Default
                </Text>
                <CDatePicker placeholder="Select date" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Mandatory
                </Text>
                <CDatePicker placeholder="Required date" mandatory full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Disabled
                </Text>
                <CDatePicker placeholder="Disabled" disabled full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="2. Picker Modes"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Date
                </Text>
                <CDatePicker picker="date" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Week
                </Text>
                <CDatePicker picker="week" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Month
                </Text>
                <CDatePicker picker="month" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Year
                </Text>
                <CDatePicker picker="year" full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="3. Range Picker"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Date Range
                </Text>
                <CRangePicker full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Mandatory Range
                </Text>
                <CRangePicker mandatory full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="4. Sizes" variant="borderless" className="shadow-sm">
            <Space wrap size="large" align="center">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Small
                </Text>
                <CDatePicker size="small" />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Middle
                </Text>
                <CDatePicker size="middle" />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Large
                </Text>
                <CDatePicker size="large" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CDatePicker Component</Text>
      </footer>
    </div>
  );
}
