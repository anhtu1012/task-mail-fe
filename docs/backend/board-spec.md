# Đặc tả backend — Bảng công việc cá nhân

**Đối tượng đọc:** đội backend `nestjs-auth-cms` (NestJS + Prisma).
**Trạng thái frontend:** màn đã dựng xong, đang chạy trên dữ liệu giả.
**Mục tiêu:** mô tả những gì backend cần bổ sung để thay dữ liệu giả bằng dữ liệu thật, không phải sửa giao diện.

---

## 1. Định hướng sản phẩm — đọc trước khi thiết kế bảng

Đây là **công cụ cá nhân**, không phải bảng cộng tác kiểu Trello/Jira. Khác biệt này quyết định toàn bộ schema bên dưới:

| Không có | Có thay thế |
|---|---|
| Thành viên bảng, mời người, phân quyền theo vai trò | Mỗi người một bảng của riêng mình |
| Người được giao việc (nhiều người/thẻ) | Chủ bảng là người làm, không cần trường giao việc |
| Bình luận qua lại giữa nhiều người | **Ghi chú của tôi** — chỉ mình viết, chỉ mình đọc |
| Nhật ký "ai đã làm gì" | Nhật ký thao tác của chính mình, câu ở ngôi thứ nhất |

Hệ quả kỹ thuật: **không cần bảng `BoardMember`, `TaskAssignee`, không cần `authorId` trên ghi chú, không cần `actorId` trên nhật ký.** Bớt được 2 bảng và toàn bộ tầng phân quyền theo vai trò. Quyền chỉ còn một câu: *chủ bảng thấy bảng của mình, không ai khác thấy*.

Hợp đồng dữ liệu chính xác nằm ở `models/board.ts` — tài liệu này diễn giải lại nó. Mỗi action trong `components/board/BoardStore.tsx` đã đặt tên trùng endpoint dưới đây.

### Khác biệt so với hệ thống Task hiện tại

| Hiện tại | Cần có |
|---|---|
| Cột bảng = 4 giá trị cứng của `TaskStatus` | Cột = bản ghi `TaskList` do người dùng tạo, số lượng tuỳ ý |
| Task không có trường thứ tự | Task cần `position` để sắp xếp tự do trong cột |
| 1 task = 1 `taskTypeId` | Cần nhãn nhiều-nhiều |
| Không có checklist / ghi chú / nhật ký | Cần cả ba |
| Không có thời lượng, không có việc lặp | Cần `estimateMinutes` và `repeat` |

---

## 2. Quyết định kỹ thuật cần thống nhất trước khi code

### 2.1 Thứ tự — dùng `position` kiểu Float

Thả một thẻ vào giữa hai thẻ khác thì giá trị mới là **trung bình cộng position của hai hàng xóm**.

```
Thẻ A: 1024        chèn vào giữa A và B  ->  position = (1024 + 2048) / 2 = 1536
Thẻ B: 2048
```

Mỗi lần kéo thả chỉ ghi **đúng một dòng**, không phải đánh số lại cả cột. Khoảng cách mặc định 1024.

Sau khoảng 50 lần chèn liên tiếp vào cùng một khe, độ chính xác Float64 cạn — khoảng cách hai position xuống dưới `0.001` và cần **cân bằng lại**: đánh số lại cả cột theo bội số 1024. Frontend phát hiện ngưỡng và gọi `POST /lists/:id/rebalance`; backend nên có thêm job quét định kỳ.

> Lựa chọn thay thế là LexoRank (chuỗi ký tự, không bao giờ cạn). Tốn thêm ~2 ngày. Với công cụ cá nhân — một người dùng, không có kéo thả đồng thời — Float + rebalance là thừa đủ. Thiết kế API không đổi khi chuyển sang LexoRank, chỉ đổi kiểu `position` từ `Float` sang `String`.

### 2.2 Giữ nguyên `TaskStatus`, thêm ánh xạ từ danh sách

**Đừng bỏ trường `status` hiện có.** Trang `/kanban`, `/dashboard`, `/tasks` và toàn bộ thống kê đang phụ thuộc vào nó.

Đề xuất: `TaskList` có thêm cột `mapsToStatus`. Kéo thẻ sang danh sách khác thì backend tự cập nhật `status` theo `mapsToStatus` của danh sách đích (nếu danh sách đó khai báo). Nhờ vậy:

- Kéo sang "Hoàn thành" → task tự có `status = DONE` → báo cáo vẫn đúng.
- Danh sách tự tạo như "Tuần này", "Sau này" để `mapsToStatus = null` → không đụng vào status.

Đây là mấu chốt của cả thiết kế: **nhiều cách nhìn, một nguồn dữ liệu.**

### 2.3 Hộp thư đến = thẻ có `listId = null`

