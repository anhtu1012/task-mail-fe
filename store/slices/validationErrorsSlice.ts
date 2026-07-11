import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";

// Interface for error item
export interface ErrorItem {
  field: string;
  message: string;
}

// Interface for item-specific errors
export interface ItemErrors {
  itemId: string; // Can be id or unitKey
  errors: ErrorItem[];
}

// Interface for the state
export interface ValidationErrorsState {
  errors: ErrorItem[];
  itemErrors: ItemErrors[]; // New field for item-specific errors
}

// Initial state
const initialState: ValidationErrorsState = {
  errors: [],
  itemErrors: [], // Initialize empty array for item errors
};

const validationErrorsSlice = createSlice({
  name: "validationErrors",
  initialState,
  reducers: {
    // Add a new validation error
    addError: (state, action: PayloadAction<ErrorItem>) => {
      // Check if error already exists for this field
      const existingError = state.errors.findIndex(
        (item) => item.field === action.payload.field,
      );

      if (existingError !== -1) {
        // Update existing error
        state.errors[existingError] = action.payload;
      } else {
        // Add new error
        state.errors.push(action.payload);
      }
    },

    // Remove a validation error by field name
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter(
        (item) => item.field !== action.payload,
      );
    },

    // Clear all validation errors
    clearErrors: (state) => {
      state.errors = [];
    },

    // Add an error for a specific item
    addItemError: (
      state,
      action: PayloadAction<{ itemId: string; error: ErrorItem }>,
    ) => {
      const { itemId, error } = action.payload;

      // Find if this item already has errors
      const itemIndex = state.itemErrors.findIndex(
        (item) => item.itemId === itemId,
      );

      if (itemIndex !== -1) {
        // Item exists, check if this field error already exists
        const existingErrorIndex = state.itemErrors[itemIndex].errors.findIndex(
          (e) => e.field === error.field,
        );

        if (existingErrorIndex !== -1) {
          // Update existing error
          state.itemErrors[itemIndex].errors[existingErrorIndex] = error;
        } else {
          // Add new error to existing item
          state.itemErrors[itemIndex].errors.push(error);
        }
      } else {
        // Add new item with this error
        state.itemErrors.push({
          itemId,
          errors: [error],
        });
      }
    },

    // Remove a specific error from an item
    removeItemError: (
      state,
      action: PayloadAction<{ itemId: string; field: string }>,
    ) => {
      const { itemId, field } = action.payload;
      if (!state.itemErrors) return;

      if (field === "") {
        // Xóa toàn bộ lỗi của itemId này
        state.itemErrors = state.itemErrors.filter(
          (item) => item.itemId !== itemId,
        );
        return;
      }

      const itemIndex = state.itemErrors.findIndex(
        (item) => item.itemId === itemId,
      );

      if (itemIndex !== -1) {
        // Filter out the error with this field
        state.itemErrors[itemIndex].errors = state.itemErrors[
          itemIndex
        ].errors.filter((e) => e.field !== field);

        // If no errors left, remove the item entry completely
        if (state.itemErrors[itemIndex].errors.length === 0) {
          state.itemErrors = state.itemErrors.filter(
            (item) => item.itemId !== itemId,
          );
        }
      }
    },

    // Clear all errors for a specific item
    clearItemErrors: (state, action: PayloadAction<string>) => {
      state.itemErrors = state.itemErrors.filter(
        (item) => item.itemId !== action.payload,
      );
    },

    // Clear all item errors
    clearAllItemErrors: (state) => {
      state.itemErrors = [];
    },
  },
});

export const {
  addError,
  removeError,
  clearErrors,
  addItemError,
  removeItemError,
  clearItemErrors,
  clearAllItemErrors,
} = validationErrorsSlice.actions;

export const selectAllErrors = (state: RootState) =>
  state.validationErrors.errors || [];
export const selectErrorByField = (state: RootState, field: string) =>
  state.validationErrors.errors.find((item) => item.field === field);

// Selectors for item-specific errors
export const selectAllItemErrors = (state: RootState) =>
  state.validationErrors.itemErrors || [];
export const selectItemErrors = (state: RootState, itemId: string) =>
  state.validationErrors.itemErrors.find((item) => item.itemId === itemId)
    ?.errors || [];
export const selectItemErrorByField = (
  state: RootState,
  itemId: string,
  field: string,
) =>
  state.validationErrors.itemErrors
    .find((item) => item.itemId === itemId)
    ?.errors.find((error) => error.field === field);
export const selectHasItemErrors = (state: RootState, itemId: string) =>
  state.validationErrors.itemErrors.some((item) => item.itemId === itemId);

export default validationErrorsSlice.reducer;
