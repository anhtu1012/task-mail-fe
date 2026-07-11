"use client";

import React from "react";
import CButton from "@/components/ui/Cbutton";
import {
  Plus,
  Save,
  Trash,
  Search,
  Download,
  Settings,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { Card, Space, Divider, Typography, Row, Col, Badge } from "antd";

const { Title, Text, Paragraph } = Typography;

/**
 * TestUIButtonPage - A comprehensive test page for the CButton component.
 * Demonstrates all variants, states, sizes, and the custom 'full' prop.
 */
export default function TestUIButtonPage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CButton Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Testing the customized Ant Design Button wrapper with premium styling
          and extended property support.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        {/* Basic Variants */}
        <Col span={24}>
          <Card
            title="1. Semantic Variants"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="large">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Primary
                </Text>
                <CButton type="primary">Primary Action</CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Default
                </Text>
                <CButton type="default">Secondary Action</CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Dashed
                </Text>
                <CButton type="dashed">Dashed Border</CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Text
                </Text>
                <CButton type="text">Text Only</CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Link
                </Text>
                <CButton type="link">Link Style</CButton>
              </div>
            </Space>
          </Card>
        </Col>

        {/* States */}
        <Col span={24} md={12}>
          <Card
            title="2. Interactive States"
            variant="borderless"
            className="shadow-sm"
            style={{ height: "100%" }}
          >
            <Space
              orientation="vertical"
              size="middle"
              style={{ width: "100%" }}
            >
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <CButton type="primary" loading>
                  Processing
                </CButton>
                <Text type="secondary">Loading state</Text>
              </div>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <CButton type="primary" disabled>
                  Locked Action
                </CButton>
                <Text type="secondary">Disabled state</Text>
              </div>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <CButton
                  type="default"
                  icon={<RefreshCw size={14} className="animate-spin" />}
                >
                  Syncing
                </CButton>
                <Text type="secondary">Custom icon animation</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Danger Variants */}
        <Col span={24} md={12}>
          <Card
            title="3. Destructive Actions"
            variant="borderless"
            className="shadow-sm"
            style={{ height: "100%" }}
          >
            <Space wrap size="middle">
              <CButton type="primary" danger icon={<Trash size={16} />}>
                Delete Permanently
              </CButton>
              <CButton type="default" danger>
                Cancel Process
              </CButton>
              <CButton type="text" danger>
                Remove
              </CButton>
            </Space>
          </Card>
        </Col>

        {/* Icon Integrations */}
        <Col span={24}>
          <Card
            title="4. Icon & Composition"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="large">
              <CButton type="primary" icon={<Plus size={16} />}>
                Create New Record
              </CButton>
              <CButton type="default" icon={<Save size={16} />}>
                Save Changes
              </CButton>
              <CButton
                type="primary"
                icon={<Send size={16} />}
                iconPlacement="end"
              >
                Send Message
              </CButton>
              <CButton
                type="default"
                shape="circle"
                icon={<Search size={16} />}
              />
              <CButton
                type="primary"
                shape="round"
                icon={<Download size={16} />}
              >
                Export Data
              </CButton>
            </Space>
          </Card>
        </Col>

        {/* Sizes */}
        <Col span={24} md={12}>
          <Card
            title="5. Dimensional Scale"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="middle" align="center">
              <Badge count="Small">
                <CButton type="primary" size="small">
                  Compact
                </CButton>
              </Badge>
              <Badge count="Default">
                <CButton type="primary" size="middle">
                  Standard
                </CButton>
              </Badge>
              <Badge count="Large">
                <CButton type="primary" size="large">
                  Spacious
                </CButton>
              </Badge>
            </Space>
          </Card>
        </Col>

        {/* Full Width */}
        <Col span={24} md={12}>
          <Card
            title="6. Responsive Layout (Prop: full)"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <CButton type="primary" full icon={<Settings size={16} />}>
                Full Width Primary Action
              </CButton>
              <CButton type="default" full>
                Full Width Secondary Action
              </CButton>
            </Space>
          </Card>
        </Col>

        {/* Styling Verification */}
        <Col span={24}>
          <Card
            title="7. Premium Aesthetic Check"
            variant="borderless"
            className="shadow-sm"
            style={{
              background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
            }}
          >
            <Paragraph>
              Verify gradient consistency, box-shadow depth, and transition
              smoothness on hover.
            </Paragraph>
            <Space wrap size={24}>
              <CButton
                type="primary"
                size="large"
                style={{ padding: "0 40px", height: "56px", fontSize: "16px" }}
              >
                Launch Application
              </CButton>
              <CButton
                type="default"
                size="large"
                style={{ padding: "0 40px", height: "56px", fontSize: "16px" }}
              >
                Learn More
              </CButton>
            </Space>
          </Card>
        </Col>
        {/* Semantic Status Types */}
        <Col span={24}>
          <Card
            title="8. Semantic Status Types (Custom)"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="large">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Success
                </Text>
                <CButton type="success" icon={<CheckCircle size={16} />}>
                  Success Button
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Warning
                </Text>
                <CButton type="warning" icon={<AlertTriangle size={16} />}>
                  Warning Button
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Error / Danger
                </Text>
                <CButton type="error" icon={<XCircle size={16} />}>
                  Error Button
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Info
                </Text>
                <CButton type="info" icon={<Info size={16} />}>
                  Info Button
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Secondary
                </Text>
                <CButton type="secondary" icon={<Shield size={16} />}>
                  Secondary
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Dark
                </Text>
                <CButton type="dark" icon={<Moon size={16} />}>
                  Dark Button
                </CButton>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Light
                </Text>
                <CButton type="light" icon={<Sun size={16} />}>
                  Light Button
                </CButton>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Special Gradient */}
        <Col span={24}>
          <Card
            title="9. Special Effects"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="large">
              <div>
                <Text strong style={{ display: "block", marginBottom: "8px" }}>
                  Multi-color Gradient
                </Text>
                <CButton type="gradient" size="large" icon={<Zap size={18} />}>
                  Premium Gradient Action
                </CButton>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">
          Task Design System - UI Components Test Page
        </Text>
      </footer>
    </div>
  );
}
