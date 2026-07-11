import { jwtDecode } from "jwt-decode";

export const isValidToken = (token: string): boolean => {
  if (!token) return false;

  try {
    const decoded: unknown = jwtDecode(token);
    return typeof decoded === "object";
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const removePrefixToken = (token: string): string => {
  return token.startsWith("Bearer ")
    ? token.replace(/^Bearer\s+/i, "")
    : `Bearer ${token}`;
};
