export type FormLogin = {
  username: string;
  password: string;
};

export type UserProfile = {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  group: string;
  birthDay: string;
};

export type PermissionProps = {
  scopes: string[];
  rsid: string;
  rsname: string;
  sort?: number;
};

export type Permission = {
  props: PermissionProps;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionState: string;
  scope: string;
  userProfile: UserProfile;
  permissions: Permission[];
};

export type LoginApiResponse = {
  status: number;
  success: boolean;
  message: string;
  authorized: boolean;
  payload: AuthPayload;
  access_token: string;
};


export type FormChangePassword = {
  credentials: [ { value: string } ];
}