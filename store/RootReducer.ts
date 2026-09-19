import { combineReducers } from "@reduxjs/toolkit";
import permissionsReducer from "@/store/slices/permissions";
import siderReducer from "@/store/slices/breadcrumb";
import projectReducer from "@/store/slices/project";

const rootReducer = combineReducers({
  permissions: permissionsReducer,
  sider: siderReducer,
  project: projectReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
