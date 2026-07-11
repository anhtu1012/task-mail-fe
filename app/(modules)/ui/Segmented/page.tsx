"use client";

import React from "react";
import { CSegmented } from "@/components/ui";
import { Card, Space, Divider, Typography, Row, Col } from "antd";
import { List, LayoutGrid, LayoutTemplate, Map } from "lucide-react";

const { Title, Paragraph } = Typography;

export default function TestUISegmentedPage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CSegmented Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Testing the customized Ant Design Segmented wrapper.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            title="Basic Variants"
            variant="borderless"
            className="shadow-sm"
          >
            <Space
              orientation="vertical"
              size="large"
              style={{ width: "100%" }}
            >
              <div>
                <Typography.Text strong>Default Options</Typography.Text>
                <div style={{ marginTop: "12px" }}>
                  <CSegmented
                    options={[
                      "Daily",
                      "Weekly",
                      "Monthly",
                      "Quarterly",
                      "Yearly",
                    ]}
                  />
                </div>
              </div>

              <Divider />

              <div>
                <Typography.Text strong>With Icons</Typography.Text>
                <div style={{ marginTop: "12px" }}>
                  <CSegmented
                    options={[
                      {
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "4px",
                            }}
                          >
                            <List size={16} />
                            <span>List</span>
                          </div>
                        ),
                        value: "List",
                      },
                      {
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "4px",
                            }}
                          >
                            <LayoutGrid size={16} />
                            <span>Grid</span>
                          </div>
                        ),
                        value: "Grid",
                      },
                      {
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "4px",
                            }}
                          >
                            <Map size={16} />
                            <span>Map</span>
                          </div>
                        ),
                        value: "Map",
                      },
                    ]}
                  />
                </div>
              </div>

              <Divider />

              <div>
                <Typography.Text strong>
                  Full Width (Block / full)
                </Typography.Text>
                <div style={{ marginTop: "12px" }}>
                  <CSegmented full options={[128, 256, 512, 1024]} />
                </div>
              </div>

              <Divider />

              <div>
                <Typography.Text strong>Disabled State</Typography.Text>
                <div style={{ marginTop: "12px" }}>
                  <CSegmented
                    disabled
                    options={["Map", "Transit", "Satellite"]}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