Task tạo tự động từ email/Zalo vào hệ thống với `listId = null`. Frontend hiển thị ở panel trái, người dùng kéo sang danh sách phù hợp. Không cần bảng riêng, không cần cờ riêng.

---

## 3. Schema Prisma đề xuất

### 3.1 Bảng mới

```prisma
model Board {
  id        String   @id @default(uuid())
  ownerId   String   @unique      // mỗi người một bảng ở giai đoạn đầu
  title     String
  starred   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner     User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  lists     TaskList[]
  labels    BoardLabel[]
  tasks     Task[]
}

model TaskList {
  id           String      @id @default(uuid())
  boardId      String
  title        String
  position     Float
  archived     Boolean     @default(false)
  wipLimit     Int?
  mapsToStatus TaskStatus?              // xem mục 2.2
  createdAt    DateTime    @default(now())

  board        Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks        Task[]

  @@index([boardId, position])
}

model BoardLabel {
  id      String @id @default(uuid())
  boardId String
  name    String
  color   String                        // hex, ví dụ "#e63946"
  slug    String                        // không dấu, cho quick-add "#baogia"

  board   Board       @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks   TaskLabel[]

  @@unique([boardId, slug])
  @@index([boardId])
}

model TaskLabel {
  taskId  String
  labelId String

  task    Task       @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label   BoardLabel @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
}

model Checklist {
  id        String   @id @default(uuid())
  taskId    String
  title     String
  position  Float
  createdAt DateTime @default(now())

  task      Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  items     ChecklistItem[]

  @@index([taskId, position])
}

model ChecklistItem {
  id          String    @id @default(uuid())
  checklistId String
  content     String
  checked     Boolean   @default(false)
  position    Float
  checkedAt   DateTime?

  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)

  @@index([checklistId, position])
}

model TaskAttachment {
  id        String         @id @default(uuid())
  taskId    String
  name      String
  kind      AttachmentKind
  url       String
  sizeBytes Int?
  isCover   Boolean        @default(false)
  createdAt DateTime       @default(now())

  task      Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

enum AttachmentKind { IMAGE FILE LINK }

/// Ghi chú cá nhân — KHÔNG có authorId, luôn là chủ bảng
model TaskNote {
  id        String    @id @default(uuid())
  taskId    String
  content   String
  createdAt DateTime  @default(now())
  editedAt  DateTime?

  task      Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId, createdAt])
}

/// Nhật ký thao tác của chính mình — KHÔNG có actorId
model TaskActivity {
  id        String         @id @default(uuid())
  taskId    String
  action    ActivityAction
  message   String                       // câu tiếng Việt render sẵn, xem 5.3
  metadata  Json?
  createdAt DateTime       @default(now())

  task      Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId, createdAt])
}

enum ActivityAction {
  CARD_CREATED
  CARD_MOVED
  CARD_COMPLETED
  CARD_REOPENED
  DUE_CHANGED
  SNOOZED
  CHECKLIST_ITEM_CHECKED
  ATTACHMENT_ADDED
  NOTE_ADDED
}
```

### 3.2 Sửa bảng `Task` hiện có

```prisma
model Task {
  // ... giữ nguyên toàn bộ trường hiện tại: code, title, description, note,
  //     taskTypeId, category, priority, status, deadlineStatus, assigneeId,
  //     deadline, completedAt, sourceMailAccountId, ...

  boardId         String?
  listId          String?     // null = đang ở Hộp thư đến
  position        Float   @default(1024)
  cover           String?     // CSS gradient hoặc URL ảnh bìa
  estimateMinutes Int?        // thời lượng dự kiến
  repeatUnit      RepeatUnit? // null = việc một lần
  repeatInterval  Int?

  board       Board?    @relation(fields: [boardId], references: [id])
  list        TaskList? @relation(fields: [listId], references: [id], onDelete: SetNull)
  labels      TaskLabel[]
  checklists  Checklist[]
  attachments TaskAttachment[]
  notes       TaskNote[]
  activities  TaskActivity[]

  @@index([listId, position])
  @@index([boardId, listId])
  @@index([boardId, deadline])   // cho thống kê "hôm nay" ở mục 4.5
}

enum RepeatUnit { DAY WEEK MONTH }
```

`assigneeId` và `taskTypeId` giữ nguyên để không vỡ code cũ. Nhãn (`BoardLabel`) là khái niệm bổ sung, không thay thế `taskTypeId`.

### 3.3 Dữ liệu khởi tạo

> **Cập nhật 22/09/2026:** mục này mô tả bộ khởi tạo **cũ**. Từ nay bảng mới
> chỉ được tạo sẵn **một** danh sách mẫu. Bảng năm cột bên dưới giữ lại để tra
> cứu, vì mọi bảng tạo trước ngày này vẫn đang có đủ năm danh sách đó.

