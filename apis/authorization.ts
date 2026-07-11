import { removePrefixToken } from "@/utils/servers/api";
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

  setToken(token: string, expires?: string) {
    if (this.token) {
      const cookies = document.cookie.split("; ");
      const updatedCookies = [];
      let tokenUpdated = false;

      for (const cookie of cookies) {
        if (cookie.startsWith("accessToken=")) {
          updatedCookies.push(`accessToken=${token}`);
          tokenUpdated = true;
        } else {
          updatedCookies.push(cookie);
        }
      }

      if (!tokenUpdated) {
        updatedCookies.push(`accessToken=${token}`);
      }
      document.cookie = updatedCookies.join("; ");
    } else {
      document.cookie = `accessToken=${token}; expires=${
        expires ?? "Fri, 31 Dec 9999 23:59:59 GMT"
      }; path=/; secure; SameSite=Strict`;
    }
    this.token = removePrefixToken(token);
  }

  removeToken() {
    this.token = "";
    // this.refreshToken = "";
    document.cookie = `accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    // document.cookie = `refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
}
