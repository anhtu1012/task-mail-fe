import {
  MailAccount,
  ZaloBotStatus,
  ZaloBroadcastPayload,
  ZaloBroadcastResult,
  ZaloRecipient,
  ZaloLinkCode,
  ZaloLinkStatus,
} from "@/models/task";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

class IntegrationApi extends AxiosService {
  // ============== MAIL ACCOUNTS (Gmail -> tự tạo task) ==============
  public async listMailAccounts(): Promise<MailAccount[]> {
    return this.get<MailAccount[]>(API_ENDPOINTS.MAIL_ACCOUNTS.ROOT);
  }

  /** Lấy URL cấp quyền Google — FE mở popup/tab mới. */
  public async getGoogleConnectUrl(): Promise<{ url: string }> {
    return this.get<{ url: string }>(API_ENDPOINTS.MAIL_ACCOUNTS.GOOGLE_CONNECT);
  }

  public async removeMailAccount(id: string): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.MAIL_ACCOUNTS.DETAIL(id));
  }

  // ============== ZALO ==============
  public async createZaloLinkCode(): Promise<ZaloLinkCode> {
    return this.post<ZaloLinkCode, Record<string, never>>(
      API_ENDPOINTS.ZALO_ACCOUNTS.LINK_CODE,
      {},
    );
  }

  public async getZaloLinkStatus(): Promise<ZaloLinkStatus> {
    return this.get<ZaloLinkStatus>(API_ENDPOINTS.ZALO_ACCOUNTS.ME);
  }

  public async unlinkZalo(): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.ZALO_ACCOUNTS.ME);
  }

  /** Chỉ ADMIN/SUPER_ADMIN */
  public async getZaloBotStatus(): Promise<ZaloBotStatus> {
    return this.get<ZaloBotStatus>(API_ENDPOINTS.ZALO_BOT.STATUS);
  }

  /** Chỉ ADMIN/SUPER_ADMIN — danh sách user đã liên kết Zalo để chọn người nhận. */
  public async listZaloRecipients(): Promise<ZaloRecipient[]> {
    return this.get<ZaloRecipient[]>(API_ENDPOINTS.ZALO_BOT.RECIPIENTS);
  }

  /** Chỉ ADMIN/SUPER_ADMIN — gửi thông báo tới mọi user đã liên kết Zalo (không lưu lịch sử). */
  public async broadcastZalo(
    payload: ZaloBroadcastPayload,
  ): Promise<ZaloBroadcastResult> {
    return this.post<ZaloBroadcastResult, ZaloBroadcastPayload>(
      API_ENDPOINTS.ZALO_BOT.BROADCAST,
      payload,
    );
  }
}

export const integrationApi = new IntegrationApi();