Mỗi bảng mới (một bảng cho mỗi dự án) được tạo sẵn **đúng một** danh sách:

| Danh sách | `mapsToStatus` | `wipLimit` |
|---|---|---|
| Hôm nay | `TODO` | `null` |

Người dùng tự thêm các danh sách còn lại bằng nút "Thêm danh sách". Nguồn sự
thật là `DEFAULT_LISTS` trong `src/common/constants/board.constants.ts` của
backend.

<details>
<summary>Bộ năm danh sách cũ (bảng tạo trước 22/09/2026)</summary>

| Danh sách | `mapsToStatus` | `wipLimit` |
|---|---|---|
| Hôm nay | `TODO` | 5 |
| Đang làm | `IN_PROGRESS` | 3 |
| Tuần này | `null` | null |
| Sau này | `null` | null |
| Hoàn thành | `DONE` | null |

</details>

Toàn bộ task đang có của người đó: gán `listId` theo `status` qua bảng trên, `position` đánh bội số 1024 theo `createdAt`.

---

## 4. Danh sách endpoint

🔴 bắt buộc cho bản chạy được · 🟡 cần cho trải nghiệm đầy đủ · ⚪ làm sau

### 4.1 Bảng

| | Method | Path | Ghi chú |
|---|---|---|---|
| 🔴 | GET | `/boards/me/full` | **Quan trọng nhất** — xem 4.2. Không cần `:id` vì mỗi người một bảng |
| 🔴 | GET | `/boards/me/agenda` | Lịch trong ngày — xem 4.11 |
| 🔴 | GET | `/boards/me/search` | Tìm kiếm toàn bảng cho Ctrl+K — xem 4.12 |
| 🟡 | PATCH | `/boards/:id` | `{ title?, starred? }` |
| ⚪ | GET / POST | `/boards` | Chỉ cần khi cho phép nhiều bảng một người |

### 4.2 `GET /boards/me/full` — endpoint quan trọng nhất

Frontend cần **một lần gọi duy nhất** để dựng cả màn. Gọi nhiều lần (bảng → danh sách → thẻ từng danh sách) sẽ đụng giới hạn 20 request/60 giây ngay khi mở trang.

**Query:** `?cardsPerList=20` (mặc định 20, tối đa 50)

```jsonc
{
  "board":  { "id": "...", "title": "Bảng công việc của tôi", "starred": true, "createdAt": "...", "updatedAt": "..." },
  "lists":  [ { "id": "...", "boardId": "...", "title": "Hôm nay", "position": 1024, "archived": false, "wipLimit": 5, "createdAt": "..." } ],
  "labels": [ { "id": "...", "boardId": "...", "name": "Khách hàng", "color": "#e63946", "slug": "khachhang" } ],
  "cards":  [ /* xem 4.3 */ ],
  "cardCounts": { "<listId>": 42, "inbox": 7 },
  "today":  { "overdue": 3, "dueToday": 5, "doneToday": 2, "plannedMinutes": 180 }
}
```

Bốn điểm cần đúng:

1. **`cards` là bản rút gọn**, không phải bản đầy đủ. Trả kèm checklist/ghi chú của mọi thẻ sẽ khiến response phình lên vài MB.
2. **Chỉ trả `cardsPerList` thẻ đầu mỗi cột.** `cardCounts` cho biết tổng thật để frontend hiện "20 / 42" và tải tiếp khi cuộn.
3. **`today` do backend tính**, không phải frontend cộng từ `cards` — vì `cards` chỉ có 20 thẻ đầu mỗi cột nên cộng ở client sẽ ra số sai. Xem 4.5.
4. `slug` của nhãn là bắt buộc — quick-add ở frontend khớp `#baogia` với nhãn theo slug này.

### 4.3 Hình dạng thẻ rút gọn

```jsonc
{
  "id": "...", "listId": "li1", "boardId": "b1",
  "code": "TSK-000210",
  "title": "Chốt phương án tích hợp hộp thư Gmail",
  "position": 1024,
  "labelIds": ["l5"],
  "priority": "URGENT",
  "category": "WORK",
  "deadline": "2026-09-15T12:00:00.000Z",
  "deadlineStatus": "IN_PROGRESS",
  "completedAt": null,
  "estimateMinutes": 90,
  "repeat": { "unit": "DAY", "interval": 1 },   // null nếu không lặp
  "source": "EMAIL",
  "cover": "linear-gradient(135deg,#0a436d,#2d79a8)",

  // 5 trường dẫn xuất — backend tính sẵn để frontend không phải tải quan hệ con
  "hasDescription": true,
  "attachmentCount": 2,
  "noteCount": 2,
  "checklistDone": 3,
  "checklistTotal": 5
}
```

