import { combineReducers } from "@reduxjs/toolkit";
import permissionsReducer from "@/store/slices/permissions";
import siderReducer from "@/store/slices/breadcrumb";

const rootReducer = combineReducers({
  permissions: permissionsReducer,
  sider: siderReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
