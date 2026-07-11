import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
// Define the type for a permission item
interface PermissionItem {
  props: {
    rsname: string;
    rsid?: string;
    scopes: string[];
    menuScopes: string[];
  };
}

// Define the initial state type
interface PermissionsState {
  permission: PermissionItem[]; // Array of PermissionItem objects
  selectedPermission?: PermissionItem; // Optional selected permission
}

// Khởi tạo trạng thái ban đầu từ dữ liệu jsonData
const initialState: PermissionsState = {
  permission: [],
};

// Tạo slice Redux Toolkit
const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    // Action để thay thế toàn bộ mảng permissions trong state
    setPermissions: (state, action: PayloadAction<PermissionItem[]>) => {
      state.permission = action.payload; // Thay thế toàn bộ mảng permissions
    },
    // Action để tìm kiếm permission theo rsname và trả về toàn bộ thuộc tính của item
    checkPermissionByRsname: (state, action: PayloadAction<string>) => {
      // Tìm kiếm permission có rsname khớp
      const foundPermission = state.permission.find(
        (item) => item.props.rsname === action.payload,
      );
      // Gán kết quả tìm được vào selectedPermission
      state.selectedPermission = foundPermission ?? undefined;
    },
  },
});

// Export actions và reducer
export const { setPermissions, checkPermissionByRsname } =
  permissionsSlice.actions;
export const selectPermissions = createSelector(
  [(state: RootState) => state.permissions],
  (permissionsState) => ({
    permissions: permissionsState,
    selectedPermission: permissionsState.selectedPermission,
  }),
);
export default permissionsSlice.reducer;
