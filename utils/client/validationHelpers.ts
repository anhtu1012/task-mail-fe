/* eslint-disable @typescript-eslint/no-explicit-any */

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
