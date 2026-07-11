export interface AuthorizationPort {
  getToken: () => string;
  setToken: (token: string, expires?: string) => void;
  removeToken: () => void;
}

export interface RepositoryPort {
  get: <T>(url: string) => Promise<T>;
  getWithParams: <T>(url: string, params?: URLSearchParams) => Promise<T>;
  post: <T, TFromData>(url: string, data: TFromData) => Promise<T>;
  put: <T, TFromData>(url: string, data: TFromData) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
}
