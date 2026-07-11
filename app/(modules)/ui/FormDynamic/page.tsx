/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Typography, Card, Divider, Button, Space } from "antd";
import { FormDynamic } from "@/components/global/FormDynamic";
import type { FormFieldSchema } from "@/components/global/FormDynamic";

const { Title, Paragraph, Text } = Typography;

const sampleSchema: FormFieldSchema[] = [
  {
    type: "group",
    groupTitle: "Thông tin cơ bản",
    span: 24,
    order: 1,
    children: [
      {
        name: "fullname",
        label: "Họ và tên",
        type: "input",
        span: 12,
        required: true,
        rules: [
          { required: true, message: "Vui lòng nhập họ tên!" },
          { min: 5, message: "Họ tên phải có ít nhất 5 ký tự" },
        ],
        componentProps: {
          placeholder: "Nhập họ tên đầy đủ...",
          mandatory: true,
        },
      },
      {
        name: "email",
        label: "Email công việc",
        type: "input",
        span: 12,
        required: true,
        rules: [
          { required: true, message: "Vui lòng nhập email!" },
          { type: "email", message: "Email không hợp lệ!" },
        ],
        componentProps: {
          placeholder: "example@Task.vn",
          mandatory: true,
        },
      },
      {
        name: "password",
        label: "Mật khẩu",
        type: "password",
        span: 12,
        required: true,
        rules: [
          { required: true, message: "Vui lòng nhập mật khẩu!" },
          { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
        ],
        componentProps: {
          placeholder: "Bảo mật tài khoản...",
          mandatory: true,
        },
      },
      {
        name: "age",
        label: "Tuổi",
        type: "number",
        span: 12,
        rules: [
          { type: "number", min: 18, message: "Phải từ 18 tuổi trở lên" },
        ],
        componentProps: {
          placeholder: "Nhập tuổi...",
          min: 0,
        },
      },
      {
        name: "dob",
        label: "Ngày sinh",
        type: "datepicker",
        span: 12,
        required: true,
        rules: [{ required: true, message: "Vui lòng chọn ngày sinh!" }],
        componentProps: {
          mandatory: true,
          format: "DD/MM/YYYY",
        },
      },
      {
        name: "working_time",
        label: "Ca làm việc",
        type: "timerangepicker",
        span: 12,
        componentProps: {
          format: "HH:mm",
        },
      },
    ],
  },
  {
    type: "group",
    groupTitle: "Thông tin nghề nghiệp",
    span: 24,
    order: 2,
    children: [
      {
        name: "role",
        label: "Vai trò trong hệ thống",
        type: "select",
        span: 8,
        required: true,
        rules: [{ required: true, message: "Vui lòng chọn vai trò!" }],
        componentProps: {
          mandatory: true,
          options: [
            { label: "Quản trị viên (Admin)", value: "admin" },
            { label: "Nhân viên (Staff)", value: "staff" },
            { label: "Khách (Guest)", value: "guest" },
          ],
        },
      },
      {
        name: "skills",
        label: "Kỹ năng (Cascader)",
        type: "cascader",
        span: 8,
        componentProps: {
          placeholder: "Chọn kỹ năng...",
          options: [
            {
              value: "frontend",
              label: "Frontend",
              children: [
                { value: "react", label: "React" },
                { value: "nextjs", label: "Next.js" },
              ],
            },
            {
              value: "backend",
              label: "Backend",
              children: [
                { value: "nodejs", label: "Node.js" },
                { value: "java", label: "Java" },
              ],
            },
          ],
        },
      },
      {
        name: "department",
        label: "Phòng ban (TreeSelect)",
        type: "treeselect",
        span: 8,
        componentProps: {
          placeholder: "Chọn phòng ban...",
          treeData: [
            {
              title: "Ban Giám Đốc",
              value: "bod",
              children: [
                { title: "CEO", value: "ceo" },
                { title: "CTO", value: "cto" },
              ],
            },
            {
              title: "Khối Kỹ Thuật",
              value: "tech",
            },
          ],
        },
      },
    ],
  },
  {
    type: "group",
    groupTitle: "Cài đặt hệ thống & Ghi chú",
    span: 24,
    order: 3,
    children: [
      {
        name: "notifications",
        label: "Nhận thông báo qua Email",
        type: "switch",
        span: 6,
        valuePropName: "checked",
      },
      {
        name: "theme",
        label: "Giao diện",
        type: "radio-group",
        span: 8,
        componentProps: {
          options: [
            { label: "Sáng", value: "light" },
            { label: "Tối", value: "dark" },
            { label: "Hệ thống", value: "system" },
          ],
        },
      },
      {
        name: "agreements",
        label: "Đồng ý điều khoản",
        type: "checkbox-group",
        span: 10,
        rules: [
          { required: true, message: "Phải đồng ý ít nhất 1 điều khoản!" },
        ],
        componentProps: {
          options: [
            { label: "Bảo mật", value: "privacy" },
            { label: "Dịch vụ", value: "tos" },
          ],
        },
      },
      {
        name: "notes",
        label: "Giới thiệu bản thân (TextArea)",
        type: "textarea",
        span: 24,
        rules: [{ max: 500, message: "Không được vượt quá 500 ký tự" }],
        componentProps: {
          rows: 4,
          placeholder: "Nhập một đoạn giới thiệu ngắn về bản thân bạn...",
          showCount: true,
          maxLength: 500,
        },
      },
      {
        name: "terms",
        type: "checkbox",
        span: 24,
        valuePropName: "checked",
        rules: [
          {
            validator: (_: any, value: boolean) =>
              value
                ? Promise.resolve()
                : Promise.reject(
                    new Error(
                      "Bạn phải đồng ý với điều khoản sử dụng cuối cùng!",
                    ),
                  ),
          },
        ],
        componentProps: {
          children: "Tôi xác nhận mọi thông tin trên là hoàn toàn chính xác.",
        },
      },
    ],
  },
];

export default function FormDynamicShowcasePage() {
  const onFinish = (values: any) => {
    console.log("Success:", values);
    alert(JSON.stringify(values, null, 2));
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <Title
          level={1}
          style={{ color: "var(--color-primary)", marginBottom: "8px" }}
        >
          FormDynamic Component Showcase
        </Title>
        <Paragraph type="secondary" style={{ fontSize: "16px" }}>
          Một engine mạnh mẽ cho phép tạo Form động hoàn toàn dựa trên cấu hình
          JSON, kết hợp grid layout và toàn bộ Task UI.
        </Paragraph>
      </header>

      <Card
        title="Demo Form Render từ JSON"
        variant="borderless"
        className="shadow-sm"
      >
        <FormDynamic
          schema={sampleSchema}
          onFinish={onFinish}
          layout="vertical"
        >
          <div style={{ textAlign: "right", marginTop: "24px" }}>
            <Space>
              <Button htmlType="reset">Hủy</Button>
              <Button type="primary" htmlType="submit">
                Lưu cấu hình
              </Button>
            </Space>
          </div>
        </FormDynamic>
      </Card>

      <footer style={{ marginTop: "48px", textAlign: "center" }}>
        <Divider />
        <Text type="secondary">Task Design System - FormDynamic Engine</Text>
      </footer>
    </div>
  );
}
