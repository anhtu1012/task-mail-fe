/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootState } from "@/store/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SiderState {
  selectedMenuItem: string;
  categoriesData: Record<string, any>;
}

const initialState: SiderState = {
  selectedMenuItem: "",
  categoriesData: {},
};

const siderSlice = createSlice({
  name: "sider",
  initialState,
  reducers: {
    setSelectedMenuItemRd(state, action: PayloadAction<string>) {
      state.selectedMenuItem = action.payload;
    },
    setCategoriesData(state, action: PayloadAction<Record<string, any>>) {
      state.categoriesData = action.payload;
    },
    resetActiveState(state) {
      state.selectedMenuItem = "";
    },
  },
});

export const { setSelectedMenuItemRd, setCategoriesData, resetActiveState } =
  siderSlice.actions;
// Selectors
export const selectSelectedMenuItem = (state: RootState): string =>
  state.sider.selectedMenuItem;

export const selectCategoriesData = (state: RootState): Record<string, any> =>
  state.sider.categoriesData;
export default siderSlice.reducer;