`source` suy ra từ dữ liệu sẵn có: `sourceMailAccountId != null` → `"EMAIL"`, có liên kết Zalo → `"ZALO"`, còn lại `"MANUAL"`.

### 4.4 Danh sách

| | Method | Path | Body |
|---|---|---|---|
| 🔴 | POST | `/boards/:id/lists` | `{ title, position? }` |
| 🔴 | PATCH | `/lists/:id` | `{ title?, wipLimit?, archived?, mapsToStatus? }` |
| 🔴 | PATCH | `/lists/:id/move` | `{ position }` |
| 🟡 | POST | `/lists/:id/rebalance` | Không body — đánh số lại cả cột, trả mảng `{ id, position }` |
| 🟡 | GET | `/lists/:id/cards` | `?cursor=&limit=20` — tải tiếp khi cuộn trong cột |

Khi `archived = true`: thẻ trong danh sách đó chuyển `listId = null` (quay về Hộp thư đến), **không** bị xoá.

### 4.5 `GET /boards/me/today` — chỉ số hôm nay

Frontend hiện 4 con số ngay trên thanh công cụ: quá hạn, đến hạn hôm nay, đã xong hôm nay, tổng thời lượng dự kiến. Đây là thứ người dùng nhìn đầu tiên khi mở app.

```jsonc
{ "overdue": 3, "dueToday": 5, "doneToday": 2, "plannedMinutes": 180 }
```

Định nghĩa chính xác, cần khớp đúng để con số không nhảy:

- `overdue` — chưa hoàn thành **và** `deadlineStatus = LATE`
- `dueToday` — chưa hoàn thành **và** `deadline` rơi trong hôm nay theo **múi giờ của người dùng**
- `doneToday` — `completedAt` rơi trong hôm nay
- `plannedMinutes` — tổng `estimateMinutes` của nhóm `dueToday` (bỏ qua thẻ không khai báo)

**Múi giờ là điểm dễ sai nhất.** Backend chạy UTC, người dùng ở GMT+7. Việc đến hạn 23:00 giờ Việt Nam sẽ là 16:00 UTC cùng ngày — nhưng việc đến hạn 06:00 giờ Việt Nam là 23:00 UTC **ngày hôm trước**. Nếu cắt ngày theo UTC thì mỗi sáng người dùng sẽ thấy thiếu việc. Nhận tham số `?tz=Asia/Ho_Chi_Minh` hoặc lưu múi giờ trên hồ sơ người dùng.

Endpoint này cũng được trả kèm trong `/boards/me/full` để tiết kiệm một lượt gọi.

### 4.6 Thẻ

| | Method | Path | Body / Ghi chú |
|---|---|---|---|
| 🔴 | PATCH | `/tasks/:id/move` | `{ listId: string \| null, position: number }` — xem 4.7 |
| 🔴 | POST | `/lists/:id/cards` | `{ title, position, deadline?, priority?, labelIds?, estimateMinutes? }` — xem 4.8 |
| 🔴 | GET | `/tasks/:id/detail` | Thẻ đầy đủ kèm checklists, attachments, notes, activities |
| 🔴 | PATCH | `/tasks/:id` | Đã có sẵn — bổ sung nhận `cover`, `labelIds`, `estimateMinutes`, `repeat` |
| 🔴 | PATCH | `/tasks/:id/snooze` | `{ deadline: string \| null }` — xem 4.9 |
| 🟡 | POST/DELETE | `/tasks/:id/labels[/:labelId]` | |
| 🟡 | DELETE | `/tasks/:id` | **Xoá mềm** (`deletedAt`) — xem 5.7 |
| 🟡 | POST | `/tasks/:id/restore` | Khôi phục việc vừa xoá, phục vụ Ctrl+Z |

### 4.7 `PATCH /tasks/:id/move` — tách riêng, đừng gộp vào `PATCH /tasks/:id`

Ba lý do:

1. **Tần suất cao.** Một phiên sắp xếp bảng phát sinh vài chục lời gọi. Response phải cực gọn.
2. **Kèm hiệu ứng phụ.** Move phải đồng thời cập nhật `status` theo `mapsToStatus` và ghi một dòng `TaskActivity` — việc mà `PATCH /tasks/:id` thông thường không làm.
3. **Ngữ nghĩa khác.** Move không bao giờ đụng vào nội dung thẻ, nên validate nhẹ hơn hẳn.

**Request:** `{ "listId": "li2", "position": 1536 }`

**Response — chỉ trả những gì đã đổi:**

```json
{ "id": "...", "listId": "li2", "position": 1536, "status": "IN_PROGRESS", "updatedAt": "..." }
```

