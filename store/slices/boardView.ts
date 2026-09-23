import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

/**
 * Trạng thái hiển thị giao diện bảng công việc (Board View)
 * Lưu trữ trạng thái đóng/mở của Hộp thư đến và Lịch hôm nay trên Redux (có persist).
 */
interface BoardViewState {
  /** Hộp thư đến (Inbox): true = đóng / thu gọn, false = mở */
  inboxCollapsed: boolean;
  /** Lịch hôm nay (Agenda): true = mở, false = đóng */
  agendaOpen: boolean;
  /** Độ rộng Hộp thư đến */
  inboxWidth: number;
}

const initialState: BoardViewState = {
  inboxCollapsed: false,
  agendaOpen: true,
  inboxWidth: 292,
};

const boardViewSlice = createSlice({
  name: "boardView",
  initialState,
  reducers: {
    setInboxCollapsed: (state, action: PayloadAction<boolean>) => {
      state.inboxCollapsed = action.payload;
    },
    toggleInboxCollapsed: (state) => {
      state.inboxCollapsed = !state.inboxCollapsed;
    },
    setAgendaOpen: (state, action: PayloadAction<boolean>) => {
      state.agendaOpen = action.payload;
    },
    toggleAgendaOpen: (state) => {
      state.agendaOpen = !state.agendaOpen;
    },
    setInboxWidth: (state, action: PayloadAction<number>) => {
      state.inboxWidth = action.payload;
    },
  },
});

export const {
  setInboxCollapsed,
  toggleInboxCollapsed,
  setAgendaOpen,
  toggleAgendaOpen,
  setInboxWidth,
} = boardViewSlice.actions;

export const selectInboxCollapsed = (state: RootState) =>
  state.boardView?.inboxCollapsed ?? false;
export const selectAgendaOpen = (state: RootState) =>
  state.boardView?.agendaOpen ?? true;
export const selectInboxWidth = (state: RootState) =>
  state.boardView?.inboxWidth ?? 292;

export default boardViewSlice.reducer;
