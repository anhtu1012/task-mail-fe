// redux/terminalSlice.ts
import { RootState } from "@/store/store";
import { createSlice } from "@reduxjs/toolkit";

export interface TerminalInformation {
  id: string;
  createdAt: string;
  updatedAt: string;
  terminalCode: string;
  terminalName: string;
  terminalEnglishName: string;
  terminalShort: string;
  tel: string;
  fax: string;
  address: string;
  email: string;
  website: string;
  accNo: string | null;
  vatCode: string;
  registerNo: string | null;
  registerName: string;
  representativeName: string | null;
  certification: string;
  accUsdNo: string | null;
  bankName: string | null;
  logo: string;
  isDefault: boolean;
  note: string;
}

const initialState: TerminalInformation = {
  id: "",
  createdAt: "",
  updatedAt: "",
  terminalCode: "",
  terminalName: "",
  terminalEnglishName: "",
  terminalShort: "",
  tel: "",
  fax: "",
  address: "",
  email: "",
  website: "",
  accNo: null,
  vatCode: "",
  registerNo: null,
  registerName: "",
  representativeName: null,
  certification: "",
  accUsdNo: null,
  bankName: null,
  logo: "",
  isDefault: true,
  note: "",
};

const terminalSlice = createSlice({
  name: "terminal",
  initialState,
  reducers: {
    setTerminalData: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearTerminalData: () => {
      return initialState;
    },
  },
});

export const { setTerminalData, clearTerminalData } = terminalSlice.actions;
export const selectTerminal = (state: RootState) => state.terminal;

export default terminalSlice.reducer;
