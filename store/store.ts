import storage from "redux-persist/lib/storage"; // Sử dụng localStorage
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import rootReducer from "./RootReducer";

// Cấu hình redux-persist
const persistConfig = {
  key: "root", // Key để lưu trong storage
  storage,
  // Không persist ephemeral selection state
  blacklist: ["yardPlanning", "shipDesign"],
};

// Tạo persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Cấu hình store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Bỏ qua kiểm tra serializable nếu có warning
      immutableCheck: {
        // Disable immutableCheck for specific actions that handle large state
        warnAfter: 128, // Increase warning threshold from 32ms to 128ms
        ignoredActions: [
          "validationErrors/addItemError",
          "validationErrors/removeItemError",
          "validationErrors/clearAllItemErrors",
          "persist/PERSIST",
          "persist/REHYDRATE",
        ],
        ignoredPaths: ["validationErrors.itemErrors"], // Skip checking this path
      },
    }),
});

// Tạo persistor để điều khiển lưu trữ
export const persistor = persistStore(store);

// Infer RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
