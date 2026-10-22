import { AuthorizationPort } from "./ddd/repository.port";

export class Authorization implements AuthorizationPort {
  protected token = "";
  // protected refreshToken: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      this.initToken();
    }
  }

  private initToken() {
    const cookies = document.cookie.split(";");
    const cookieObj = cookies.reduce(
      (acc: { [key: string]: string }, cookie) => {
        const [name, value] = cookie.split("=");
        acc[name.trim()] = value;
        return acc;
      },
      {},
    );
    this.token = cookieObj["accessToken"] || "";
    // this.refreshToken = cookieObj["refreshToken"] || "";
  }

  getToken() {
    return this.token;
  }

  // getRefreshToken() {
  //   return this.refreshToken;
  // }

  /**
   * Chỉ cập nhật token trong bộ nhớ. Cookie `accessToken` do `setCookieSecurely`
   * ghi (có Max-Age, path=/) — trước đây hàm này ghi đè lại cookie KHÔNG có
   * hạn nên nó thành session cookie, đóng trình duyệt là mất phiên.
   */
  setToken(token: string) {
    this.token = token.replace(/^Bearer\s+/i, "");
  }

  removeToken() {
    this.token = "";
    // this.refreshToken = "";
    document.cookie = `accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    // document.cookie = `refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
}
