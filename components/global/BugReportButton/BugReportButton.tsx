"use client";

import { useState } from "react";
import { App, Popover, Tooltip } from "antd";
import { Bug, Check, Copy, ExternalLink, X } from "lucide-react";
import styles from "./BugReportButton.module.scss";

const GITHUB_REPO_URL = "https://github.com/anhtu1012/task-mail-fe";
const GITHUB_ISSUES_URL = "https://github.com/anhtu1012/task-mail-fe/issues";

function GithubSvgIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(GITHUB_REPO_URL);
      setCopied(true);
      message.success("Đã sao chép link repository!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("Không thể sao chép liên kết.");
    }
  };

  const popoverContent = (
    <div className={styles.popoverContent}>
      <div className={styles.popoverHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Bug size={18} />
          </div>
          <div>
            <div className={styles.headerTitle}>Báo cáo lỗi & Góp ý</div>
            <div className={styles.headerSub}>GitHub: anhtu1012/task-mail-fe</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0 text-[14px]"
        >
          <X size={15} />
        </button>
      </div>

      <div className={styles.guideList}>
        <div className={styles.guideStep}>
          <span className={styles.stepNumber}>1</span>
          <span>
            Bấm nút <strong>&quot;Mở GitHub Issues&quot;</strong> bên dưới.
          </span>
        </div>
        <div className={styles.guideStep}>
          <span className={styles.stepNumber}>2</span>
          <span>
            Tại giao diện GitHub, bấm nút màu xanh <strong>&quot;New issue&quot;</strong> ở góc phải.
          </span>
        </div>
        <div className={styles.guideStep}>
          <span className={styles.stepNumber}>3</span>
          <span>
            Nhập tiêu đề và mô tả chi tiết lỗi bạn gặp (kèm ảnh chụp màn hình nếu có) rồi gửi.
          </span>
        </div>
      </div>

      <div className={styles.repoBox}>
        <span className="truncate mr-2">anhtu1012/task-mail-fe</span>
        <button
          type="button"
          onClick={handleCopyLink}
          className={styles.copyBtn}
          title="Sao chép link"
        >
          {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
          <span>{copied ? "Đã copy" : "Copy"}</span>
        </button>
      </div>

      <div className={styles.actionRow}>
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryAction}
          onClick={() => setOpen(false)}
        >
          <GithubSvgIcon size={14} />
          <span>Mở GitHub tạo Issue</span>
          <ExternalLink size={12} />
        </a>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryAction}
          onClick={() => setOpen(false)}
        >
          <span>Xem Repository</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );

  return (
    <div className={styles.floatingWrapper}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        // Nút nằm sát mép phải -> mở popup về phía trái, không tràn khỏi màn hình
        placement="topRight"
        content={popoverContent}
        styles={{ content: { padding: 12, borderRadius: 14 } }}
      >
        <Tooltip title={!open ? "Báo cáo lỗi & Góp ý trên GitHub" : undefined} placement="left">
          <button
            type="button"
            className={styles.triggerBtn}
            aria-label="Báo cáo lỗi qua GitHub"
          >
            <span className={styles.bugBadge}>
              <Bug size={14} />
            </span>
            <span className={styles.triggerLabel}>Báo lỗi</span>
            <span className={styles.pulseDot} />
          </button>
        </Tooltip>
      </Popover>
    </div>
  );
}