Nếu `position` gửi lên đã bị chiếm, backend tự dịch sang giá trị trống gần nhất và trả về giá trị thật. Frontend luôn lấy giá trị trong response làm chuẩn. **Đừng trả 409** — với thao tác kéo thả, tự điều chỉnh mượt hơn hẳn việc bắt người dùng làm lại.

### 4.8 Tạo thẻ — frontend đã tách sẵn, backend nhận dữ liệu có cấu trúc

Frontend có bộ nhập nhanh: người dùng gõ một dòng tự nhiên
`"Gọi khách hàng Hải An mai 9h !gấp #baogia 30p"`, `utils/client/quickParse.ts` tách thành tiêu đề + hạn + ưu tiên + nhãn + thời lượng, và hiện bản xem trước trước khi lưu.

**Backend không cần tự phân tích chuỗi** — cứ nhận các trường đã tách:

```jsonc
{
  "title": "Gọi khách hàng Hải An",
  "position": 1536,
  "deadline": "2026-09-16T02:00:00.000Z",
  "priority": "URGENT",
  "labelIds": ["l1"],
  "estimateMinutes": 30
}
```

Nếu sau này muốn dùng chung logic này cho luồng tạo việc qua email/Zalo (backend nhận chuỗi thô), hãy chuyển `quickParse.ts` thành package dùng chung thay vì viết lại — nó là hàm thuần, không phụ thuộc React.

### 4.9 `PATCH /tasks/:id/snooze` — dời hạn

Thao tác **thường xuyên nhất** của công cụ cá nhân không phải "hoàn thành" mà là "hôm nay chưa làm được, để mai". Frontend có nút dời hạn ngay trên thẻ với 5 mốc: cuối ngày, sáng mai, đầu tuần sau, tháng sau, bỏ hạn.

Frontend đã tính sẵn mốc thời gian đích, backend chỉ cần:

```jsonc
{ "deadline": "2026-09-16T02:00:00.000Z" }   // hoặc null để bỏ hạn
```

và phải làm 3 việc: ghi `deadline`, tính lại `deadlineStatus` về `IN_PROGRESS`, ghi một dòng `TaskActivity` action `SNOOZED`.

### 4.10 Checklist, ghi chú, đính kèm

| | Method | Path | Body |
|---|---|---|---|
| 🟡 | POST | `/tasks/:id/checklists` | `{ title }` |
| 🟡 | DELETE | `/checklists/:id` | |
| 🟡 | POST | `/checklists/:id/items` | `{ content, position }` |
| 🟡 | PATCH | `/checklist-items/:id` | `{ checked?, content?, position? }` |
| 🟡 | DELETE | `/checklist-items/:id` | |
| 🟡 | POST | `/tasks/:id/notes` | `{ content }` |
| 🟡 | PATCH | `/notes/:id` | `{ content }` — đặt `editedAt` |
| 🟡 | DELETE | `/notes/:id` | |
| ⚪ | POST | `/tasks/:id/attachments` | multipart |
| ⚪ | PATCH | `/attachments/:id` | `{ isCover }` |

`PATCH /checklist-items/:id` với `checked = true` phải đồng thời ghi `checkedAt` và tạo một dòng `TaskActivity`.

---

### 4.11 `GET /boards/me/agenda` — lịch trong ngày

Frontend có cột **Lịch hôm nay** xếp việc theo giờ và cảnh báo quá tải.

> **Vì sao không dùng dữ liệu của `/full`:** `/full` chỉ trả 20 thẻ đầu mỗi cột
> (mục 5.2). Việc đến hạn hôm nay nằm rải rác ở mọi cột và có thể rơi ngoài 20
> thẻ đó, nên gom ở client sẽ **thiếu việc** — lỗi kiểu này rất khó phát hiện vì
> màn vẫn hiện bình thường, chỉ là thiếu vài dòng.

**Query:** `?date=2026-09-15&tz=Asia/Ho_Chi_Minh` (bỏ trống `date` = hôm nay)

```jsonc
{
  "date": "2026-09-15",
  // Quá hạn: luôn trả hết, không phân trang — số này không bao giờ lớn,
  // và nếu lớn thì đó chính là thứ người dùng cần nhìn thấy
  "overdue": [ /* thẻ rút gọn, sắp theo deadline tăng dần */ ],
  // Việc đến hạn trong ngày, KHÔNG gồm quá hạn, sắp theo deadline
  "dueToday": [ /* thẻ rút gọn */ ],
  "plannedMinutes": 180,
  "doneToday": 2
}
```

Dùng lại đúng hình dạng thẻ rút gọn ở mục 4.3 — frontend render chung một
component. Cần index `@@index([boardId, deadline])` (đã có trong mục 3.2).

Việc đã hoàn thành **không** xuất hiện trong `overdue`/`dueToday`.

---

