"use client";

import dynamic from "next/dynamic";

export const AutoCompletePage = dynamic(() => import("@/app/(modules)/ui/AutoComplete/page"), { ssr: false });
export const CascaderPage = dynamic(() => import("@/app/(modules)/ui/Cascader/page"), { ssr: false });
export const CheckboxPage = dynamic(() => import("@/app/(modules)/ui/Checkbox/page"), { ssr: false });
export const ColorPickerPage = dynamic(() => import("@/app/(modules)/ui/ColorPicker/page"), { ssr: false });
export const DatePickerPage = dynamic(() => import("@/app/(modules)/ui/DatePicker/page"), { ssr: false });
export const FormDynamicPage = dynamic(() => import("@/app/(modules)/ui/FormDynamic/page"), { ssr: false });
export const InputPage = dynamic(() => import("@/app/(modules)/ui/Input/page"), { ssr: false });
export const InputNumberPage = dynamic(() => import("@/app/(modules)/ui/InputNumber/page"), { ssr: false });
export const RadioPage = dynamic(() => import("@/app/(modules)/ui/Radio/page"), { ssr: false });
export const SelectPage = dynamic(() => import("@/app/(modules)/ui/Select/page"), { ssr: false });
export const SwitchPage = dynamic(() => import("@/app/(modules)/ui/Switch/page"), { ssr: false });
export const TimePickerPage = dynamic(() => import("@/app/(modules)/ui/TimePicker/page"), { ssr: false });
export const TransferPage = dynamic(() => import("@/app/(modules)/ui/Transfer/page"), { ssr: false });
export const TreeSelectPage = dynamic(() => import("@/app/(modules)/ui/TreeSelect/page"), { ssr: false });
export const UploadPage = dynamic(() => import("@/app/(modules)/ui/Upload/page"), { ssr: false });
