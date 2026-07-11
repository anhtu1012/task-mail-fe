"use client";

import React, { useState } from "react";
import CTransfer from "@/components/ui/CTransfer";
import { Card, Space, Typography, Row, Col, Divider } from "antd";

const { Title, Text, Paragraph } = Typography;

const mockData = Array.from({ length: 20 }).map((_, i) => ({
  key: i.toString(),
  title: `Content ${i + 1}`,
  description: `Description of content ${i + 1}`,
}));

export default function TransferShowcasePage() {
  const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const onChange = (nextTargetKeys: React.Key[]) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange = (
    sourceSelectedKeys: React.Key[],
    targetSelectedKeys: React.Key[],
  ) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CTransfer Showcase
        </Title>
        <Paragraph type="secondary">Dual-list selection component.</Paragraph>
      </header>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            title="1. Basic Transfer"
            variant="borderless"
            className="shadow-sm"
          >
            <CTransfer
              dataSource={mockData}
              titles={["Source", "Target"]}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={onChange}
              onSelectChange={onSelectChange}
              render={(item) => item.title}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title="2. Compact Transfer"
            variant="borderless"
            className="shadow-sm"
          >
            <CTransfer
              dataSource={mockData}
              titles={["Source", "Target"]}
              targetKeys={targetKeys}
              onChange={onChange}
              render={(item) => item.title}
              compact
            />
          </Card>
        </Col>
      </Row>
      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - CTransfer</Text>
      </footer>
    </div>
  );
}
