import { ICellRendererParams } from "@ag-grid-community/core";
import React from "react";
// import { ICellRendererParams } from "ag-grid-community";
import { AlertCircle } from "lucide-react";

export const ErrorCellRenderer = (props: ICellRendererParams) => {
  if (props.data?.isError) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <AlertCircle
          style={{ color: "red", marginRight: "4px" }}
          size={16}
        />
        {props.value}
      </div>
    );
  }

  return <div>{props.value}</div>;
};

export default ErrorCellRenderer;
