"use client";

/**
 * Lời mời cài TaskBox lên điện thoại — hiện trên cùng các tab mobile.
 *
 * Android/Chrome: nút "Cài" mở hộp thoại cài thật của trình duyệt.
 * iPhone/Safari: không có hộp thoại, nên bấm vào sẽ hiện hướng dẫn
 * "Chia sẻ → Thêm vào MH chính".
 * Đã cài, hoặc trình duyệt không hỗ trợ: không hiện gì.
 *
 * Bấm × thì ẩn 14 ngày (nhớ trong localStorage của máy này).
 */
import { useState } from "react";
import Image from "next/image";
import { Modal } from "antd";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { promptInstall, useInstallState } from "./installPrompt";

const DISMISS_KEY = "pwa:install-dismissed-at";
const DISMISS_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallAppBanner() {
  const { canPrompt, iosManual, installed } = useInstallState();
  const [hidden, setHidden] = useState(dismissedRecently);
  const [iosHelp, setIosHelp] = useState(false);

  if (installed || hidden || (!canPrompt && !iosManual)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage bị chặn (chế độ riêng tư) — chỉ ẩn trong phiên này
    }
    setHidden(true);
  };

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 mb-3 text-white"
        style={{ background: "linear-gradient(135deg,#14568a,#0a2c47)" }}
      >
        <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-[10px] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-tight">Cài TaskBox lên điện thoại</div>
          <div className="text-[12px] opacity-75 leading-tight mt-0.5">
            Mở nhanh từ màn hình chính, toàn màn hình như app
          </div>
        </div>
        <button
          type="button"
          onClick={() => (canPrompt ? void promptInstall() : setIosHelp(true))}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border-0 cursor-pointer text-[13px] font-semibold shrink-0"
          style={{ background: "#fff", color: "#0a2c47" }}
        >
          <Download size={14} /> Cài
        </button>
        <button
          type="button"
          aria-label="Để sau"
          onClick={dismiss}
          className="grid place-items-center size-7 -mr-1 rounded-md border-0 bg-transparent cursor-pointer shrink-0 text-white/70"
        >
          <X size={16} />
        </button>
      </div>

      <Modal
        open={iosHelp}
        onCancel={() => setIosHelp(false)}
        footer={null}
        centered
        title="Thêm TaskBox vào màn hình chính"
      >
        <ol className="flex flex-col gap-3 pl-0 list-none text-[14px] m-0">
          <li className="flex items-center gap-3">
            <span className="grid place-items-center size-8 rounded-lg bg-slate-100 shrink-0">
              <Share size={17} />
            </span>
            <span>
              Bấm nút <b>Chia sẻ</b> ở thanh dưới của Safari
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="grid place-items-center size-8 rounded-lg bg-slate-100 shrink-0">
              <SquarePlus size={17} />
            </span>
            <span>
              Kéo xuống, chọn <b>Thêm vào MH chính</b>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg shrink-0" />
            <span>
              Bấm <b>Thêm</b> — biểu tượng TaskBox sẽ nằm trên màn hình chính
            </span>
          </li>
        </ol>
      </Modal>
    </>
  );
}
