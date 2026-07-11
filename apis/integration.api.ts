import {
  MailAccount,
  ZaloBotStatus,
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
}

export const integrationApi = new IntegrationApi();