### 4.12 `GET /boards/me/search` — tìm kiếm toàn bảng

Frontend có bảng lệnh nhanh (Ctrl+K) cho gõ vài chữ rồi mở thẳng việc cần tìm.
Cũng như mục 4.11, không thể tìm trên dữ liệu `/full` vì đó chỉ là 20 thẻ đầu
mỗi cột.

**Query:** `?q=bao gia&limit=8`

```jsonc
{ "items": [ /* thẻ rút gọn, xem 4.3 */ ], "total": 23 }
```

Ba yêu cầu về cách khớp:

1. **Không phân biệt dấu.** Gõ `bao gia` phải ra `Báo giá`. Postgres dùng
   `unaccent(...) ILIKE unaccent(...)`, nhớ `CREATE EXTENSION unaccent`.
   Frontend đang khớp không dấu ở phía client, nếu backend phân biệt dấu thì
   kết quả hai bên sẽ lệch nhau và rất khó giải thích cho người dùng.
2. **Tìm trên `code`, `title`, và mô tả đã bóc thẻ HTML** — xem mục 5.6.
3. **Xếp hạng:** khớp `code` trước, rồi khớp `title`, cuối cùng mới tới mô tả.
   Trong cùng nhóm thì việc chưa hoàn thành lên trước.

Chỉ tìm trong bảng của chính người gọi.

---

## 5. Quy ước bắt buộc

### 5.1 Giới hạn tần suất — rào cản lớn nhất hiện nay

Giới hạn **20 request / 60 giây** không đủ cho thao tác kéo thả. Sắp xếp lại bảng trong một phút là vượt mức và nhận 429 giữa chừng, thẻ nhảy về chỗ cũ.

Đề nghị một trong hai:

- **Ưu tiên:** nới riêng cho `PATCH /tasks/:id/move`, `PATCH /tasks/:id/snooze` và `PATCH /checklist-items/:id` lên **120 request / 60 giây**. Ba endpoint này ghi rất ít, chi phí thấp.
- **Hoặc:** cấp `PATCH /boards/:id/cards/batch-move` nhận tối đa 50 thao tác trong một lời gọi. Frontend sẽ gom và gửi mỗi 400 ms.

Không xử lý điểm này thì màn bảng không dùng được thật. **Đây là hạng mục chặn.**

### 5.2 Phân trang theo từng cột

Giới hạn `limit=100` hiện tại áp cho cả bảng. Bảng thật cần phân trang **theo từng cột**: `/full` trả 20 thẻ đầu mỗi cột, cuộn trong cột thì gọi `GET /lists/:id/cards?cursor=...`.

Con trỏ nên là `position` của thẻ cuối đã trả, không phải số trang — vì thứ tự thay đổi liên tục.

### 5.3 Câu chữ nhật ký do backend sinh, ở ngôi thứ nhất

`TaskActivity.message` là **câu tiếng Việt hoàn chỉnh, đã ghép tên đối tượng, không có chủ ngữ** (vì chủ ngữ luôn là chính người dùng):

- `"Chuyển từ Hôm nay sang Đang làm"`
- `"Dời hạn sang sáng mai"`
- `"Hoàn thành mục “Bật Gmail API + Pub/Sub watch”"`
- `"Tạo tự động từ hộp thư đến"`

Frontend chỉ hiển thị nguyên `message`. Lý do phải "đóng băng" câu lúc ghi: nội dung phụ thuộc trạng thái tại thời điểm xảy ra — tên danh sách cũ có thể đã bị đổi sau đó. Nếu để frontend ghép câu, nhật ký cũ sẽ sai sau mỗi lần đổi tên.

### 5.4 Phân quyền — rất đơn giản

Mỗi bảng có đúng một chủ. Mọi endpoint kiểm tra một điều kiện: **tài nguyên có thuộc bảng của người đang gọi không.** Không thuộc thì trả 404 (không phải 403 — đừng để lộ sự tồn tại của dữ liệu người khác).

`Role.ADMIN` / `Role.SUPER_ADMIN` ở tầng hệ thống **không** được xem bảng cá nhân của người khác. Hộp thư đến lại càng không — đó là nơi chứa việc chưa phân loại, riêng tư nhất.

### 5.5 Định dạng lỗi

Giữ nguyên cấu trúc hiện có (`statusCode` / `errorCode` / `message` / `path` / `timestamp`). Mã lỗi mới:

| `errorCode` | Khi nào |
|---|---|
| `BOARD_NOT_FOUND` | Bảng không tồn tại hoặc không phải của người gọi |
| `LIST_NOT_FOUND` | |
| `LIST_WIP_EXCEEDED` | Chỉ cảnh báo, **không** chặn — trả 200 kèm cờ `warning` |
| `CARD_NOT_IN_BOARD` | Chuyển thẻ sang danh sách thuộc bảng khác |

