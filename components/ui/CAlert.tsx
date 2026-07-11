"use client";

import React from "react";
import { Alert, AlertProps } from "antd";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface CAlertProps extends AlertProps {
  showIcon?: boolean;
}

/**
 * CAlert - A customized Ant Design Alert with Lucide icons and premium styling.
 */
const CAlert: React.FC<CAlertProps> = ({
  type = "info",
  showIcon = true,
  icon,
  className = "",
  message,
  title,
  ...props
}) => {
  // Map Antd types to Lucide icons
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} />;
      case "warning":
        return <AlertTriangle size={18} />;
      case "error":
        return <XCircle size={18} />;
      case "info":
      default:
        return <Info size={18} />;
    }
  };

  return (
    <Alert
      {...props}
      // Use title if provided, fallback to message (for compatibility)
      // AntD v6 deprecated 'message' in favor of 'title'
      title={title || message} 
      type={type}
      showIcon={showIcon}
      icon={getIcon()}
      className={`stos-alert-premium stos-alert-${type} ${className}`.trim()}
    />
  );
};

export default CAlert;
