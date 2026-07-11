"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronsUpDown, Repeat } from "lucide-react";
import styles from "../AppSidebar.module.scss";
import SubsystemModal from "./SubsystemModal";

interface SidebarHeaderProps {
  companyName: string;
  companyPlan: string;
  collapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  companyName,
  companyPlan,
  collapsed,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className={styles.companyHeader} 
        onClick={() => setIsModalOpen(true)}
      >
        <div className={styles.companyLogo}>
          <Image
            src="/logo-snp.svg"
            alt={companyName}
            width={1080}
            height={1170}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
        </div>
        {!collapsed && (
          <>
            <div className={styles.companyInfo}>
              <span className={styles.companyName}>{companyName}</span>
              <span className={styles.companyPlan}>{companyPlan}</span>
            </div>
            <Repeat size={16} className={styles.companyChevron} />
          </>
        )}
      </div>

      <SubsystemModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default SidebarHeader;
