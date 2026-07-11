"use client";

import React from "react";
import CAlert from "@/components/ui/CAlert";
import { Card, Space, Typography, Row, Col } from "antd";

const { Title, Paragraph } = Typography;

export default function AlertShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title level={1} style={{ color: "var(--color-primary)" }}>
          CAlert Showcase
        </Title>
        <Paragraph type="secondary">
          Feedback components with Lucide icons and Task branding.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Alert Types" variant="borderless" className="shadow-sm">
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="large"
            >
              <CAlert
                title="This is an information message"
                type="info"
                showIcon
              />
              <CAlert
                title="Success! Your data has been saved."
                type="success"
                showIcon
              />
              <CAlert
                title="Warning: Low storage space remaining."
                type="warning"
                showIcon
              />
              <CAlert
                title="Error: Connection failed. Please try again."
                type="error"
                showIcon
              />
            </Space>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title="With Descriptions"
            variant="borderless"
            className="shadow-sm"
          >
            <CAlert
              title="Detailed Notification"
              description="This alert includes a secondary description text for more context."
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