---

### 5.6 Mô tả việc lưu dưới dạng HTML

`Task.description` **không còn là chữ thuần**. Frontend dùng trình soạn thảo Quill
(giống dự án `task-management`), nội dung lưu là HTML với các thẻ:

```
h1..h6 · p · br · strong · em · u · s · sub · sup
ul / ol / li (kèm data-checked cho danh sách checkbox)
blockquote · pre.ql-syntax · a · img · iframe (video nhúng)
span/div có class ql-* và thuộc tính style (màu chữ, nền, canh lề, thụt lề)
```

Ba việc backend phải làm:

1. **Kiểu cột**: đổi sang `TEXT` (Postgres) nếu đang là `VARCHAR` có giới hạn.
   Một mô tả có ảnh dán vào dưới dạng `data:` URI dễ vượt vài trăm KB.

2. **Làm sạch HTML khi GHI — bắt buộc.** Đây là lỗ hổng XSS thật, không phải
   lo xa: task có thể được sinh **tự động từ nội dung email**, tức là HTML do
   người ngoài soạn đi thẳng vào cơ sở dữ liệu. Dùng `sanitize-html` hoặc
   `DOMPurify` phía server với danh sách thẻ/thuộc tính đúng bằng danh sách
   trên, chặn `script`, `on*`, `javascript:`. Đừng tin frontend đã lọc.

3. **Trường dẫn xuất `hasDescription`** ở `/boards/me/full` phải bỏ qua HTML
   rỗng. Quill lưu ô trống thành `<p><br></p>`, nếu kiểm tra `description != null`
   thì thẻ nào cũng bị đánh dấu là có mô tả. Frontend có hàm `isRichTextEmpty`
   trong `utils/client/richText.ts` — backend cần một hàm tương đương.

Tìm kiếm toàn văn (nếu có) nên đánh chỉ mục trên **chữ thuần đã bóc thẻ**, không
phải chuỗi HTML — nếu không thì gõ "strong" sẽ ra mọi việc có chữ in đậm.

### 5.7 Hoàn tác — vài ràng buộc nhỏ nhưng quan trọng

Frontend có Ctrl+Z hoàn tác 50 bước. Hiện lịch sử nằm hoàn toàn ở client (state
cục bộ), nhưng khi nối API thật thì backend phải thoả 3 điều:

1. **`DELETE /tasks/:id` nên là xoá mềm** (`deletedAt`), kèm
   `POST /tasks/:id/restore`. Xoá cứng thì Ctrl+Z sau khi xoá một việc là mất
   luôn, không cách nào lấy lại — kể cả checklist và ghi chú kèm theo.
2. **Các thao tác phải lặp lại được (idempotent).** Hoàn tác một lần di chuyển
   nghĩa là gọi lại `move` với `listId` + `position` cũ. Nếu backend từ chối vì
   "position đã tồn tại" thì hoàn tác sẽ hỏng — mục 4.7 đã nói backend tự dịch
   sang khe trống gần nhất thay vì báo lỗi, quy tắc đó phục vụ chính việc này.
3. **Đừng ghi nhật ký cho thao tác hoàn tác.** Người dùng kéo nhầm rồi Ctrl+Z
   mà nhật ký ghi 2 dòng "Chuyển sang X" và "Chuyển sang Y" thì nhật ký thành
   rác. Nhận thêm cờ `?undo=true` trên các endpoint ghi để bỏ qua bước log.

---

---

## 6. Việc lặp lại — cần chốt cách làm

Thẻ có `repeatUnit` + `repeatInterval` (ví dụ "Tổng kết công việc cuối ngày", mỗi 1 ngày). Câu hỏi: **khi hoàn thành thì sinh thẻ mới lúc nào?**

Hai cách, đề xuất chọn cách 1:

1. **Sinh ngay khi hoàn thành.** `PATCH /tasks/:id/complete` trên thẻ có `repeat` sẽ tạo luôn một thẻ mới cùng nội dung, `deadline` = hạn cũ + chu kỳ, cùng danh sách, `position` ở cuối. Đơn giản, không cần job nền, người dùng thấy ngay việc tiếp theo.
2. Job nền chạy hằng đêm quét và sinh thẻ. Cần thêm hạ tầng, và nếu người dùng hoàn thành sớm thì phải chờ tới hôm sau mới thấy việc kế tiếp.

Với cách 1, response của `/complete` cần trả cả thẻ mới để frontend chèn vào bảng mà không phải tải lại:

```jsonc
{ "completed": { /* thẻ vừa xong */ }, "next": { /* thẻ lặp mới, null nếu không lặp */ } }
```

---

## 7. Thứ tự bàn giao đề xuất

