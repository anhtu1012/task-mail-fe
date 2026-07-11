// redux/authSlice.js
import { RootState } from "@/store/store";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: "",
  refreshToken: "",
  expiresIn: 300,
  refreshExpiresIn: 1800,
  tokenType: "Bearer",
  sessionState: "",
  scope: "profile email",
  permissions: [],
  listModule: [],
  userProfile: {
    userName: "",
    fullName: "",
    email: "",
    phone: "",
    group: [],
    birthDay: "",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      const {
        accessToken,
        refreshToken,
        expiresIn,
        refreshExpiresIn,
        tokenType,
        sessionState,
        scope,
        permissions,
        listModule,
        userProfile,
      } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.expiresIn = expiresIn;
      state.refreshExpiresIn = refreshExpiresIn;
      state.tokenType = tokenType;
      state.sessionState = sessionState;
      state.scope = scope;
      state.permissions = permissions;
      state.listModule = listModule;
      state.userProfile = userProfile;
    },
    clearAuthData: (state) => {
      state.accessToken = "";
      state.refreshToken = "";
      state.expiresIn = 0;
      state.refreshExpiresIn = 0;
      state.tokenType = "";
      state.sessionState = "";
      state.scope = "";
      state.permissions = [];
      state.listModule = [];
      state.userProfile = {
        userName: "",
        fullName: "",
        email: "",
        phone: "",
        group: [],
        birthDay: "",
      };
    },
  },
});

export const { setAuthData, clearAuthData } = authSlice.actions;
export const selectAuthLogin = (state: RootState) => state.auth;

export default authSlice.reducer;
