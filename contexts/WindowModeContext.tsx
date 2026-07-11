"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface MdiWindowItem {
  id: string;
  title: string;
  moduleCode: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export type LayoutMode = "normal" | "desktop";

interface WindowModeContextProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  windows: MdiWindowItem[];
  setWindows: React.Dispatch<React.SetStateAction<MdiWindowItem[]>>;
  openWindow: (moduleCode: string, title?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  activeWindowId: string | null;
}

const WindowModeContext = createContext<WindowModeContextProps | undefined>(
  undefined,
);

// Default window dimensions based on module
const getWindowDefaults = (moduleCode: string) => {
  switch (moduleCode.toUpperCase()) {
    case "CA": // Category Page
      return { w: 750, h: 500 };
    case "SHIP": // Ship Page
      return { w: 850, h: 550 };
    case "UI": // UI Showcase Page
      return { w: 1000, h: 650 };
    default:
      return { w: 600, h: 400 };
  }
};

const getModuleTitle = (moduleCode: string) => {
  switch (moduleCode.toUpperCase()) {
    case "CA":
      return "Category Page (CA)";
    case "SHIP":
      return "Ship Planning (SHIP)";
    case "UI":
      return "Task Design System (UI)";
    default: {
      const words = moduleCode
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      return words.join(" ");
    }
  }
};

export const WindowModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("normal");
  const [theme, setThemeState] = useState<"light" | "dark">("light"); // set default to light for user request!
  const [windows, setWindows] = useState<MdiWindowItem[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(
    "nav-initial",
  );
  const [maxZIndex, setMaxZIndex] = useState(15);

  // Read mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("Task_layout_mode") as LayoutMode;
    const savedTheme = localStorage.getItem("Task_desktop_theme") as
      | "light"
      | "dark";

    // Defer state updates to the next tick to prevent synchronous cascading renders during mount
    setTimeout(() => {
      if (savedMode === "normal" || savedMode === "desktop") {
        setLayoutModeState(savedMode);
      }
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      } else {
        setThemeState("light");
      }
    }, 0);
  }, []);

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem("Task_layout_mode", mode);
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setWindows((prev) =>
      prev.map((win) =>
        win.id === id ? { ...win, isMinimized: false, zIndex: nextZ } : win,
      ),
    );
  };

  const openWindow = (moduleCode: string, title?: string) => {
    let code = moduleCode.toUpperCase();

    // Map keys to specific modules if applicable
    if (code === "THONG-TIN-TAU") {
      code = "SHIP";
    } else if (
      ["MODELS", "PLAYGROUND", "HISTORY", "STARRED", "SETTINGS-PG"].includes(
        code,
      )
    ) {
      code = "CA";
    }

    // Check if window is already open
    const existing = windows.find((win) => win.moduleCode === code);
    if (existing) {
      focusWindow(existing.id);
      return;
    }

    const { w, h } = getWindowDefaults(code);
    const resolvedTitle = title || getModuleTitle(code);

    // Position cascade logic
    const offset = (windows.length * 30) % 200;
    const x = 120 + offset;
    const y = 80 + offset;

    const newId = `${code.toLowerCase()}-${Date.now()}`;
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);

    const newWindow: MdiWindowItem = {
      id: newId,
      title: resolvedTitle,
      moduleCode: code,
      x,
      y,
      w,
      h,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZ,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newId);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((win) => win.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, isMinimized: true } : win)),
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((win) =>
        win.id === id ? { ...win, isMaximized: !win.isMaximized } : win,
      ),
    );
    focusWindow(id);
  };

  const setTheme = (mode: "light" | "dark") => {
    setThemeState(mode);
    localStorage.setItem("Task_desktop_theme", mode);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <WindowModeContext.Provider
      value={{
        layoutMode,
        setLayoutMode,
        theme,
        setTheme,
        toggleTheme,
        windows,
        setWindows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        activeWindowId,
      }}
    >
      {children}
    </WindowModeContext.Provider>
  );
};

export const useWindowMode = () => {
  const context = useContext(WindowModeContext);
  if (context === undefined) {
    throw new Error("useWindowMode must be used within a WindowModeProvider");
  }
  return context;
};
