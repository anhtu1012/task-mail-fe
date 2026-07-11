"use client";

import React from "react";
import CNotification from "@/components/ui/CNotification";
import CButton from "@/components/ui/Cbutton";
import { Card, Space, Typography, Row, Col, App } from "antd";

const { Title, Paragraph } = Typography;

export default function NotificationShowcasePage() {
  const { notification } = App.useApp();

  const openNotification = (type: "success" | "info" | "warning" | "error") => {
    notification[type]({
      title: `Notification ${type.toUpperCase()}`,
      description: "This is a detailed notification that stays visible longer than a simple message.",
    });
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title level={1} style={{ color: "var(--color-primary)" }}>CNotification Showcase</Title>
        <Paragraph type="secondary">Corner notifications for complex feedback scenarios.</Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Trigger Notifications" variant="borderless" className="shadow-sm">
            <Space wrap size="middle">
              <CButton onClick={() => openNotification("info")}>Open Info</CButton>
              <CButton type="primary" onClick={() => openNotification("success")}>Open Success</CButton>
              <CButton onClick={() => openNotification("warning")}>Open Warning</CButton>
              <CButton danger onClick={() => openNotification("error")}>Open Error</CButton>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
