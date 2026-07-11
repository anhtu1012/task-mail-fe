import { RootState } from "@/store/store";
import { createSlice } from "@reduxjs/toolkit";

interface LockedDevice {
  device: string;
  lockedBy: string;
}

interface LockedDeviceState {
  lockedDevices: LockedDevice[];
  currentLockedDevice: string | null;
}

// Initial state with the provided object
const initialState: LockedDeviceState = {
  lockedDevices: [],
  currentLockedDevice: null,
};

const lockedDeviceSlice = createSlice({
  name: "lockedDevice",
  initialState,
  reducers: {
    updateLockedDevices(state, action) {
      state.lockedDevices = action.payload;
    },
    clearLockedDevices(state, action) {
      // action.payload = username cần clear
      state.lockedDevices = state.lockedDevices.filter(
        (d) => d.lockedBy !== action.payload,
      );
    },
    setCurrentLockedDevice(state, action) {
      state.currentLockedDevice = action.payload;
    },
  },
});

export const {
  updateLockedDevices,
  clearLockedDevices,
  setCurrentLockedDevice,
} = lockedDeviceSlice.actions;
export const selectLockedDevices = (state: RootState) =>
  state.lockedDevice.lockedDevices;

export default lockedDeviceSlice.reducer;
