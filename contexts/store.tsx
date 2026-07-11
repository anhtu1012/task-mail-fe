"use client";
import React from "react";

// type Props = {
//   children: React.ReactNode;
// };
export const i18n = {
  defaultLocale: "vi",
  locales: ["en", "vi"],
} as const;

// NOTE: Global context store
const GlobalContext = React.createContext({
  lang: i18n.defaultLocale,
  dictionaries: i18n.defaultLocale === "vi" ? {} : {},
  setDictionaries: () => {},
  changeLang: () => {},
  direction: "ltr",
  changeDirection: () => {},
  hydration: false,
  setHydration: () => {},
});

// NOTE: Global context consumer
export const GlobalConsumer = GlobalContext.Consumer;
