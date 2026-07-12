"use client";

import React from "react";
import styles from "./MainContent.module.scss";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  const containerClasses = [styles.mainContent, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return <main className={containerClasses}>{children}</main>;
};

export default MainContent;
