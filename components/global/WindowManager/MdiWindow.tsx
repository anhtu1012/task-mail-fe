"use client";

import React, { useState, useRef, useEffect } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { useWindowMode, MdiWindowItem } from "@/contexts/WindowModeContext";
import styles from "./MdiWindow.module.scss";

interface MdiWindowProps {
  window: MdiWindowItem;
  children: React.ReactNode;
}

export const MdiWindow: React.FC<MdiWindowProps> = ({ window, children }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, activeWindowId, theme } = useWindowMode();
  
  const [position, setPosition] = useState({ x: window.x, y: window.y });
  const [size, setSize] = useState({ w: window.w, h: window.h });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const isResizing = useRef(false);
  const resizeDir = useRef<string | null>(null);
  const resizeStartGeometry = useRef({ x: 0, y: 0, w: 0, h: 0, mouseX: 0, mouseY: 0 });

  const isActive = activeWindowId === window.id;

  // Sync positions from context window triggers (e.g. when opening cascading) without triggering cascading renders or useEffect warnings
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setPosition({ x: window.x, y: window.y });
      setSize({ w: window.w, h: window.h });
    });
    return () => cancelAnimationFrame(handle);
  }, [window.x, window.y, window.w, window.h]);

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.isMaximized) return;
    
    // Don't drag if clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.controlBtn}`)) return;
    
    focusWindow(window.id);
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      let newX = e.clientX - dragStart.current.x;
      let newY = e.clientY - dragStart.current.y;
      
      // Keep inside workspace boundaries roughly
      const maxX = (typeof window !== "undefined" ? globalThis.innerWidth : 1920) - 100;
      const maxY = (typeof window !== "undefined" ? globalThis.innerHeight : 1080) - 100;
      newX = Math.max(-size.w + 100, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Resize logic
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(window.id);
    
    isResizing.current = true;
    resizeDir.current = direction;
    resizeStartGeometry.current = {
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    
    const geom = resizeStartGeometry.current;
    const dir = resizeDir.current;
    
    const deltaX = e.clientX - geom.mouseX;
    const deltaY = e.clientY - geom.mouseY;
    
    let newX = geom.x;
    let newY = geom.y;
    let newW = geom.w;
    let newH = geom.h;
    
    const minW = 300;
    const minH = 200;
    
    // East / West
    if (dir?.includes("e")) {
      newW = Math.max(minW, geom.w + deltaX);
    } else if (dir?.includes("w")) {
      const calculatedW = geom.w - deltaX;
      newW = Math.max(minW, calculatedW);
      newX = geom.x + (geom.w - newW);
    }
    
    // South / North
    if (dir?.includes("s")) {
      newH = Math.max(minH, geom.h + deltaY);
    } else if (dir?.includes("n")) {
      const calculatedH = geom.h - deltaY;
      newH = Math.max(minH, calculatedH);
      newY = geom.y + (geom.h - newH);
    }
    
    setPosition({ x: newX, y: newY });
    setSize({ w: newW, h: newH });
  };

  const handleResizeMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  const handleWindowClick = () => {
    if (!isActive) {
      focusWindow(window.id);
    }
  };

  if (window.isMinimized) {
    return null;
  }

  const windowStyle: React.CSSProperties = window.isMaximized
    ? {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "calc(100% - 50px)", // taskbar space
        zIndex: window.zIndex,
      }
    : {
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
        zIndex: window.zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={`${styles.windowFrame} ${isActive ? styles.windowActive : ""} ${
        window.isMaximized ? styles.windowMaximized : ""
      } ${theme === "light" ? styles.themeLight : ""}`}
      style={windowStyle}
      onClick={handleWindowClick}
    >
      {/* Titlebar */}
      <div className={styles.titlebar} onMouseDown={handleMouseDown} onDoubleClick={() => maximizeWindow(window.id)}>
        <div className={styles.titleText}>
          <span className={styles.dotIndicator} style={{
            backgroundColor: isActive ? "#00f0ff" : "#64748b",
            boxShadow: isActive ? "0 0 8px #00f0ff" : "none"
          }} />
          <span>{window.title}</span>
        </div>
        
        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${styles.btnMinimize}`}
            onClick={() => minimizeWindow(window.id)}
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          
          <button
            className={`${styles.controlBtn} ${styles.btnMaximize}`}
            onClick={() => maximizeWindow(window.id)}
            title={window.isMaximized ? "Restore" : "Maximize"}
          >
            {window.isMaximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          
          <button
            className={`${styles.controlBtn} ${styles.btnClose}`}
            onClick={() => closeWindow(window.id)}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Content wrapper */}
      <div className={styles.windowContent}>
        {children}
      </div>
      
      {/* Resizers for all edges & corners */}
      {!window.isMaximized && (
        <>
          <div className={`${styles.resizer} ${styles.resizerN}`} onMouseDown={(e) => handleResizeStart(e, "n")} />
          <div className={`${styles.resizer} ${styles.resizerS}`} onMouseDown={(e) => handleResizeStart(e, "s")} />
          <div className={`${styles.resizer} ${styles.resizerE}`} onMouseDown={(e) => handleResizeStart(e, "e")} />
          <div className={`${styles.resizer} ${styles.resizerW}`} onMouseDown={(e) => handleResizeStart(e, "w")} />
          <div className={`${styles.resizer} ${styles.resizerNW}`} onMouseDown={(e) => handleResizeStart(e, "nw")} />
          <div className={`${styles.resizer} ${styles.resizerNE}`} onMouseDown={(e) => handleResizeStart(e, "ne")} />
          <div className={`${styles.resizer} ${styles.resizerSW}`} onMouseDown={(e) => handleResizeStart(e, "sw")} />
          <div className={`${styles.resizer} ${styles.resizerSE}`} onMouseDown={(e) => handleResizeStart(e, "se")} />
        </>
      )}
    </div>
  );
};

export default MdiWindow;
