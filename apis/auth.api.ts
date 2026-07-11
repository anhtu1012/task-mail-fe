import { AuthTokenResponse, MeResponse } from "@/models/task";
import { AxiosService } from "./axios.base";
import { API_ENDPOINTS } from "./endpoints";
import { setCookieSecurely } from "./interceptors";

export type Credentials = { email: string; password: string };

class AuthApi extends AxiosService {
  public async login(credentials: Credentials): Promise<AuthTokenResponse> {
    const data = await this.post<AuthTokenResponse, Credentials>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    this.persistToken(data.accessToken);
    return data;
  }

  public async register(credentials: Credentials): Promise<AuthTokenResponse> {
    const data = await this.post<AuthTokenResponse, Credentials>(
      API_ENDPOINTS.AUTH.REGISTER,
      credentials,
    );
    this.persistToken(data.accessToken);
    return data;
  }

  public async me(): Promise<MeResponse> {
    return this.get<MeResponse>(API_ENDPOINTS.AUTH.ME);
  }

  /** Lưu accessToken (từ login/register/oauth-callback) vào cookie client. */
  public persistToken(accessToken: string): void {
    setCookieSecurely("accessToken", accessToken, this);
  }

  /** Gọi POST /auth/logout (xoá refresh_token HttpOnly) rồi dọn state client. */
  public async logoutSession(): Promise<void> {
    try {
      await this.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch {
      // vẫn dọn client dù API lỗi
    } finally {
      document.cookie = "accessToken=; Max-Age=0; path=/;";
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  /** URL để điều hướng trình duyệt sang đăng nhập Google (không gọi bằng axios). */
  public googleLoginUrl(): string {
    return `${this.baseUrl}${API_ENDPOINTS.AUTH.GOOGLE}`;
  }
}

export const authApi = new AuthApi();
// Giữ alias cũ để không vỡ import hiện hữu
export const authApiRequest = authApi;
