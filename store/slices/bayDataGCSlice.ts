/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
// import { SavedDataGC } from "@/app/ship/ke_hoach/ke_hoach_xep_container/_components/BayContainer/Bay";

interface ContainerState {
  container20: any[];
  container40: any[];
  container40IncrementedData: any[];
  container40DecrementedData: any[];
}

const initialState: ContainerState = {
  container20: [],
  container40: [],
  container40IncrementedData: [],
  container40DecrementedData: [],
};

const baySlice = createSlice({
  name: "bayDataGC",
  initialState,
  reducers: {
    saveContainer20: (state, action: PayloadAction<any[]>) => {
      state.container20 = action.payload; // Lưu container20
    },
    saveContainer40: (state, action: PayloadAction<any[]>) => {
      state.container40 = action.payload; // Lưu container40
    },
    saveContainer40IncrementedData: (state, action: PayloadAction<any[]>) => {
      state.container40IncrementedData = action.payload; // Lưu container40IncrementedData
    },
    saveContainer40DecrementedData: (state, action: PayloadAction<any[]>) => {
      state.container40DecrementedData = action.payload; // Lưu container40DecrementedData
    },
  },
});

export const {
  saveContainer20,
  saveContainer40,
  saveContainer40IncrementedData,
  saveContainer40DecrementedData,
} = baySlice.actions;
export const selectContainer20 = (state: RootState) =>
  state.bayDataGC.container20;
export const selectContainer40 = (state: RootState) =>
  state.bayDataGC.container40;
export const selectContainer40IncrementedData = (state: RootState) =>
  state.bayDataGC.container40IncrementedData;
export const selectContainer40DecrementedData = (state: RootState) =>
  state.bayDataGC.container40DecrementedData;
export default baySlice.reducer;
