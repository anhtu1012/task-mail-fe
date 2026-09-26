/**
 * Khoá cache của bảng — tách ra file riêng để `hooks/useProjects` dùng được mà
 * không phải import ngược vào `components/board/BoardStore` (vòng import).
 * BoardStore re-export lại, các nơi khác cứ import từ đó như cũ.
 */
export const BOARD_QUERY_KEY = ["board", "snapshot"] as const;

/**
 * Bản cất của bảng một dự án, để đổi qua lại giữa các dự án không phải tải lại
 * từ đầu (xem `useSwitchProject`). Đầu khoá KHÔNG phải "board" để lượt dọn
 * `removeQueries(["board"])` khi đổi dự án không cuốn nó theo; có `userId` để
 * người đăng nhập sau trên cùng tab không bao giờ trúng bản cất của người trước.
 */
export const boardStashKey = (userId: string, projectId: string) =>
  ["board-stash", userId, projectId] as const;
