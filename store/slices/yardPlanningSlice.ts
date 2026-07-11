/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { dtoBlockTopBayPlan } from "@/model/yard/ke-hoach/DisplayBlock";
// import { ModeType } from "@/services/yard/api";

interface YardPlanningState {
  selectedJob: any | null;
  selectedContainer: any[];
  localFilter: string;
  selectedPreviewCode: string;
  mode?: any;
}

const initialState: YardPlanningState = {
  selectedJob: null,
  selectedContainer: [],
  localFilter: "OPR",
  selectedPreviewCode: "",
  mode: undefined,
};

const yardPlanningSlice = createSlice({
  name: "yardPlanning",
  initialState,
  reducers: {
    setSelectedJob(state, action: PayloadAction<any | null>) {
      state.selectedJob = action.payload;
    },
    setSelectedContainer(state, action: PayloadAction<any[]>) {
      state.selectedContainer = action.payload;
    },
    setLocalFilter(state, action: PayloadAction<string>) {
      state.localFilter = action.payload;
    },
    setSelectedPreviewCode(state, action: PayloadAction<string>) {
      state.selectedPreviewCode = action.payload;
    },
    setPlanningMode(state, action: PayloadAction<any | undefined>) {
      state.mode = action.payload;
    },
    clearYardPlanningSelection(state) {
      state.selectedJob = null;
      state.selectedContainer = [];
      state.selectedPreviewCode = "";
    },
  },
});

export const {
  setSelectedJob,
  setSelectedContainer,
  setLocalFilter,
  setSelectedPreviewCode,
  setPlanningMode,
  clearYardPlanningSelection,
} = yardPlanningSlice.actions;

export const selectYardPlanning = (state: {
  yardPlanning: YardPlanningState;
}) => state.yardPlanning;

export default yardPlanningSlice.reducer;
