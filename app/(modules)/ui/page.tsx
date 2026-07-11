"use client";

import { App, Card, Col, Row, Space, Tabs, Typography } from "antd";
import { Bell, Layout } from "lucide-react";
import React from "react";

// Import Task UI Components
import CAlert from "@/components/ui/CAlert";
import CButton from "@/components/ui/Cbutton";
import CCheckbox from "@/components/ui/CCheckbox";
import CDatePicker from "@/components/ui/CDatePicker";
import CInput from "@/components/ui/CInput";
import CModal from "@/components/ui/CModal";
import CSelect from "@/components/ui/CSelect";
import CSwitch from "@/components/ui/CSwitch";

const { Title, Paragraph } = Typography;

export default function MasterUIShowcase() {
  const { message, notification } = App.useApp();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const showMessage = () => {
    message.success("Đây là thông báo thành công từ CMessage!");
  };

  const showNotification = () => {
    notification.info({
      title: "Thông báo Task",
      description:
        "Hệ thống đã cập nhật thành công giao diện mới với phong cách Premium.",
      placement: "topRight",
    });
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "60px", textAlign: "center" }}>
        <Title
          level={1}
          style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "16px" }}
        >
          Task{" "}
          <span style={{ color: "var(--color-primary)" }}>Design System</span>
        </Title>
        <Paragraph
          style={{
            fontSize: "1.125rem",
            color: "var(--color-neutral-600)",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          Hướng dẫn sử dụng bộ thành phần giao diện chuẩn Task. Tất cả các thành
          phần được thiết kế theo phong cách Premium, đảm bảo tính đồng nhất về
          thương hiệu và trải nghiệm người dùng.
        </Paragraph>
      </div>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: (
              <Space>
                <Layout size={16} />
                Cơ bản & Input
              </Space>
            ),
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: "24px" }}>
                <Col span={24} lg={12}>
                  <Card
                    title="CButton - Nút bấm"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Space wrap>
                      <CButton type="primary">Primary Button</CButton>
                      <CButton ghost>Ghost Button</CButton>
                      <CButton danger>Danger Button</CButton>
                      <CButton loading>Loading</CButton>
                    </Space>
                  </Card>
                </Col>
                <Col span={24} lg={12}>
                  <Card
                    title="CInput & CSelect"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Space
                      orientation="vertical"
                      style={{ width: "100%" }}
                      size="middle"
                    >
                      <CInput placeholder="Nhập văn bản..." full />
                      <CInput placeholder="Trường bắt buộc" mandatory full />
                      <CSelect
                        placeholder="Chọn một tùy chọn"
                        full
                        options={[
                          { label: "Tùy chọn 1", value: "1" },
                          { label: "Tùy chọn 2", value: "2" },
                        ]}
                      />
                    </Space>
                  </Card>
                </Col>
                <Col span={24} lg={12}>
                  <Card
                    title="Checkbox & Switch"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Space size="large">
                      <CCheckbox>Ghi nhớ mật khẩu</CCheckbox>
                      <CSwitch defaultChecked />
                    </Space>
                  </Card>
                </Col>
                <Col span={24} lg={12}>
                  <Card
                    title="DatePicker"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <CDatePicker
                      style={{ width: "100%" }}
                      placeholder="Chọn ngày..."
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "2",
            label: (
              <Space>
                <Bell size={16} />
                Thông báo & Feedback
              </Space>
            ),
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: "24px" }}>
                <Col span={24}>
                  <Card
                    title="CAlert - Cảnh báo"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Space
                      orientation="vertical"
                      style={{ width: "100%" }}
                      size="middle"
                    >
                      <CAlert
                        title="Thông báo hệ thống: Phiên bản 2.0 đã sẵn sàng."
                        type="info"
                        showIcon
                      />
                      <CAlert
                        title="Thành công: Dữ liệu đã được lưu trữ."
                        type="success"
                        showIcon
                      />
                      <CAlert
                        title="Cảnh báo: Dung lượng bộ nhớ sắp đầy."
                        type="warning"
                        showIcon
                      />
                      <CAlert
                        title="Lỗi: Không thể kết nối tới máy chủ."
                        type="error"
                        showIcon
                      />
                    </Space>
                  </Card>
                </Col>
                <Col span={24} lg={12}>
                  <Card
                    title="CModal - Hội thoại"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Paragraph>
                      Modal được thiết kế với bóng mờ và bo góc chuẩn Premium.
                    </Paragraph>
                    <CButton
                      type="primary"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Mở Modal Demo
                    </CButton>
                    <CModal
                      title="Xác nhận thao tác"
                      open={isModalOpen}
                      onOk={() => setIsModalOpen(false)}
                      onCancel={() => setIsModalOpen(false)}
                    >
                      <Paragraph>
                        Bạn có chắc chắn muốn thực hiện thay đổi này không? Hành
                        động này không thể hoàn tác.
                      </Paragraph>
                    </CModal>
                  </Card>
                </Col>
                <Col span={24} lg={12}>
                  <Card
                    title="Message & Notification"
                    variant="borderless"
                    className="shadow-sm"
                  >
                    <Space>
                      <CButton onClick={showMessage}>Hiển thị Message</CButton>
                      <CButton onClick={showNotification}>
                        Gửi Notification
                      </CButton>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
}
