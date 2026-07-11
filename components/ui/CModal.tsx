"use client";

import React from "react";
import { Modal, ModalProps } from "antd";
import { X } from "lucide-react";

export interface CModalProps extends ModalProps {
  premium?: boolean;
}

/**
 * CModal - A customized Ant Design Modal with premium styling.
 * Supports standard antd props with enhanced visuals.
 */
const CModal: React.FC<CModalProps> = ({
  children,
  premium = true,
  className = "",
  closeIcon,
  ...props
}) => {
  const customClassName = `${premium ? "stos-modal-premium" : ""} ${className}`.trim();

  return (
    <Modal
      centered={props.centered ?? true}
      {...props}
      className={customClassName}
      closeIcon={closeIcon || <X size={20} className="stos-modal-close-icon" />}
    >
      <div className="stos-modal-content-wrapper">{children}</div>
    </Modal>
  );
};

export default CModal;
