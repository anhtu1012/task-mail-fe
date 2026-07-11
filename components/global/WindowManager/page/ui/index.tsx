"use client";

import React from "react";
import * as Inputs from "./inputs";
import * as Feedback from "./feedback";
import * as Data from "./data";
import * as General from "./general";

interface UiModuleRendererProps {
  moduleCode: string;
}

export const UiModuleRenderer: React.FC<UiModuleRendererProps> = ({ moduleCode }) => {
  const code = moduleCode.toUpperCase();

  switch (code) {
    // Inputs components
    case "AUTOCOMPLETE":
      return <Inputs.AutoCompletePage />;
    case "CASCADER":
      return <Inputs.CascaderPage />;
    case "CHECKBOX":
      return <Inputs.CheckboxPage />;
    case "COLOR-PICKER":
      return <Inputs.ColorPickerPage />;
    case "DATEPICKER":
      return <Inputs.DatePickerPage />;
    case "FORM-DYNAMIC":
      return <Inputs.FormDynamicPage />;
    case "INPUT":
      return <Inputs.InputPage />;
    case "INPUT-NUMBER":
      return <Inputs.InputNumberPage />;
    case "RADIO":
      return <Inputs.RadioPage />;
    case "SELECT":
      return <Inputs.SelectPage />;
    case "SWITCH":
      return <Inputs.SwitchPage />;
    case "TIMEPICKER":
      return <Inputs.TimePickerPage />;
    case "TRANSFER":
      return <Inputs.TransferPage />;
    case "TREESELECT":
      return <Inputs.TreeSelectPage />;
    case "UPLOAD":
      return <Inputs.UploadPage />;

    // Feedback components
    case "ALERT":
      return <Feedback.CAlertPage />;
    case "MESSAGE":
      return <Feedback.CMessagePage />;
    case "MODAL":
      return <Feedback.CModalPage />;
    case "NOTIFICATION":
      return <Feedback.CNotificationPage />;

    // Data / Display components
    case "CARD":
      return <Data.CardPage />;
    case "CTABLE-AG":
      return <Data.CTableAgPage />;

    // General / Layout components
    case "BUTTON":
      return <General.ButtonPage />;
    case "LAYOUT-CONTENT":
      return <General.LayoutContentPage />;
    case "SEGMENTED":
      return <General.SegmentedPage />;

    default:
      return null;
  }
};

export default UiModuleRenderer;
