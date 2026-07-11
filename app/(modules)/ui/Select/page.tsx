"use client";

import React from "react";
import CSelect from "@/components/ui/CSelect";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const options = [
  { value: "hanoi", label: "Hà Nội" },
  { value: "hcm", label: "TP. Hồ Chí Minh" },
  { value: "danang", label: "Đà Nẵng" },
  { value: "haiphong", label: "Hải Phòng" },
  { value: "cantho", label: "Cần Thơ" },
];

const groupedOptions = [
  {
    label: "Vietnam",
    options: [
      { value: "vn-hanoi", label: "Hà Nội" },
      { value: "vn-hcm", label: "TP.HCM" },
    ],
  },
  {
    label: "International",
    options: [
      { value: "sg", label: "Singapore" },
      { value: "kr", label: "South Korea" },
    ],
  },
];

export default function SelectShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CSelect Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Dropdown selection with single, multiple, and grouped options.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic Select"
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
                <CSelect placeholder="Select a city" options={options} full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Searchable
                </Text>
                <CSelect
                  placeholder="Search city..."
                  options={options}
                  showSearch
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Disabled
                </Text>
                <CSelect
                  placeholder="Disabled"
                  options={options}
                  disabled
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Error
                </Text>
                <CSelect
                  placeholder="Error state"
                  options={options}
                  status="error"
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Warning
                </Text>
                <CSelect
                  placeholder="Warning state"
                  options={options}
                  status="warning"
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Mandatory
                </Text>
                <CSelect
                  placeholder="Required field"
                  options={options}
                  mandatory
                  full
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="2. Multiple Select"
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
                  Multi-select
                </Text>
                <CSelect
                  mode="multiple"
                  placeholder="Select cities"
                  options={options}
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Tags Mode
                </Text>
                <CSelect
                  mode="tags"
                  placeholder="Create or select"
                  options={options}
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Grouped Options
                </Text>
                <CSelect
                  placeholder="Select port"
                  options={groupedOptions}
                  full
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="3. Sizes" variant="borderless" className="shadow-sm">
            <Space wrap size="large" align="center">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Small
                </Text>
                <CSelect
                  placeholder="Small"
                  options={options}
                  size="small"
                  style={{ width: 200 }}
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Middle
                </Text>
                <CSelect
                  placeholder="Middle"
                  options={options}
                  size="middle"
                  style={{ width: 200 }}
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Large
                </Text>
                <CSelect
                  placeholder="Large"
                  options={options}
                  size="large"
                  style={{ width: 200 }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CSelect Component</Text>
      </footer>
    </div>
  );
}
