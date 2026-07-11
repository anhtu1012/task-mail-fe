/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";

// Initial state with the provided object
const initialState: { shipData: any | null } = {
  shipData: null,
};

const shipSlice = createSlice({
  name: "ship",
  initialState,
  reducers: {
    updateShipData(state, action) {
      state.shipData = action.payload;
    },
    clearShipData(state) {
      state.shipData = null;
    },
  },
});

export const { updateShipData, clearShipData } = shipSlice.actions;
export const selectShipData = (state: RootState) => state.ship;

export default shipSlice.reducer;
