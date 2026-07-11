"use client";

import React, { useState } from "react";
import { Checkbox, ColorPicker, ColorPickerProps } from "antd";

const DEFAULT_PRESETS = [
  {
    label: "Màu cơ bản",
    colors: [
      "#ff0000", "#ff4500", "#ff8c00", "#ffa500",
      "#ffd700", "#ffff00", "#adff2f", "#00ff00",
      "#00fa9a", "#00ffff", "#00bfff", "#1e90ff",
      "#0000ff", "#8a2be2", "#9400d3", "#ff1493",
      "#ff69b4", "#ffffff", "#d3d3d3", "#808080",
      "#404040", "#000000", "#8b4513", "#006400",
    ],
  },
];

interface CColorPickerProps extends ColorPickerProps {
  /** Optional label */
  label?: React.ReactNode;
  /** Hiện 24 màu cơ bản để chọn nhanh */
  showPresets?: boolean;
}

/**
 * Panel: bảng màu cơ bản (tổ ong) hiện trước; bảng màu pha (mixer) chỉ hiện
 * khi tick "Bảng màu pha".
 */
const PresetFirstPanel: React.FC<{
  Picker: React.FC;
  Presets: React.FC;
}> = ({ Picker, Presets }) => {
  const [showMixer, setShowMixer] = useState(false);
  return (
    <div className="c-colorpicker-panel">
      <Presets />
      <label className="c-colorpicker-mix-toggle">
        <Checkbox
          checked={showMixer}
          onChange={(e) => setShowMixer(e.target.checked)}
        />
        Bảng màu pha
      </label>
      {showMixer && (
        <div className="c-colorpicker-mixer">
          <Picker />
        </div>
      )}
    </div>
  );
};

const CColorPicker: React.FC<CColorPickerProps> = ({
  label,
  showPresets = false,
  className = "",
  panelRender,
  ...restProps
}) => {
  const presets = showPresets ? DEFAULT_PRESETS : undefined;

  // Khi bật presets: hiện BẢNG MÀU CƠ BẢN (tổ ong) trước, có nút tick mở bảng màu pha
  const resolvedPanelRender: ColorPickerProps["panelRender"] =
    panelRender ??
    (showPresets
      ? (_panel, { components: { Picker, Presets } }) => (
          <PresetFirstPanel Picker={Picker} Presets={Presets} />
        )
      : undefined);

  if (!label) {
    return (
      <ColorPicker
        className={`c-colorpicker ${className}`.trim()}
        presets={presets}
        panelRender={resolvedPanelRender}
        {...restProps}
      />
    );
  }

  return (
    <div className="c-colorpicker-wrapper">
      <span className="c-colorpicker-label">{label}</span>
      <ColorPicker
        className={`c-colorpicker ${className}`.trim()}
        presets={presets}
        panelRender={resolvedPanelRender}
        {...restProps}
      />
    </div>
  );
};

export default CColorPicker;
export type { CColorPickerProps };
