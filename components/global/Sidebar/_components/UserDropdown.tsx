"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronsUpDown,
  LogOut,
  CreditCard,
  Bell,
  User,
  Sparkles,
} from "lucide-react";
import type { UserInfo } from "../_types/types";
import styles from "../AppSidebar.module.scss";

interface UserDropdownProps {
  user: UserInfo;
  collapsed: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ user, collapsed }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.userSection} ref={dropdownRef}>
      <button
        className={styles.userTrigger}
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? user.name : undefined}
      >
        <div className={styles.userAvatar}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {!collapsed && (
          <>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <ChevronsUpDown size={16} className={styles.userChevron} />
          </>
        )}
      </button>

      {open && (
        <div className={styles.userDropdown}>
          <div className={styles.dropdownUserHeader}>
            <div className={styles.userAvatar}>
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>

          <div className={styles.dropdownDivider} />

          <button className={styles.dropdownItem}>
            <Sparkles size={16} />
            <span>Upgrade to Pro</span>
          </button>

          <div className={styles.dropdownDivider} />

          <button className={styles.dropdownItem}>
            <User size={16} />
            <span>Account</span>
          </button>
          <button className={styles.dropdownItem}>
            <CreditCard size={16} />
            <span>Billing</span>
          </button>
          <button className={styles.dropdownItem}>
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <div className={styles.dropdownDivider} />

          <button className={styles.dropdownItem}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
