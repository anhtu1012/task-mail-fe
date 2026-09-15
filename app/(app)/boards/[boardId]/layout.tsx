import { ReactNode } from "react";
import { BoardProvider } from "@/components/board/BoardStore";

/**
 * `modal` là parallel route slot (@modal). Bấm một thẻ từ board thì route
 * /boards/:id/cards/:cardId bị chặn bởi @modal/(.)cards/[cardId] và hiện dạng
 * modal đè lên board; mở thẳng link hoặc F5 thì rơi vào cards/[cardId] —
 * trang đầy đủ nằm trong layout hệ thống. Nhờ vậy link của thẻ luôn gửi được.
 */
export default function BoardLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <BoardProvider>
      {children}
      {modal}
    </BoardProvider>
  );
}
