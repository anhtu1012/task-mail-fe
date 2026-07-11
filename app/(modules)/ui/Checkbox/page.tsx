"use client";

import React from "react";
import CCheckbox, { CCheckboxGroup } from "@/components/ui/CCheckbox";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const plainOptions = ["Apple", "Pear", "Orange"];
const checkboxOptions = [
  { label: "Container 20ft", value: "20" },
  { label: "Container 40ft", value: "40" },
  { label: "Container 45ft", value: "45" },
];

export default function CheckboxShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CCheckbox Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Checkbox with semantic color variants and flexible group layouts.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic Checkbox"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CCheckbox>Default Checkbox</CCheckbox>
              <CCheckbox defaultChecked>Checked</CCheckbox>
              <CCheckbox disabled>Disabled</CCheckbox>
              <CCheckbox defaultChecked disabled>
                Disabled Checked
              </CCheckbox>
              <CCheckbox indeterminate>Indeterminate</CCheckbox>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="2. Color Variants"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CCheckbox variant="primary" defaultChecked>
                Primary
              </CCheckbox>
              <CCheckbox variant="success" defaultChecked>
                Success
              </CCheckbox>
              <CCheckbox variant="warning" defaultChecked>
                Warning
              </CCheckbox>
              <CCheckbox variant="danger" defaultChecked>
                Danger
              </CCheckbox>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="3. Horizontal Group"
            variant="borderless"
            className="shadow-sm"
          >
            <CCheckboxGroup
              layout="horizontal"
              options={checkboxOptions}
              defaultValue={["20"]}
            />
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="4. Vertical Group"
            variant="borderless"
            className="shadow-sm"
          >
            <CCheckboxGroup
              layout="vertical"
              options={checkboxOptions}
              defaultValue={["20", "40"]}
            />
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CCheckbox Component</Text>
      </footer>
    </div>
  );
}
