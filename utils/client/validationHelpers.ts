/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorItem, ItemErrors } from "@/store/slices/validationErrorsSlice";
import { useCallback } from "react";

/**
 * Helper function to get a unique row identifier (uses unitKey first, then id)
 * @param data Object containing unitKey and/or id
 * @returns A string identifier
 */
export const getItemId = (data: any): string => {
  return (
    data.unitKey ||
    data.id ||
    data.mnfLdId ||
    data.cntrDetailId ||
    (data.mId && data.cId ? `${data.mId}-${data.cId}` : data.mId) ||
    ""
  );
};

/**
 * Kiểm tra xem một trường có lỗi không dựa trên danh sách lỗi từ Redux
 * @param validationErrors Danh sách lỗi từ Redux store
 * @returns Function to check if a field has an error
 */
export const useHasFieldError = (validationErrors: ErrorItem[]) => {
  return useCallback(
    (fieldName: string): boolean => {
      if (!validationErrors || !Array.isArray(validationErrors)) return false;
      return validationErrors.some((err) => err && err.field === fieldName);
    },
    [validationErrors],
  );
};

/**
 * Kiểm tra xem một trường của một item cụ thể có lỗi không
 * @param itemErrors Danh sách lỗi của các item từ Redux store
 * @returns Function to check if a field has an error for a specific item
 */
export const useHasItemFieldError = (itemErrors: ItemErrors[]) => {
  return useCallback(
    (itemId: string | number, fieldName: string): boolean => {
      if (!itemErrors || !Array.isArray(itemErrors)) return false;
      const itemErrorObj = itemErrors.find(
        (item) => item && item.itemId === itemId,
      );
      if (!itemErrorObj || !Array.isArray(itemErrorObj.errors)) return false;
      return itemErrorObj.errors.some((err) => err && err.field === fieldName);
    },
    [itemErrors],
  );
};

/**
 * Lấy thông báo lỗi cho một trường dựa trên danh sách lỗi từ Redux
 * @param validationErrors Danh sách lỗi từ Redux store
 * @returns Function to get error message for a field
 */
export const useGetFieldErrorMessage = (validationErrors: ErrorItem[]) => {
  return useCallback(
    (fieldName: string): string => {
      if (!validationErrors || !Array.isArray(validationErrors)) return "";
      const error = validationErrors.find(
        (err) => err && err.field === fieldName,
      );
      return error?.message || "";
    },
    [validationErrors],
  );
};

/**
 * Lấy thông báo lỗi cho một trường của một item cụ thể
 * @param itemErrors Danh sách lỗi của các item từ Redux store
 * @returns Function to get error message for a field of a specific item
 */
export const useGetItemFieldErrorMessage = (itemErrors: ItemErrors[]) => {
  return useCallback(
    (itemId: string, fieldName: string): string => {
      if (!itemErrors || !Array.isArray(itemErrors)) return "";
      const itemErrorObj = itemErrors.find(
        (item) => item && item.itemId === itemId,
      );
      if (!itemErrorObj || !Array.isArray(itemErrorObj.errors)) return "";
      const error = itemErrorObj.errors.find(
        (err) => err && err.field === fieldName,
      );
      return error?.message || "";
    },
    [itemErrors],
  );
};

/**
 * Tạo style cho ô có lỗi, kiểm tra cả lỗi của trường và lỗi của dòng
 * @param hasFieldError Hàm kiểm tra lỗi của trường
 * @returns Function to get cell style based on errors
 */
export const useErrorCellStyle = (
  hasFieldError: (fieldName: string) => boolean,
) => {
  return useCallback(
    (fieldName: string, params?: any) => {
      if (!fieldName) return null;

      // Kiểm tra lỗi của trường trong Redux
      const hasReduxError = hasFieldError(fieldName);

      // Kiểm tra lỗi của dòng (row.isError)
      const hasRowError = params?.data?.isError;

      // Chỉ hiển thị border lỗi nếu cả hai điều kiện đều đúng: trường có lỗi và hàng có trạng thái lỗi
      if (hasReduxError && hasRowError) {
        return { border: "1px solid orange" };
      }

      return { border: "" };
    },
    [hasFieldError],
  );
};

/**
 * Tạo style cho ô có lỗi cho một item cụ thể
 * @param hasItemFieldError Hàm kiểm tra lỗi của trường trên item
 * @returns Function to get cell style based on item-specific errors
 */
export const useItemErrorCellStyle = (
  hasItemFieldError: (itemId: string | number, fieldName: string) => boolean,
) => {
  return useCallback(
    (itemId: string | number, fieldName: string, params?: any) => {
      if (!itemId || !fieldName) return null;

      // Kiểm tra lỗi của trường trong Redux cho item cụ thể
      const hasReduxError = hasItemFieldError(itemId, fieldName);

      // Kiểm tra lỗi của dòng (row.isError)
      const hasRowError = params?.data?.isError;

      // Chỉ hiển thị border lỗi nếu cả hai điều kiện đều đúng: trường có lỗi và hàng có trạng thái lỗi
      if (hasReduxError && hasRowError) {
        return { border: "1px solid orange" };
      }

      return { border: "" };
    },
    [hasItemFieldError],
  );
};

/**
 * Tạo tiêu đề có chỉ báo lỗi
 * @param hasFieldError Hàm kiểm tra lỗi
 * @returns Function to get header with error indicator
 */
export const useGetHeaderWithErrorIndicator = (
  hasFieldError: (fieldName: string) => boolean,
) => {
  return useCallback(
    (fieldLabel: string, fieldName: string): string => {
      if (!fieldName || !fieldLabel) return fieldLabel || "";
      return fieldLabel + (hasFieldError(fieldName) ? " ⚠️" : "");
    },
    [hasFieldError],
  );
};

/**
 * Tạo tiêu đề có chỉ báo lỗi của item cụ thể
 * @param hasItemFieldError Hàm kiểm tra lỗi của item
 * @returns Function to get header with item-specific error indicator
 */
export const useGetHeaderWithItemErrorIndicator = (
  hasItemFieldError: (itemId: string, fieldName: string) => boolean,
) => {
  return useCallback(
    (itemId: string, fieldLabel: string, fieldName: string): string => {
      if (!itemId || !fieldName || !fieldLabel) return fieldLabel || "";
      return fieldLabel + (hasItemFieldError(itemId, fieldName) ? " ⚠️" : "");
    },
    [hasItemFieldError],
  );
};
