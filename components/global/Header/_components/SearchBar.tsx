"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import styles from "../AppHeader.module.scss";

/**
 * SearchBar — Command palette style search input.
 * Supports Ctrl+K / Cmd+K keyboard shortcut.
 */
const SearchBar: React.FC = () => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`${styles.searchBar} ${focused ? styles.searchBarFocused : ""}`}
    >
      <Search size={16} className={styles.searchIcon} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search..."
        className={styles.searchInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <kbd className={styles.searchKbd}>
        <span>⌘</span>K
      </kbd>
    </div>
  );
};

export default SearchBar;
