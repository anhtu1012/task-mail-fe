"use client";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import { ReactNode } from "react";
import { Provider as ProviderStore } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GlobalConsumer } from "./store";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { clearCurrentProject } from "@/store/slices/project";
import { getApiErrorCode } from "@/utils/client/apiError";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistor, store } from "@/store/store";
import { ThemeProvider, useAppTheme } from "./ThemeContext";
import { shade, surfaceAlphas } from "@/libs/theme/presets";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";

/**
 * Dự án đang mở không còn tồn tại ở backend (id lấy từ kho mock, database đã
 * reset, dự án bị xoá ở tab khác...). Bỏ lựa chọn đó và tải lại danh sách dự án
 * thật: `/projects` luôn tự tạo dự án mặc định, trang chọn dự án tự vào nó, và
 * `/boards/me/full` tự dựng bảng cho dự án đó — người dùng không kẹt ở lỗi 404.
 */
function recoverFromMissingProject(queryClient: QueryClient, error: unknown) {
  if (getApiErrorCode(error) !== "PROJECT_NOT_FOUND") return;
  if (!store.getState().project.currentProjectId) return;
  store.dispatch(clearCurrentProject());
  ["tasks", "task", "task-stats", "board", "agenda"].forEach((key) =>
    queryClient.removeQueries({ queryKey: [key] }),
  );
  // reset chứ không invalidate: bỏ luôn danh sách cũ (có thể là mock) để trang
  // chọn dự án không kịp tự vào lại đúng cái id ma vừa bị dọn
  queryClient.resetQueries({ queryKey: ["projects"] });
}

function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => recoverFromMissingProject(client, error),
    }),
    mutationCache: new MutationCache({
      onError: (error) => recoverFromMissingProject(client, error),
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        /*
         * Mặc định của React Query là thử lại 3 lần với khoảng chờ tăng
         * dần: một lỗi thật (401 đã hết cứu, 404, 429) phải mất khoảng 7
         * giây mới hiện ra màn hình, trong lúc đó người dùng nhìn spinner
         * mà không hiểu chuyện gì. Một lần thử lại là đủ cho trục trặc
         * mạng thoáng qua.
         */
        retry: 1,
        /*
         * Backend giới hạn 20 yêu cầu/60 giây. Thử lại ngay lập tức chỉ
         * làm trần đó cạn nhanh hơn.
         */
        retryDelay: 800,
      },
      mutations: {
        // Ghi thì KHÔNG tự thử lại: gửi lại một lệnh tạo việc có thể sinh
        // ra hai việc giống nhau.
        retry: 0,
      },
    },
  });
  return client;
}

const Provider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <ProviderStore store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          {/* Không tự mở, nút lên góc trên: bảng devtools mở sẵn chiếm nửa dưới
              màn hình điện thoại, che mất thanh tab. Chỉ có ở bản dev. */}
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
          <ThemeProvider>
            <GlobalConsumer>
              {({ direction, lang }) => {
                // Synchronize dayjs locale
                dayjs.locale(lang === "vi" ? "vi" : "en");

                return (
                  <AntdTheme
                    lang={lang as string}
                    direction={direction as "ltr" | "rtl"}
                  >
                    {children}
                  </AntdTheme>
                );
              }}
            </GlobalConsumer>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </ProviderStore>
  );
};

/**
 * Đẩy màu nhấn của hệ thống giao diện vào antd, để nút/table/tag... đổi màu
 * cùng lúc với thanh điều hướng thay vì luôn là xanh hải quân cố định.
 */
function AntdTheme({
  lang,
  direction,
  children,
}: {
  lang: string;
  direction: "ltr" | "rtl";
  children: ReactNode;
}) {
  const { theme } = useAppTheme();
  const a = surfaceAlphas(theme.surfaceOpacity);
  const white = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;

  return (
    <ConfigProvider
      locale={lang === "vi" ? viVN : enUS}
      theme={{
        token: {
          fontFamily: "var(--font-be-vietnam-pro), Roboto-regular, sans-serif",
          colorPrimary: theme.accent,
          colorLink: theme.accent,
          colorSuccess: "#2A9D8F",
          colorWarning: "#F4A261",
          colorError: "#E63946",
          colorInfo: "#0EA5E9",
          borderRadius: 6,

          /*
           * Nền của Card/Table/Input... đều sinh ra từ token này, nên chỉnh ở
           * đây là cả trang trong theo — chắc hơn nhiều so với đè CSS lên
           * style do antd sinh động (CSS-in-JS).
           */
          colorBgContainer: white(a.card),
          /* Menu thả xuống, Modal, Popover: giữ đục, nổi trên nền chứ không hoà vào */
          colorBgElevated: "#ffffff",
          colorBgLayout: "transparent",
          colorBorder: white(0.42),
          colorBorderSecondary: white(0.3),
          colorFillAlter: white(a.head),
        },
        components: {
          Menu: { itemSelectedBg: shade(theme.accent, 0.86) },
          Table: {
            headerBg: white(a.head),
            rowHoverBg: white(a.hover),
            rowSelectedBg: shade(theme.accent, 0.88),
            rowSelectedHoverBg: shade(theme.accent, 0.82),
            borderColor: white(0.34),
            headerSplitColor: "transparent",
            footerBg: "transparent",
          },
          Segmented: {
            trackBg: white(a.head),
            itemSelectedBg: "#ffffff",
          },
          Card: { headerBg: "transparent" },
          /* Vùng nổi lên trên: để đục để chữ luôn đọc được */
          Modal: { contentBg: "#ffffff", headerBg: "#ffffff" },
          Drawer: { colorBgElevated: "#ffffff" },
          Dropdown: { colorBgElevated: "#ffffff" },
          Select: { optionSelectedBg: shade(theme.accent, 0.88) },
        },
      }}
      direction={direction}
    >
      <AntdRegistry>
        <App>{children}</App>
      </AntdRegistry>
    </ConfigProvider>
  );
}

export default Provider;
