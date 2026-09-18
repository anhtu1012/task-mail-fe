import axios from "axios";
import type {
  SaveThemePreferenceInput,
  ThemePreferenceResponse,
} from "@/models/theme";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Cài đặt giao diện của người dùng.
 * Hợp đồng: docs/backend/theme-settings-api.md — backend đã deploy.
 *
 * Vẫn giữ nhánh lùi về "chỉ lưu dưới máy" khi gặp 404 (route biến mất) hoặc
 * 501: nó cứu được lúc backend bị rollback hoặc chưa lên ở một môi trường nào
 * đó. Mọi phương thức trả `null` thay vì ném lỗi, để không hiện thông báo lỗi
 * cho một tính năng người dùng không hề bấm vào.
 *
 * Lưu ý về mã lỗi: endpoint này trả **422** khi body sai, còn phần còn lại của
 * API vẫn là 400 — đừng gom vào một helper xử lý lỗi dùng chung.
 */
class ThemeApi extends AxiosService {
  /** true khi route không còn/chưa có — thôi gọi lại trong phiên này */
  private unsupported = false;

  public get isUnsupported(): boolean {
    return this.unsupported;
  }

  /** Trả về null nếu backend chưa hỗ trợ */
  public async fetch(): Promise<ThemePreferenceResponse | null> {
    if (this.unsupported) return null;
    try {
      return await this.get<ThemePreferenceResponse>(
        API_ENDPOINTS.PREFERENCES.THEME,
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) return null;
      throw error;
    }
  }

  /** Trả về null nếu backend chưa hỗ trợ */
  public async save(
    input: SaveThemePreferenceInput,
  ): Promise<ThemePreferenceResponse | null> {
    if (this.unsupported) return null;
    try {
      return await this.put<ThemePreferenceResponse, SaveThemePreferenceInput>(
        API_ENDPOINTS.PREFERENCES.THEME,
        input,
      );
    } catch (error) {
      if (this.markIfUnsupported(error)) return null;
      throw error;
    }
  }

  /** Xoá bản ghi, quay về mặc định hệ thống. Trả về null nếu backend chưa hỗ trợ */
  public async reset(): Promise<void | null> {
    if (this.unsupported) return null;
    try {
      return await this.delete<void>(API_ENDPOINTS.PREFERENCES.THEME);
    } catch (error) {
      if (this.markIfUnsupported(error)) return null;
      throw error;
    }
  }

  /**
   * 404 = không có route, 501 = có route nhưng chưa bật.
   *
   * 401 KHÔNG tính vào đây: đó là hết phiên đăng nhập, interceptor lo việc
   * làm mới token / đẩy về trang đăng nhập.
   * 429 cũng KHÔNG: vượt trần 60 req/phút chỉ là tạm thời, lần sau gọi lại được.
   */
  private markIfUnsupported(error: unknown): boolean {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 404 || status === 501) {
      this.unsupported = true;
      return true;
    }
    return false;
  }
}

export const themeApi = new ThemeApi();
