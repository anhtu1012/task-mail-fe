"use client";

import CInput, { CPassword, CSearch, CTextArea } from "@/components/ui/CInput";
import { Card, Col, Divider, Row, Space, Typography } from "antd";
import { Lock, Mail } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function InputShowcasePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CInput Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Text Input, TextArea, Password, and Search components with premium
          styling.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24} md={12}>
          <Card
            title="1. Basic Input"
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
                <CInput placeholder="Enter your name..." full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  With Prefix
                </Text>
                <CInput
                  placeholder="Email address"
                  prefix={<Mail size={16} />}
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Disabled
                </Text>
                <CInput placeholder="Disabled input" disabled full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Error
                </Text>
                <CInput placeholder="Error field" status="error" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Warning
                </Text>
                <CInput placeholder="Warning field" status="warning" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Mandatory
                </Text>
                <CInput placeholder="Required field" mandatory full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="2. Input Sizes"
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
                  Small
                </Text>
                <CInput placeholder="Small input" size="small" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Middle (Default)
                </Text>
                <CInput placeholder="Default input" size="middle" full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Large
                </Text>
                <CInput placeholder="Large input" size="large" full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="3. Password Input"
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
                  Default Password
                </Text>
                <CPassword
                  placeholder="Enter password"
                  prefix={<Lock size={16} />}
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Mandatory Password
                </Text>
                <CPassword placeholder="Required password" mandatory full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="4. Search Input"
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
                  Default Search
                </Text>
                <CSearch placeholder="Search records..." full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  With Enter Button
                </Text>
                <CSearch placeholder="Search..." enterButton full />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="5. TextArea" variant="borderless" className="shadow-sm">
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Default TextArea
                </Text>
                <CTextArea placeholder="Enter description..." rows={4} full />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Auto-resize TextArea
                </Text>
                <CTextArea
                  placeholder="Auto-sizing textarea..."
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  full
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  With Character Count
                </Text>
                <CTextArea
                  placeholder="Max 200 characters"
                  maxLength={200}
                  showCount
                  full
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CInput Component</Text>
      </footer>
    </div>
  );
}
