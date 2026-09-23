import { combineReducers } from "@reduxjs/toolkit";
import permissionsReducer from "@/store/slices/permissions";
import siderReducer from "@/store/slices/breadcrumb";
import projectReducer from "@/store/slices/project";
import boardViewReducer from "@/store/slices/boardView";

const rootReducer = combineReducers({
  permissions: permissionsReducer,
  sider: siderReducer,
  project: projectReducer,
  boardView: boardViewReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
