"use client";

import React from "react";
import styles from "./MainContent.module.scss";

import { useWindowMode } from "@/contexts/WindowModeContext";
import DesktopWorkspace from "@/components/global/WindowManager/DesktopWorkspace";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  const { layoutMode } = useWindowMode();

  const containerClasses = [
    styles.mainContent,
    layoutMode === "desktop" ? styles.mainContentDesktop : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={containerClasses}>
      {layoutMode === "desktop" ? <DesktopWorkspace /> : children}
    </main>
  );
};

export default MainContent;
