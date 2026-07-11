"use client";

import React from "react";
import CTreeSelect from "@/components/ui/CTreeSelect";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const treeData = [
  {
    title: "Operations",
    value: "ops",
    children: [
      { title: "Vessel Planning", value: "vessel-planning" },
      { title: "Container Assignment", value: "container-assignment" },
    ],
  },
  {
    title: "Reports",
    value: "reports",
    children: [
      { title: "Daily Report", value: "daily" },
      { title: "Monthly Report", value: "monthly" },
    ],
  },
];

export default function TreeSelectShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CTreeSelect Showcase
        </Title>
        <Paragraph type="secondary">
          Tree-structured dropdown selection.
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
              <CTreeSelect
                treeData={treeData}
                placeholder="Select module"
                full
              />
              <CTreeSelect
                treeData={treeData}
                placeholder="Required"
                mandatory
                full
              />
              <CTreeSelect
                treeData={treeData}
                placeholder="Disabled"
                disabled
                full
              />
            </Space>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card
            title="2. Multiple & Checkable"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <CTreeSelect
                treeData={treeData}
                placeholder="Multi-select"
                multiple
                full
              />
              <CTreeSelect
                treeData={treeData}
                placeholder="Checkable"
                treeCheckable
                full
              />
            </Space>
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CTreeSelect</Text>
      </footer>
    </div>
  );
}
