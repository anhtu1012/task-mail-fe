/* eslint-disable @typescript-eslint/no-explicit-any */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
export function getCookieDECODE(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    // Giải mã giá trị của cookie trước khi trả về
    return decodeURIComponent(parts.pop()!.split(";").shift()!); // Giải mã giá trị
  }
  return null;
}
export function setCookie(name: string, value: any, days?: number): void {
  let expires = "";
  if (days !== undefined) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Tính toán thời gian hết hạn nếu days được cung cấp
    expires = "expires=" + date.toUTCString() + "; ";
  }
  document.cookie = `${name}=${value}; ${expires}path=/`; // Thiết lập cookie
}

export function setCookieOBJ(name: string, value: any, days?: number): void {
  let expires = "";
  if (days !== undefined) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Tính toán thời gian hết hạn nếu days được cung cấp
    expires = "expires=" + date.toUTCString() + "; ";
  }
  // Sử dụng JSON.stringify và encodeURIComponent để lưu trữ JSON an toàn
  const encodedValue = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${name}=${encodedValue}; ${expires}path=/; SameSite=Lax`; // Thiết lập cookie
}
export function getCookieOBJ(name: string): any | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) {
    try {
      // Giải mã và chuyển đổi chuỗi JSON về đối tượng
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (e) {
      console.error("Error parsing cookie value:", e);
      return null; // Trả về null nếu xảy ra lỗi khi giải mã
    }
  }
  return null;
}
export function setLocalStorageOBJ(name: string, value: any): void {
  // Sử dụng JSON.stringify để lưu trữ giá trị dưới dạng chuỗi
  const encodedValue = JSON.stringify(value);
  localStorage.setItem(name, encodedValue); // Lưu trữ trong localStorage
}
