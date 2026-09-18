"use client";

/**
 * Bảng cài đặt giao diện — mở từ nút hình bảng màu trên thanh điều hướng.
 *
 * Mọi thay đổi áp ngay lập tức (không có nút "Lưu") vì người dùng cần nhìn
 * thấy kết quả để chọn; muốn quay về ban đầu thì bấm "Khôi phục mặc định".
 */
import { ColorPicker, Drawer, Slider, Tooltip } from "antd";
import { Check, Palette, RotateCcw } from "lucide-react";
import { useAppTheme } from "@/contexts/ThemeContext";
import { ACCENTS, BACKGROUNDS } from "@/libs/theme/presets";
import styles from "./ThemeSettings.module.scss";

export default function ThemeSettings() {
  const { theme, setTheme, reset, settingsOpen, setSettingsOpen } = useAppTheme();

  return (
    <Drawer
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      placement="right"
      size={360}
      title={
        <span className={styles.title}>
          <Palette size={17} /> Giao diện
        </span>
      }
      extra={
        <Tooltip title="Khôi phục mặc định">
          <button type="button" className={styles.resetBtn} onClick={reset}>
            <RotateCcw size={15} />
          </button>
        </Tooltip>
      }
      styles={{ body: { padding: 18 } }}
    >
      <Section
        title="Ảnh nền"
        hint="Áp cho toàn bộ hệ thống, không riêng màn Bảng công việc."
      >
        <div className={styles.bgGrid}>
          {BACKGROUNDS.map((bg) => {
            const active = theme.background === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setTheme({ background: bg.id })}
                className={`${styles.bgItem} ${active ? styles.bgItemActive : ""}`}
                aria-pressed={active}
              >
                <span className={styles.bgThumb} style={{ background: bg.thumb }}>
                  {active && (
                    <span className={styles.bgCheck}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className={styles.bgName}>{bg.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Màu nhấn"
        hint="Dùng cho thanh điều hướng, nút chính và các trạng thái đang chọn."
      >
        <div className={styles.swatches}>
          {ACCENTS.map((a) => {
            const active = theme.accent.toLowerCase() === a.color.toLowerCase();
            return (
              <Tooltip key={a.id} title={a.name}>
                <button
                  type="button"
                  onClick={() => setTheme({ accent: a.color })}
                  className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
                  style={{ background: a.color }}
                  aria-label={a.name}
                  aria-pressed={active}
                >
                  {active && <Check size={15} strokeWidth={3} />}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className={styles.customRow}>
          <span className={styles.customLabel}>Màu tự chọn</span>
          <ColorPicker
            value={theme.accent}
            disabledAlpha
            onChangeComplete={(c) => setTheme({ accent: c.toHexString() })}
            showText={(color) => (
              <span className={styles.hex}>{color.toHexString().toUpperCase()}</span>
            )}
          />
        </div>
      </Section>

      <Section
        title="Độ trong"
        hint="Kéo xuống để ảnh nền hiện rõ qua khung, thẻ và bảng. Mức thấp nhất được chặn ở 50% để chữ vẫn đạt chuẩn tương phản."
      >
        <Field label="Độ đục" value={`${Math.round(theme.surfaceOpacity * 100)}%`}>
          <Slider
            min={50}
            max={100}
            value={Math.round(theme.surfaceOpacity * 100)}
            onChange={(v) => setTheme({ surfaceOpacity: v / 100 })}
            tooltip={{ open: false }}
          />
        </Field>
        <Field label="Độ mờ kính" value={`${theme.surfaceBlur}px`}>
          <Slider
            min={0}
            max={28}
            value={theme.surfaceBlur}
            onChange={(v) => setTheme({ surfaceBlur: v })}
            tooltip={{ open: false }}
          />
        </Field>
      </Section>
    </Drawer>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {hint && <p className={styles.sectionHint}>{hint}</p>}
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span>{label}</span>
        <span className={styles.fieldValue}>{value}</span>
      </div>
      {children}
    </div>
  );
}
