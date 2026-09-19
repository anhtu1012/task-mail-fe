/**
 * Dự án đang mở — trạng thái duy nhất mà cả app đọc để biết "đang ở đâu".
 *
 * Vì sao để ở Redux chứ không phải React Query: nó là **lựa chọn của người
 * dùng**, không phải dữ liệu máy chủ. Nó phải sống qua lần tải lại trang
 * (redux-persist đã bật ở `store/store.ts`) và phải đọc được từ chỗ ngoài cây
 * React Query — ví dụ hàm dựng tham số truy vấn.
 *
 * Khoá theo userId: hai tài khoản dùng chung một trình duyệt thì không được
 * nhìn thấy dự án của nhau, kể cả chỉ là cái id trong localStorage.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ProjectState = {
  /** id dự án đang mở của người dùng hiện tại. null = chưa chọn */
  currentProjectId: string | null;
  /** userId gắn với `currentProjectId` — đổi tài khoản là lựa chọn cũ hết hiệu lực */
  ownerUserId: string | null;
};

const initialState: ProjectState = {
  currentProjectId: null,
  ownerUserId: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (
      state,
      action: PayloadAction<{ projectId: string; userId: string }>,
    ) => {
      state.currentProjectId = action.payload.projectId;
      state.ownerUserId = action.payload.userId;
    },
    /** Đăng xuất, hoặc dự án đang mở đã bị xoá/lưu trữ */
    clearCurrentProject: (state) => {
      state.currentProjectId = null;
      state.ownerUserId = null;
    },
  },
});

export const { setCurrentProject, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
