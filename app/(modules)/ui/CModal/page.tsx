"use client";

import CModal from "@/components/ui/CModal";
import CButton from "@/components/ui/Cbutton";
import { App, Card, Col, Row, Space, Typography } from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  Info as InfoIcon,
  XCircle,
  UserPlus,
  Filter,
} from "lucide-react";
import React from "react";
import FormDynamic, {
  FormFieldSchema,
} from "@/components/global/FormDynamic/FormDynamic";
import { Form } from "antd";

const { Title, Paragraph } = Typography;

export default function ModalShowcasePage() {
  const { modal, message } = App.useApp(); // Use the App hook to get the context-aware instances
  const [open, setOpen] = React.useState(false);
  const [premiumOpen, setPremiumOpen] = React.useState(false);
  const [loadingOpen, setLoadingOpen] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
  const [userModalOpen, setUserModalOpen] = React.useState(false);
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);

  // Form instances for dynamic modals
  const [userForm] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Static Modal triggers using the hook-based API
  const showSuccess = () => {
    modal.success({
      title: "Thành công",
      content: "Dữ liệu của bạn đã được cập nhật thành công trên hệ thống.",
      icon: (
        <CheckCircle2 size={22} style={{ color: "var(--color-success)" }} />
      ),
      okText: "Đồng ý",
      centered: true,
      zIndex: 3000,
    });
  };

  const showWarning = () => {
    modal.warning({
      title: "Cảnh báo",
      content: "Hành động này có thể ảnh hưởng đến các bản ghi liên quan.",
      icon: (
        <AlertTriangle size={22} style={{ color: "var(--color-warning)" }} />
      ),
      okText: "Tôi đã hiểu",
      centered: true,
      zIndex: 3000,
    });
  };

  const showError = () => {
    modal.error({
      title: "Lỗi hệ thống",
      content:
        "Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền.",
      icon: <XCircle size={22} style={{ color: "var(--color-danger)" }} />,
      okText: "Thử lại",
      okButtonProps: { danger: true },
      centered: true,
      zIndex: 3000,
    });
  };

  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setLoadingOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };

  // 1. User Creation Schema
  const userSchema: FormFieldSchema[] = [
    {
      name: "fullName",
      label: "Họ và tên",
      type: "input",
      span: 12,
      required: true,
      componentProps: { placeholder: "Nhập họ tên...", mandatory: true },
    },
    {
      name: "email",
      label: "Email",
      type: "input",
      span: 12,
      rules: [{ type: "email", message: "Email không hợp lệ!" }],
      componentProps: { placeholder: "example@Task.com" },
    },
    {
      name: "role",
      label: "Vai trò",
      type: "select",
      span: 12,
      componentProps: {
        placeholder: "Chọn vai trò",
        options: [
          { label: "Admin", value: "admin" },
          { label: "Editor", value: "editor" },
          { label: "Viewer", value: "viewer" },
        ],
      },
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "switch",
      span: 12,
      valuePropName: "checked",
    },
    {
      name: "bio",
      label: "Tiểu sử",
      type: "textarea",
      span: 24,
      componentProps: { rows: 3, placeholder: "Mô tả ngắn gọn..." },
    },
  ];

  // 2. Filter Schema
  const filterSchema: FormFieldSchema[] = [
    {
      name: "dateRange",
      label: "Khoảng thời gian",
      type: "rangepicker",
      span: 24,
    },
    {
      name: "category",
      label: "Danh mục",
      type: "select",
      span: 12,
      componentProps: {
        mode: "multiple",
        options: [
          { label: "Công nghệ", value: "tech" },
          { label: "Đời sống", value: "life" },
          { label: "Kinh doanh", value: "business" },
        ],
      },
    },
    {
      name: "isPublic",
      label: "Công khai",
      type: "checkbox",
      span: 12,
    },
  ];

  const handleUserSubmit = () => {
    userForm.validateFields().then((values) => {
      setConfirmLoading(true);
      setTimeout(() => {
        modal.success({
          title: "Đã tạo người dùng",
          content: `Hệ thống đã ghi nhận: ${values.fullName}`,
        });
        setUserModalOpen(false);
        setConfirmLoading(false);
        userForm.resetFields();
      }, 1500);
    });
  };

  const handleFilterSubmit = () => {
    const values = filterForm.getFieldsValue();
    console.log("Filters applied:", values);
    message.success("Đã áp dụng bộ lọc tìm kiếm!");
    setFilterModalOpen(false);
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title level={1} style={{ color: "var(--color-primary)" }}>
          CModal Showcase
        </Title>
        <Paragraph type="secondary">
          Premium dialogs with enhanced styling, transitions, and multiple use
          cases.
        </Paragraph>
      </header>

      <Row gutter={[24, 24]}>
        {/* Row 1 */}
        <Col span={24} lg={12}>
          <Card
            title="1. Basic & Premium"
            variant="borderless"
            className="shadow-sm"
          >
            <Space orientation="vertical" style={{ width: "100%" }}>
              <CButton block onClick={() => setOpen(true)}>
                Open Basic Modal
              </CButton>
              <CButton
                block
                type="primary"
                onClick={() => setPremiumOpen(true)}
              >
                Open Premium Modal
              </CButton>
            </Space>
          </Card>
        </Col>

        <Col span={24} lg={12}>
          <Card
            title="2. Async Loading"
            variant="borderless"
            className="shadow-sm"
          >
            <Paragraph>
              Simulate a server request with a loading state on the OK button.
            </Paragraph>
            <CButton block onClick={() => setLoadingOpen(true)}>
              Open Loading Modal
            </CButton>
          </Card>
        </Col>

        {/* Row 2: Status Modals */}
        <Col span={24}>
          <Card
            title="3. Status Modals (Success/Warning/Error)"
            variant="borderless"
            className="shadow-sm"
          >
            <Space wrap size="middle">
              <CButton
                onClick={showSuccess}
                style={{
                  borderColor: "var(--color-success)",
                  color: "var(--color-success)",
                }}
              >
                Success Modal
              </CButton>
              <CButton
                onClick={showWarning}
                style={{
                  borderColor: "var(--color-warning)",
                  color: "var(--color-warning)",
                }}
              >
                Warning Modal
              </CButton>
              <CButton onClick={showError} danger>
                Error Modal
              </CButton>
            </Space>
          </Card>
        </Col>

        {/* Row 3 */}
        <Col span={24} md={12}>
          <Card
            title="4. Fullscreen Experience"
            variant="borderless"
            className="shadow-sm"
          >
            <Paragraph>
              Large modals for complex forms or data management.
            </Paragraph>
            <CButton block onClick={() => setFullscreenOpen(true)}>
              Open Fullscreen Modal
            </CButton>
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card
            title="5. Custom Footer"
            variant="borderless"
            className="shadow-sm"
          >
            <Paragraph>
              Completely customized action buttons at the bottom.
            </Paragraph>
            <CButton block onClick={() => setOpen(true)}>
              Open Custom Footer Modal
            </CButton>
          </Card>
        </Col>

        {/* COMBINATION WITH FORMDYNAMIC */}
        <Col span={24} lg={12}>
          <Card
            title="6. Modal + FormDynamic (User)"
            variant="borderless"
            className="shadow-sm"
            style={{ borderTop: "4px solid var(--color-primary)" }}
          >
            <Paragraph>
              Kết hợp Modal với FormDynamic để tạo các form nhập liệu phức tạp
              với validation và layout linh hoạt.
            </Paragraph>
            <CButton
              block
              type="primary"
              icon={<UserPlus size={18} />}
              onClick={() => setUserModalOpen(true)}
            >
              Thêm người dùng mới
            </CButton>
          </Card>
        </Col>

        <Col span={24} lg={12}>
          <Card
            title="7. Search & Filter Modal"
            variant="borderless"
            className="shadow-sm"
            style={{ borderTop: "4px solid var(--color-info)" }}
          >
            <Paragraph>
              Sử dụng Modal làm bộ lọc nâng cao cho danh sách dữ liệu, giúp tối
              ưu không gian màn hình chính.
            </Paragraph>
            <CButton
              block
              icon={<Filter size={18} />}
              onClick={() => setFilterModalOpen(true)}
            >
              Mở bộ lọc nâng cao
            </CButton>
          </Card>
        </Col>
      </Row>

      {/* Modals Implementation - Added zIndex to ensure it's above the sidebar */}

      {/* Basic */}
      <CModal
        title="Basic Modal"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        premium={false}
        zIndex={2000}
      >
        <p>This is a standard styled modal for simple information.</p>
      </CModal>

      {/* Premium */}
      <CModal
        title="Task Premium Modal"
        open={premiumOpen}
        onOk={() => setPremiumOpen(false)}
        onCancel={() => setPremiumOpen(false)}
        premium={true}
        zIndex={2000}
      >
        <Paragraph>
          This modal uses the <b>Task-modal-premium</b> class which adds custom
          shadows, padding, and a modern close icon from the Task design system.
        </Paragraph>
      </CModal>

      {/* Async Loading */}
      <CModal
        title="Update Profile"
        open={loadingOpen}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={() => setLoadingOpen(false)}
        zIndex={2000}
      >
        <Paragraph>
          The OK button will show a loading state for 2 seconds after being
          clicked.
        </Paragraph>
      </CModal>

      {/* Fullscreen */}
      <CModal
        title="Data Analytics Dashboard"
        open={fullscreenOpen}
        width="95%"
        style={{ top: 20 }}
        onOk={() => setFullscreenOpen(false)}
        onCancel={() => setFullscreenOpen(false)}
        zIndex={2500}
      >
        <div
          style={{
            height: "70vh",
            background: "#f9f9f9",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <InfoIcon
              size={48}
              style={{ color: "var(--color-primary)", marginBottom: 16 }}
            />
            <Paragraph style={{ fontSize: 18 }}>
              Dashboard Content Ready
            </Paragraph>
            <Paragraph type="secondary">
              This modal is now forced above the sidebar using a high z-index.
            </Paragraph>
          </div>
        </div>
      </CModal>

      {/* FormDynamic: User Creation */}
      <CModal
        title="Tạo người dùng mới"
        open={userModalOpen}
        onOk={handleUserSubmit}
        onCancel={() => setUserModalOpen(false)}
        confirmLoading={confirmLoading}
        width={700}
        premium
        zIndex={2000}
      >
        <Paragraph style={{ marginBottom: "24px" }}>
          Vui lòng điền đầy đủ thông tin bên dưới để khởi tạo tài khoản mới
          trong hệ thống.
        </Paragraph>
        <FormDynamic form={userForm} schema={userSchema} />
      </CModal>

      {/* FormDynamic: Filter */}
      <CModal
        title="Bộ lọc nâng cao"
        open={filterModalOpen}
        onOk={handleFilterSubmit}
        onCancel={() => setFilterModalOpen(false)}
        okText="Áp dụng bộ lọc"
        cancelText="Đặt lại"
        width={500}
        zIndex={2000}
      >
        <FormDynamic form={filterForm} schema={filterSchema} />
      </CModal>
    </div>
  );
}
