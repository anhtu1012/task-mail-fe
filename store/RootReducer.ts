import { combineReducers } from "@reduxjs/toolkit";
import counterReducer from "@/store/slices/counterSlice";
import bayDataGCReducer from "@/store/slices/bayDataGCSlice";
import dtoCntrDetailsReducer from "@/store/slices/cntrDetailsSlice";
import authReducer from "@/store/slices/loginSlice";
import permissionsReducer from "@/store/slices/permissions";
import siderReducer from "@/store/slices/breadcrumb";
import shipReducer from "@/store/slices/shipDataSlice";
import messagesReducer from "@/store/slices/messagesSlice";
import lockedDeviceReducer from "@/store/slices/lockedDeviceSlice";
import validationErrorsReducer from "@/store/slices/validationErrorsSlice";
import terminalReducer from "@/store/slices/terminalSlice";
import yardPlanningReducer from "@/store/slices/yardPlanningSlice";
import shipDesignReducer from "@/store/slices/shipDesignSlice";
// import darkModeReducer from "@/store/slices/darkModeSlice";

const rootReducer = combineReducers({
  counter: counterReducer,
  bayDataGC: bayDataGCReducer,
  dtoCntrDetails: dtoCntrDetailsReducer,
  auth: authReducer,
  permissions: permissionsReducer,
  sider: siderReducer,
  ship: shipReducer,
  lockedDevice: lockedDeviceReducer,
  messages: messagesReducer,
  validationErrors: validationErrorsReducer,
  terminal: terminalReducer,
  yardPlanning: yardPlanningReducer,
  shipDesign: shipDesignReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
