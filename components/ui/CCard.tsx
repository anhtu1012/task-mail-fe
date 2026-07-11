"use client";

import React from "react";
import { Card, CardProps } from "antd";

interface CCardProps extends Omit<CardProps, "type"> {
  /**
   * Type of card. 'normal' for standard cards, 'info' for information cards.
   */
  type?: "normal" | "info";
  /**
   * If true, the card will have a hover effect.
   */
  hoverable?: boolean;
}

/**
 * CCard - A customized Ant Design Card with premium styling.
 * Supports a `type` prop for different visual styles.
 */
const CCard: React.FC<CCardProps> = ({
  type = "normal",
  className = "",
  hoverable = true,
  children,
  ...restProps
}) => {
  return (
    <Card
      className={`c-card c-card-${type} ${className}`.trim()}
      hoverable={hoverable}
      {...restProps}
    >
      {children}
    </Card>
  );
};

interface CCardListProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * CCardList - A grid container for CCard components.
 */
const CCardList: React.FC<CCardListProps> = ({
  children,
  className = "",
  columns = 3,
}) => {
  return (
    <div className={`c-card-list c-card-list-cols-${columns} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default CCard;
export { CCardList };
export type { CCardProps, CCardListProps };
