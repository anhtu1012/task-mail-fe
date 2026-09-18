"use client";

/**
 * Giao diện toàn hệ thống — nền, màu nhấn, độ trong của khung nội dung.
 *
 * Mọi thứ đổ xuống các biến CSS trên <html>, nên component nào cũng ăn theo
 * mà không cần biết tới context này. Lựa chọn lưu ở localStorage và được áp
 * lại bởi một đoạn script chạy trước khi hydrate (xem app/layout.tsx), nên
 * không có cảnh nháy giao diện mặc định lúc mở trang.
 *
 * localStorage là nguồn sự thật nên state giữ ở một store ngoài React và đọc
 * bằng useSyncExternalStore: server luôn thấy DEFAULT_THEME (khớp HTML gửi
 * xuống), client thấy giá trị đã lưu, và mở nhiều tab thì các tab tự đồng bộ.
 */
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  ThemeState,
  findBackground,
  isSameTheme,
  normalizeTheme,
  readStoredTheme,
  themeToCssVars,
} from "@/libs/theme/presets";
import { themeApi } from "@/apis/theme.api";
import { getCookie } from "@/utils/client/getCookie";

/* ------------------------------------------------------------------ */
/*  Store ngoài React                                                  */
/* ------------------------------------------------------------------ */

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: ThemeState | null = null;

function emit() {
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  // Tab khác vừa đổi giao diện -> tab này theo cùng
  if (e.key !== THEME_STORAGE_KEY) return;
  cached = readStoredTheme();
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Phải trả về cùng một tham chiếu khi chưa có gì đổi, nếu không sẽ render vô hạn */
function getSnapshot(): ThemeState {
  if (cached === null) cached = readStoredTheme();
  return cached;
}

function getServerSnapshot(): ThemeState {
  return DEFAULT_THEME;
}

function writeLocal(next: ThemeState) {
  cached = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // chế độ riêng tư / bị chặn lưu trữ: vẫn đổi được trong phiên này
  }
  emit();
}

/* ------------------------------------------------------------------ */
/*  Đồng bộ với backend                                                */
/*                                                                     */
/*  localStorage vẫn giữ vai trò bộ đệm: nó là thứ duy nhất đọc được   */
/*  *đồng bộ* lúc trang mới mở (xem script bootstrap ở app/layout.tsx) */
/*  nên vẫn phải ghi, dù bản ghi thật nằm dưới DB.                     */
/* ------------------------------------------------------------------ */

const PUSH_DELAY_MS = 700;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** Chỉ đẩy lên server sau khi đã biết chắc backend có hỗ trợ */
let serverBacked = false;

function schedulePush(next: ThemeState) {
  if (!serverBacked) return;
  // Kéo thanh trượt sinh ra hàng chục lần đổi mỗi giây; gom lại một lần gọi
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void themeApi.save(normalizeTheme(next)).catch(() => {
      // Mất mạng / lỗi server: cấu hình vẫn nằm dưới máy, lần mở sau
      // pullFromServer sẽ hoà lại. Không quấy người dùng bằng thông báo lỗi
      // cho một thao tác họ không chủ động bấm "Lưu".
    });
  }, PUSH_DELAY_MS);
}

function writeTheme(next: ThemeState) {
  writeLocal(next);
  schedulePush(next);
}

/**
 * Kéo cấu hình của tài khoản từ server về. Gọi sau khi đã đăng nhập.
 *
 * Ba nhánh:
 *   - backend chưa có endpoint  -> giữ nguyên chế độ chỉ lưu dưới máy
 *   - server đã có bản ghi      -> lấy làm chuẩn, ghi đè bộ đệm dưới máy
 *   - server chưa có bản ghi     -> đẩy cấu hình đang có dưới máy lên
 *     (chuyển tiếp cho người đã chỉnh giao diện từ trước khi có API)
 */
export async function pullFromServer(): Promise<void> {
  // Chưa đăng nhập thì chắc chắn 401, đừng bắn request vô ích
  if (!getCookie("accessToken")) return;

  const res = await themeApi.fetch().catch(() => null);
  if (!res) return;

  serverBacked = true;

  if (res.source === "user") {
    // Chuẩn hoá cả dữ liệu từ server: bản ghi cũ có thể trỏ tới preset nền đã
    // bị gỡ, hoặc mang thêm trường mà bản FE này chưa biết
    writeLocal(normalizeTheme(res.theme));
    return;
  }

  const local = getSnapshot();
  if (!isSameTheme(local, DEFAULT_THEME)) schedulePush(local);
}

/**
 * Dọn trạng thái đồng bộ khi đăng xuất.
 *
 * Nếu không dọn, cấu hình của người vừa thoát còn nằm trong bộ nhớ và một lần
 * đẩy đang chờ debounce có thể ghi nhầm sang tài khoản đăng nhập kế tiếp trên
 * cùng tab.
 */
export function clearThemeSession(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  serverBacked = false;
  cached = DEFAULT_THEME;
  emit();
}

/** Đẩy nốt thay đổi đang chờ — dùng khi người dùng rời trang */
export function flushPendingPush(): void {
  if (!pushTimer) return;
  clearTimeout(pushTimer);
  pushTimer = null;
  void themeApi.save(normalizeTheme(getSnapshot())).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ThemeContextValue {
  theme: ThemeState;
  /** Đổi một phần cấu hình; phần còn lại giữ nguyên */
  setTheme: (patch: Partial<ThemeState>) => void;
  reset: () => void;
  /** Nền hiện tại là tối hay sáng — dùng cho component cần đổi màu chữ */
  tone: "dark" | "light";
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToDocument(theme: ThemeState) {
  const root = document.documentElement;
  const vars = themeToCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.tone = findBackground(theme.background).tone;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settingsOpen = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );

  // Đồng bộ state của React xuống DOM — đúng việc mà effect sinh ra để làm
  useEffect(() => {
    applyToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((patch: Partial<ThemeState>) => {
    writeTheme({ ...getSnapshot(), ...patch });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    cached = DEFAULT_THEME;
    emit();
    if (serverBacked) void themeApi.reset().catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      reset,
      tone: findBackground(theme.background).tone,
      settingsOpen,
      setSettingsOpen,
    }),
    [theme, setTheme, reset, settingsOpen],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Trạng thái mở/đóng bảng cài đặt                                    */
/*  Để ngoài luôn cho đồng bộ với store trên, và để nút mở nằm ở       */
/*  layout còn bảng cài đặt nằm ở chỗ khác vẫn gọi được nhau.          */
/* ------------------------------------------------------------------ */

const settingsListeners = new Set<Listener>();
let settingsOpenState = false;

function subscribeSettings(listener: Listener) {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}

function getSettingsSnapshot() {
  return settingsOpenState;
}

function getSettingsServerSnapshot() {
  return false;
}

function setSettingsOpen(open: boolean) {
  settingsOpenState = open;
  for (const l of settingsListeners) l();
}

/**
 * Kéo cấu hình giao diện của tài khoản về, đúng một lần cho mỗi phiên.
 *
 * Gọi ở layout của khu vực đã đăng nhập, không gọi ở ThemeProvider: provider
 * bọc cả trang đăng nhập, mà lúc đó chưa có token nên request chắc chắn 401.
 */
export function useThemeSync(): void {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void pullFromServer();

    // Đóng tab khi thay đổi còn đang chờ debounce thì đẩy nốt
    const onHide = () => {
      if (document.visibilityState === "hidden") flushPendingPush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme phải nằm trong <ThemeProvider>");
  }
  return ctx;
}
