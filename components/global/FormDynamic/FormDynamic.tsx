/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Col, Form, FormInstance, FormProps, Row, Typography } from "antd";
import React, { useMemo } from "react";

// Import all premium Task UI components
import CCascader from "@/components/ui/CCascader";
import CCheckbox, { CCheckboxGroup } from "@/components/ui/CCheckbox";
import CDatePicker, { CRangePicker } from "@/components/ui/CDatePicker";
import CInput, { CPassword, CSearch, CTextArea } from "@/components/ui/CInput";
import CInputNumber from "@/components/ui/CInputNumber";
import { CRadioGroup } from "@/components/ui/CRadio";
import CSelect from "@/components/ui/CSelect";
import CSwitch from "@/components/ui/CSwitch";
import CTimePicker, { CTimeRangePicker } from "@/components/ui/CTimePicker";
import CTreeSelect from "@/components/ui/CTreeSelect";

const { Title } = Typography;

export type FieldType =
  | "input"
  | "textarea"
  | "password"
  | "search"
  | "number"
  | "select"
  | "datepicker"
  | "rangepicker"
  | "timepicker"
  | "timerangepicker"
  | "checkbox"
  | "checkbox-group"
  | "radio-group"
  | "switch"
  | "cascader"
  | "treeselect"
  | "group"; // Special type for nested grouping

export interface FormFieldSchema {
  /** The unique field name. Can be an array for nested paths e.g. ['user', 'name'] */
  name?: string | string[];
  /** Label for the form item */
  label?: string;
  /** Type of UI component to render */
  type: FieldType;
  /** Width of the grid column out of 24. Default is 24 (100%) */
  span?: number;
  /** Index for ordering/sorting items. Lower numbers appear first. */
  order?: number;

  /* --- Ant Design Form.Item Props --- */
  rules?: any[];
  required?: boolean;
  hidden?: boolean;
  tooltip?: React.ReactNode;
  valuePropName?: string;
  dependencies?: string[];
  help?: React.ReactNode;
  extra?: React.ReactNode;
  normalize?: (value: any, prevValue: any, allValues: any) => any;

  /* --- Internal Component Props --- */
  /** Props spread directly to the underlying input component (CInput, CSelect, etc.) */
  componentProps?: Record<string, any>;

  /* --- Group Specific Props --- */
  /** Title displayed above the group of fields */
  groupTitle?: string;
  /** Nested fields when type === "group" */
  children?: FormFieldSchema[];
}

export interface FormDynamicProps extends Omit<FormProps, "fields"> {
  /** The JSON schema defining the form structure */
  schema: FormFieldSchema[];
  /** Optional form instance from Form.useForm() */
  form?: FormInstance;
  /** Global layout constraint */
  layout?: "horizontal" | "vertical" | "inline";
  /** Row gutter spacing. Default [24, 16] */
  gutter?: [number, number];
}

/**
 * Maps the type string to the actual Task UI Component.
 */
const renderComponent = (field: FormFieldSchema) => {
  const { type, componentProps = {} } = field;
  // We force full width by default so the component fills the Col.
  const props: any = { full: true, ...componentProps };

  switch (type) {
    case "input":
      return <CInput {...props} />;
    case "textarea":
      return <CTextArea {...props} />;
    case "password":
      return <CPassword {...props} />;
    case "search":
      return <CSearch {...props} />;
    case "number":
      return <CInputNumber {...props} />;
    case "select":
      return <CSelect {...props} />;
    case "datepicker":
      return <CDatePicker {...props} />;
    case "rangepicker":
      return <CRangePicker {...props} />;
    case "timepicker":
      return <CTimePicker {...props} />;
    case "timerangepicker":
      return <CTimeRangePicker {...props} />;
    case "checkbox":
      return <CCheckbox {...props} />;
    case "checkbox-group":
      return <CCheckboxGroup {...props} />;
    case "radio-group":
      return <CRadioGroup {...props} />;
    case "switch":
      return <CSwitch {...props} />;
    case "cascader":
      return <CCascader {...props} />;
    case "treeselect":
      return <CTreeSelect {...props} />;
    default:
      return <CInput {...props} />;
  }
};

/**
 * Recursively renders fields and groups.
 */
const renderField = (field: FormFieldSchema, index: number) => {
  if (field.hidden) return null;

  // Handle grouping structure
  if (field.type === "group") {
    return (
      <Col span={field.span || 24} key={`group-${index}`}>
        <div className="form-dynamic-group">
          {field.groupTitle && (
            <Title level={5} className="form-dynamic-group-title">
              {field.groupTitle}
            </Title>
          )}
          <Row gutter={[24, 16]}>
            {field.children
              ?.slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((child, idx) => renderField(child, idx))}
          </Row>
        </div>
      </Col>
    );
  }

  // Determine standard valuePropName for booleans
  let valuePropName = field.valuePropName;
  if (!valuePropName) {
    if (field.type === "switch" || field.type === "checkbox") {
      valuePropName = "checked";
    }
  }

  // Handle required status visually if 'mandatory' is passed into componentProps
  const isMandatory = field.componentProps?.mandatory || field.required;

  return (
    <Col
      span={field.span || 24}
      key={field.name ? String(field.name) : `field-${index}`}
    >
      <Form.Item
        name={field.name}
        label={field.label}
        rules={field.rules}
        required={isMandatory}
        tooltip={field.tooltip}
        valuePropName={valuePropName}
        dependencies={field.dependencies}
        help={field.help}
        extra={field.extra}
        normalize={field.normalize}
      >
        {renderComponent(field)}
      </Form.Item>
    </Col>
  );
};

export default function FormDynamic({
  schema,
  form: externalForm,
  layout = "vertical",
  gutter = [12, 8],
  onFinish,
  onFinishFailed,
  ...restProps
}: FormDynamicProps) {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;

  // Default submission handler if none is provided
  const handleFinish = (values: any) => {
    if (onFinish) {
      onFinish(values);
    } else {
      console.log("FormDynamic submitted successfully:", values);
    }
  };

  // Default error handler if none is provided
  const handleFinishFailed = (errorInfo: any) => {
    if (onFinishFailed) {
      onFinishFailed(errorInfo);
    } else {
      console.error("FormDynamic validation failed:", errorInfo);
    }
  };

  // Sort top-level schema elements by the "order" property
  const sortedSchema = useMemo(() => {
    return [...schema].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [schema]);

  return (
    <Form
      form={form}
      layout={layout}
      className="c-form"
      onFinish={handleFinish}
      onFinishFailed={handleFinishFailed}
      {...restProps}
    >
      <Row gutter={gutter}>
        {sortedSchema.map((field, index) => renderField(field, index))}
      </Row>
    </Form>
  );
}
