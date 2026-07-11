"use client";

import React from "react";
import { CCard, CCardList } from "@/components/ui";
import {
  CreditCard,
  Info,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Tag,
  Progress,
  Avatar,
} from "antd";

const { Title, Text, Paragraph } = Typography;

/**
 * TestUICardPage - A comprehensive test page for the CCard and CCardList components.
 * Showcases various styles and use cases for information cards.
 */
export default function TestUICardPage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          CCard Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Khám phá các biến thể, kiểu dáng và trường hợp sử dụng thực tế của
          Component Card.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        {/* 1. Basic Variants */}
        <Col span={24}>
          <Title level={3}>1. Biến thể cơ bản (Basic Variants)</Title>
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <CCard
                title={
                  <Space>
                    <CreditCard size={16} />
                    <span>Card Mặc định (Normal)</span>
                  </Space>
                }
                hoverable
              >
                <Paragraph>
                  Đây là card bình thường. Nó sử dụng nền trắng và viền mờ mặc
                  định. Thích hợp cho các nội dung thông thường, danh sách, hoặc
                  form.
                </Paragraph>
                <Text type="secondary">
                  Hover vào để thấy hiệu ứng đổ bóng.
                </Text>
              </CCard>
            </Col>
            <Col span={24} md={12}>
              <CCard
                type="info"
                title={
                  <Space>
                    <Info size={16} />
                    <span>Card Thông tin (Info)</span>
                  </Space>
                }
                hoverable
              >
                <Paragraph>
                  Đây là card thông tin. Nó sử dụng nền xanh nhẹ và viền đậm hơn
                  một chút. Thích hợp để làm nổi bật các thông tin quan trọng,
                  thông báo hoặc tóm tắt.
                </Paragraph>
                <Text type="secondary">
                  Hover vào để thấy hiệu ứng đổ bóng màu xanh.
                </Text>
              </CCard>
            </Col>
          </Row>
        </Col>

        {/* 2. Advanced Use Cases */}
        <Col span={24}>
          <Title level={3}>
            2. Các trường hợp sử dụng nâng cao (Advanced Use Cases)
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
            Phân tích và phát triển các mẫu Card thông tin thường gặp trong hệ
            thống quản lý.
          </Paragraph>

          <Row gutter={[16, 16]}>
            {/* A. Metric / KPI Card */}
            <Col span={24} md={8}>
              <CCard hoverable>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary">Tổng Doanh Thu</Text>
                    <div
                      style={{
                        padding: "8px",
                        background: "rgba(10, 67, 109, 0.1)",
                        borderRadius: "50%",
                        display: "flex",
                      }}
                    >
                      <CreditCard size={20} color="var(--color-primary)" />
                    </div>
                  </div>
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      $128,430
                    </Title>
                    <Text
                      type="success"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <TrendingUp size={14} />
                      <span>↑ 12%</span>
                      <span style={{ color: "var(--color-muted-foreground)" }}>
                        so với tháng trước
                      </span>
                    </Text>
                  </div>
                </Space>
              </CCard>
            </Col>

            {/* B. Status Card */}
            <Col span={24} md={8}>
              <CCard type="info" hoverable>
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary">Trạng Thái Hệ Thống</Text>
                    <Tag color="processing">Đang chạy</Tag>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px",
                        background: "var(--color-info-100)",
                        borderRadius: "8px",
                        display: "flex",
                      }}
                    >
                      <Layers size={24} color="var(--color-info-500)" />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: "0 0 4px 0" }}>
                        Vận Hành Ổn Định
                      </Title>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Tất cả các module đều hoạt động tốt.
                      </Text>
                    </div>
                  </div>
                </Space>
              </CCard>
            </Col>

            {/* C. Progress Card */}
            <Col span={24} md={8}>
              <CCard hoverable>
                <Space
                  orientation="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary">Tiến Độ Dự Án</Text>
                    <Text strong>75%</Text>
                  </div>
                  <Progress
                    percent={75}
                    showInfo={false}
                    strokeColor="var(--color-success)"
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "8px",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Đã hoàn thành: 15/20 task
                    </Text>
                    <Space size="small">
                      <Clock size={12} color="var(--color-muted-foreground)" />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Còn 5 ngày
                      </Text>
                    </Space>
                  </div>
                </Space>
              </CCard>
            </Col>

            {/* D. Data Details Card (Key-Value) */}
            <Col span={24} md={14}>
              <CCard
                title="Thông Tin Chi Tiết Tàu (Vessel Details)"
                type="info"
                hoverable
              >
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Tên tàu
                    </Text>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-foreground)",
                      }}
                    >
                      EVER GIVEN
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Mã chuyến
                    </Text>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-foreground)",
                      }}
                    >
                      EG-2026-001
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      ETA (Dự kiến đến)
                    </Text>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--color-foreground)",
                      }}
                    >
                      2026-05-20 08:00
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Trạng thái
                    </Text>
                    <div>
                      <Tag color="warning">Đang neo chờ</Tag>
                    </div>
                  </Col>
                </Row>
              </CCard>
            </Col>

            {/* E. Profile / User Card */}
            <Col span={24} md={10}>
              <CCard hoverable>
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <Avatar
                    size={64}
                    src="https://api.dicebear.com/7.x/miniavs/svg?seed=1"
                  />
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ margin: "0 0 4px 0" }}>
                      Nguyễn Văn A
                    </Title>
                    <Text type="secondary">Quản lý Cảng (Port Manager)</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Tag color="blue">Admin</Tag>
                      <Tag color="green">Active</Tag>
                    </div>
                  </div>
                </div>
                <Divider style={{ margin: "16px 0" }} />
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Email
                    </Text>
                    <div style={{ fontSize: "13px" }}>a.nguyen@Task.vn</div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Điện thoại
                    </Text>
                    <div style={{ fontSize: "13px" }}>+84 901 234 567</div>
                  </Col>
                </Row>
              </CCard>
            </Col>

            {/* F. Minimalist Info Card with Left Border Accent */}
            <Col span={24}>
              <div
                style={{
                  borderLeft: "4px solid var(--color-warning)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <CCard hoverable style={{ borderLeft: "none" }}>
                  <Space align="start" size="middle">
                    <div
                      style={{
                        padding: "8px",
                        background: "var(--color-warning-50)",
                        borderRadius: "50%",
                        display: "flex",
                      }}
                    >
                      <Info size={20} color="var(--color-warning)" />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: "0 0 4px 0" }}>
                        Lưu ý quan trọng (System Notice)
                      </Title>
                      <Paragraph style={{ margin: 0 }}>
                        Lịch trình tàu có thể thay đổi do điều kiện thời tiết
                        tại cảng đến. Vui lòng cập nhật thông tin thường xuyên
                        từ hệ thống AIS để có dữ liệu chính xác nhất.
                      </Paragraph>
                    </div>
                  </Space>
                </CCard>
              </div>
            </Col>
          </Row>
        </Col>

        {/* 3. Card List */}
        <Col span={24}>
          <Title level={3}>3. Bố cục danh sách (Card List Grid)</Title>
          <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
            Sử dụng <code>CCardList</code> để tạo lưới danh sách card tự động
            chia cột và responsive.
          </Paragraph>

          <CCardList columns={3}>
            <CCard title="Dự án Alpha" hoverable>
              <Paragraph>Nội dung tóm tắt dự án Alpha.</Paragraph>
              <Tag color="blue">Kế hoạch</Tag>
            </CCard>
            <CCard title="Dự án Beta" hoverable>
              <Paragraph>Nội dung tóm tắt dự án Beta.</Paragraph>
              <Tag color="green">Đang chạy</Tag>
            </CCard>
            <CCard title="Dự án Gamma" hoverable>
              <Paragraph>Nội dung tóm tắt dự án Gamma.</Paragraph>
              <Tag color="orange">Tạm dừng</Tag>
            </CCard>
          </CCardList>
        </Col>

        {/* 4. Horizontal Card List */}
        <Col span={24}>
          <Title level={3}>
            4. Danh sách dạng ngang (Horizontal List Cards)
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
            Mẫu card nằm ngang thích hợp cho danh sách kết quả tìm kiếm, danh
            mục sản phẩm hoặc bài viết.
          </Paragraph>

          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {/* Horizontal Card 1 */}
            <CCard hoverable>
              <div
                style={{ display: "flex", gap: "20px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "80px",
                    background: "rgba(10, 67, 109, 0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Layers size={32} color="var(--color-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Title level={4} style={{ margin: "0 0 4px 0" }}>
                        Tàu CSCL STAR (IMO: 9464352)
                      </Title>
                      <Paragraph style={{ margin: 0 }} type="secondary">
                        Tàu container cỡ lớn thuộc sở hữu của hãng tàu COSCO.
                        Đang hành trình từ Cảng Thượng Hải đến Cảng Cái Mép.
                      </Paragraph>
                    </div>
                    <Tag color="processing">Đang hành trình</Tag>
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space size="large">
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        Sức chở: 14,074 TEU
                      </Text>
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        ETA: 2026-05-21 14:00
                      </Text>
                    </Space>
                    <Text
                      strong
                      style={{
                        color: "var(--color-primary)",
                        cursor: "pointer",
                      }}
                    >
                      Chi tiết →
                    </Text>
                  </div>
                </div>
              </div>
            </CCard>

            {/* Horizontal Card 2 */}
            <CCard hoverable>
              <div
                style={{ display: "flex", gap: "20px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "80px",
                    background: "rgba(250, 173, 20, 0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CreditCard size={32} color="var(--color-warning)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Title level={4} style={{ margin: "0 0 4px 0" }}>
                        Tàu EVER GIVEN (IMO: 9811000)
                      </Title>
                      <Paragraph style={{ margin: 0 }} type="secondary">
                        Tàu container cỡ lớn nổi tiếng của hãng Evergreen. Hiện
                        đang neo đậu tại khu vực chờ ngoài khơi.
                      </Paragraph>
                    </div>
                    <Tag color="warning">Đang neo chờ</Tag>
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space size="large">
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        Sức chở: 20,124 TEU
                      </Text>
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        ETA: 2026-05-23 08:00
                      </Text>
                    </Space>
                    <Text
                      strong
                      style={{
                        color: "var(--color-primary)",
                        cursor: "pointer",
                      }}
                    >
                      Chi tiết →
                    </Text>
                  </div>
                </div>
              </div>
            </CCard>
          </Space>
        </Col>

        {/* 5. Card with List Content */}
        <Col span={24}>
          <Title level={3}>
            5. Card chứa danh sách (Card with List Content)
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
            Card đóng vai trò là container chứa một danh sách các đối tượng bên
            trong.
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <CCard title="Hoạt động cảng gần đây" hoverable>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircle size={16} color="var(--color-success)" />
                    <div style={{ flex: 1 }}>
                      <Text strong>Tàu CSCL STAR cập cảng thành công</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Cầu cảng số 2 - 10 phút trước
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Clock size={16} color="var(--color-warning)" />
                    <div style={{ flex: 1 }}>
                      <Text strong>Yêu cầu xếp dỡ cho tàu EVER GIVEN</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Chờ phê duyệt kế hoạch - 1 giờ trước
                        </Text>
                      </div>
                    </div>
                  </div>
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <Info size={16} color="var(--color-info)" />
                    <div style={{ flex: 1 }}>
                      <Text strong>
                        Hoàn thành thủ tục hải quan lô hàng CN123
                      </Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Chi cục HQ Cái Mép - 5 giờ trước
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </CCard>
            </Col>

            <Col span={24} md={12}>
              <CCard title="Công việc cần xử lý (To-Do)" hoverable>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <CheckCircle size={16} color="var(--color-success)" />
                      <Text delete>Kiểm tra mớn nước tàu EVER GIVEN</Text>
                    </Space>
                    <Tag color="success">Done</Tag>
                  </div>
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Clock size={16} color="var(--color-warning)" />
                      <Text>Liên hệ hoa tiêu cho tàu CSCL STAR</Text>
                    </Space>
                    <Tag color="warning">Pending</Tag>
                  </div>
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Clock size={16} color="var(--color-muted-foreground)" />
                      <Text>Lập kế hoạch xếp dỡ bãi CY</Text>
                    </Space>
                    <Tag color="default">Todo</Tag>
                  </div>
                </div>
              </CCard>
            </Col>
          </Row>
        </Col>
      </Row>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">
          Task Design System - UI Components Showcase
        </Text>
      </footer>
    </div>
  );
}
