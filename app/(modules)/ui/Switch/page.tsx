"use client";

import React from "react";
import CSwitch from "@/components/ui/CSwitch";
import { Card, Space, Typography, Row, Col, Divider } from "antd";
import { Check, X } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function SwitchShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CSwitch Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Toggle switch with semantic color variants and label support.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic Switch"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CSwitch label="Default Switch" />
              <CSwitch label="Checked by Default" defaultChecked />
              <CSwitch label="Disabled" disabled />
              <CSwitch label="Disabled Checked" defaultChecked disabled />
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
              <CSwitch variant="primary" label="Primary" defaultChecked />
              <CSwitch variant="success" label="Success" defaultChecked />
              <CSwitch variant="warning" label="Warning" defaultChecked />
              <CSwitch variant="danger" label="Danger" defaultChecked />
              <CSwitch variant="info" label="Info" defaultChecked />
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card title="3. Sizes" variant="borderless" className="shadow-sm">
            <Space orientation="vertical" size="middle">
              <CSwitch size="small" label="Small" defaultChecked />
              <CSwitch label="Default" defaultChecked />
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="4. With Icons"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" size="middle">
              <CSwitch
                checkedChildren={<Check size={12} />}
                unCheckedChildren={<X size={12} />}
                label="With Icons"
                defaultChecked
              />
              <CSwitch
                checkedChildren="ON"
                unCheckedChildren="OFF"
                label="With Text"
                defaultChecked
              />
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="5. Label Placement"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="large">
              <CSwitch
                label="Label at End"
                labelPlacement="end"
                defaultChecked
              />
              <CSwitch
                label="Label at Start"
                labelPlacement="start"
                defaultChecked
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CSwitch Component</Text>
      </footer>
    </div>
  );
}