| Giai đoạn | Nội dung | Mở khoá được gì ở frontend |
|---|---|---|
| **1** | Schema + migration + seed bảng mặc định + `GET /boards/me/full` | Màn hiện dữ liệu thật (chỉ đọc) |
| **2** | `PATCH /tasks/:id/move`, `POST /lists/:id/cards`, `PATCH /lists/:id`, nới giới hạn tần suất (5.1) | Kéo thả + nhập nhanh hoạt động — lúc này màn thực sự dùng được |
| **3** | `PATCH /tasks/:id/snooze`, `GET /boards/me/today`, `GET /boards/me/agenda` | Dời hạn, chỉ số hôm nay, cột Lịch hôm nay |
| **3b** | `GET /boards/me/search` | Bảng lệnh nhanh Ctrl+K tìm được toàn bộ việc |
| **4** | `GET /tasks/:id/detail`, checklist, ghi chú, nhật ký | Màn chi tiết việc hoạt động |
| **5** | Nhãn, đính kèm, ảnh bìa, việc lặp (mục 6), xoá mềm + khôi phục (5.7) | Đầy đủ |

Giai đoạn 1–3 là đủ để đưa lên môi trường thử nghiệm cho người dùng thật. Giai đoạn 3b nên làm ngay sau đó — thiếu nó thì Ctrl+K chỉ tìm được trong số thẻ đã tải về, tức là kết quả sai một cách âm thầm.

---

## 8. Danh sách nghiệm thu

- [ ] `GET /boards/me/full` trả đủ 6 khối, phản hồi dưới 400 ms với bảng 200 thẻ
- [ ] `cardCounts` khớp số thẻ thật, không phải số thẻ đã trả
- [ ] `today.dueToday` đúng với việc đến hạn 06:00 và 23:00 giờ Việt Nam (bẫy múi giờ ở 4.5)
- [ ] Kéo 30 thẻ liên tiếp trong 30 giây không gặp 429
- [ ] Kéo thẻ sang danh sách có `mapsToStatus` thì `status` đổi theo, và `/kanban` cũ phản ánh đúng
- [ ] Chèn 60 lần liên tiếp vào cùng một khe rồi rebalance — thứ tự không đổi
- [ ] `message` của nhật ký giữ nguyên tên danh sách cũ sau khi danh sách đó được đổi tên
- [ ] Lưu trữ một danh sách: thẻ quay về Hộp thư đến, không thẻ nào mất
- [ ] Người dùng A gọi API trên thẻ của người dùng B nhận **404**, không phải 403
- [ ] Hoàn thành việc có `repeat` thì trả về thẻ kế tiếp trong `next`
- [ ] Gửi mô tả chứa `<script>alert(1)</script>` thì bị lọc sạch khi lưu (mục 5.6)
- [ ] Mô tả `<p><br></p>` cho `hasDescription = false`
- [ ] Tạo 30 việc trong một cột, đặt hạn hôm nay cho việc thứ 25 — `/agenda` vẫn trả về nó (bẫy phân trang ở 4.11)
- [ ] `/search?q=bao gia` trả về việc tên "Báo giá..." (không phân biệt dấu, mục 4.12)
- [ ] Gọi `move` hai lần với cùng `listId` + `position` đều thành công, không lỗi (ràng buộc hoàn tác ở 5.7)
- [ ] Xoá việc rồi `POST /tasks/:id/restore` khôi phục đủ cả checklist và ghi chú

---

## 9. Câu hỏi cần backend trả lời

1. Có chấp nhận nới giới hạn tần suất cho `move` / `snooze` không (5.1)? Nếu không, frontend sẽ gom batch — nhưng cần backend cấp endpoint `batch-move`.
2. Múi giờ người dùng lưu ở đâu — trên hồ sơ `User`, hay frontend gửi kèm mỗi request? Ảnh hưởng trực tiếp tới mục 4.5.
3. Lưu tệp đính kèm ở đâu — S3, đĩa cục bộ, hay dịch vụ sẵn có? Quyết định frontend có phải xin URL upload trước hay không.
4. Việc lặp chọn cách 1 hay cách 2 ở mục 6?
5. Postgres đã bật extension `unaccent` chưa? Cần cho tìm kiếm không dấu ở mục 4.12.
6. Xoá việc làm xoá mềm được không (mục 5.7)? Nếu bắt buộc xoá cứng thì frontend sẽ phải chặn Ctrl+Z cho thao tác xoá, và cần báo trước để tôi đổi.
7. Giai đoạn đầu cố định **mỗi người một bảng** (`Board.ownerId @unique`) có ổn không, hay muốn mở nhiều bảng ngay từ đầu? Bỏ ràng buộc `@unique` sau này dễ, thêm vào thì khó.
