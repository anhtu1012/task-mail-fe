"use client";

import React from "react";
import CCascader from "@/components/ui/CCascader";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const cascaderOptions = [
  {
    value: "vietnam",
    label: "Vietnam",
    children: [
      {
        value: "hanoi",
        label: "Hà Nội",
        children: [{ value: "hk", label: "Hoàn Kiếm" }],
      },
      {
        value: "hcm",
        label: "TP.HCM",
        children: [{ value: "q1", label: "Quận 1" }],
      },
    ],
  },
  {
    value: "singapore",
    label: "Singapore",
    children: [{ value: "central", label: "Central Region" }],
  },
];

export default function CascaderShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CCascader Showcase
        </Title>
        <Paragraph type="secondary">
          Hierarchical selection of options.
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
              <CCascader
                options={cascaderOptions}
                placeholder="Select location"
                full
              />
              <CCascader
                options={cascaderOptions}
                placeholder="Required"
                mandatory
                full
              />
              <CCascader
                options={cascaderOptions}
                placeholder="Disabled"
                disabled
                full
              />
            </Space>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card
            title="2. Searchable"
            variant="borderless"
            className="shadow-sm"
          >
            <CCascader
              options={cascaderOptions}
              placeholder="Search..."
              showSearch
              full
            />
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CCascader</Text>
      </footer>
    </div>
  );
}
