/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootState } from "@/store/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DtoCntrDetailsState {
  details: any[]; // Lưu trữ dữ liệu của dtoCntrDetails
  loading: boolean;
  error: string | null;
}
// Khởi tạo state ban đầu
const initialState: DtoCntrDetailsState = {
  details: [],
  loading: false,
  error: null,
};

// Tạo slice với các reducers và actions
const dtoCntrDetailsSlice = createSlice({
  name: "dtoCntrDetails",
  initialState,
  reducers: {
    // Thêm một phần tử vào danh sách
    addDetail(state, action: PayloadAction<any>) {
      state.details.push(action.payload);
    },
    // Cập nhật chi tiết dựa trên id
    updateDetail(state, action: PayloadAction<any>) {
      const index = state.details.findIndex(
        (detail) => detail.id === action.payload.id,
      );
      if (index !== -1) {
        state.details[index] = { ...state.details[index], ...action.payload };
      }
    },
    // Xóa một phần tử dựa trên id
    removeDetail(state, action: PayloadAction<string>) {
      state.details = state.details.filter(
        (detail) => detail.id !== action.payload,
      );
    },
    // Cài đặt toàn bộ danh sách
    setDetails(state, action: PayloadAction<any[]>) {
      state.details = action.payload;
    },
    // Xóa toàn bộ danh sách
    clearDetails(state) {
      state.details = [];
    },
    // Cài đặt trạng thái loading
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    // Cài đặt lỗi
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setDetails, clearDetails, setLoading, setError } =
  dtoCntrDetailsSlice.actions;
// Selector để truy cập danh sách chi tiết (details)
export const selectCntrDetailsList = (state: RootState) =>
  state.dtoCntrDetails.details;
export default dtoCntrDetailsSlice.reducer;
