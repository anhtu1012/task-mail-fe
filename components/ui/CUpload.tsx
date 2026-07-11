"use client";

import React from "react";
import { Upload, UploadProps } from "antd";
import { UploadCloud } from "lucide-react";

const { Dragger } = Upload;

interface CUploadProps extends UploadProps {
  /** Visual variant */
  variant?: "default" | "dragger";
  /** Custom dragger description */
  draggerDescription?: string;
  /** Custom dragger hint */
  draggerHint?: string;
}

const CUpload: React.FC<CUploadProps> = ({
  variant = "default",
  draggerDescription = "Click or drag file to this area to upload",
  draggerHint = "Support for a single or bulk upload.",
  className = "",
  children,
  ...restProps
}) => {
  if (variant === "dragger") {
    return (
      <Dragger
        className={`c-upload c-upload-dragger ${className}`.trim()}
        {...restProps}
      >
        {children || (
          <>
            <p className="c-upload-icon">
              <UploadCloud size={40} strokeWidth={1.5} />
            </p>
            <p className="c-upload-text">{draggerDescription}</p>
            <p className="c-upload-hint">{draggerHint}</p>
          </>
        )}
      </Dragger>
    );
  }

  return (
    <Upload
      className={`c-upload ${className}`.trim()}
      {...restProps}
    >
      {children}
    </Upload>
  );
};

export default CUpload;
export type { CUploadProps };
