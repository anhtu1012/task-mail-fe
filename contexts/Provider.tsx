"use client";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import { ReactNode } from "react";
import { Provider as ProviderStore } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GlobalConsumer } from "./store";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistor, store } from "@/store/store";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";

import { WindowModeProvider } from "./WindowModeContext";

const Provider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      }),
  );

  return (
    <ProviderStore store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={true} />
          <GlobalConsumer>
            {({ direction, lang }) => {
              // Synchronize dayjs locale
              dayjs.locale(lang === "vi" ? "vi" : "en");

              return (
                <ConfigProvider
                  locale={lang === "vi" ? viVN : enUS}
                  theme={{
                    token: {
                      fontFamily:
                        "var(--font-be-vietnam-pro), Roboto-regular, sans-serif",
                      colorPrimary: "#0A436D",
                      colorSuccess: "#2A9D8F",
                      colorWarning: "#F4A261",
                      colorError: "#E63946",
                      colorInfo: "#0EA5E9",
                      colorBorder: "#E2E8F0",
                      borderRadius: 6,
                    },
                  }}
                  direction={direction as "ltr" | "rtl"}
                >
                  <AntdRegistry>
                    <App>
                      <WindowModeProvider>{children}</WindowModeProvider>
                    </App>
                  </AntdRegistry>
                </ConfigProvider>
              );
            }}
          </GlobalConsumer>
        </QueryClientProvider>
      </PersistGate>
    </ProviderStore>
  );
};

export default Provider;
