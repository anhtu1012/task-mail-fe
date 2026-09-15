# Hợp đồng API bảng công việc — bản backend đã làm

**Dùng để làm gì:** đối chiếu với `board-spec.md`. Mọi hình dạng dưới đây là
**đã code xong**, lấy trực tiếp từ DTO của backend, không phải đề xuất.

**Trạng thái:** typecheck / lint / 58 unit test đều xanh, `nest build` chạy được.
Migration **đã chạy** trên DB Supabase dev, và toàn bộ endpoint đã được gọi thật
một lượt (xem [§13](#13-đã-kiểm-tới-đâu)) — không còn là code chưa chạy bao giờ.

Cuối file có [danh sách để FE tick](#12-danh-sách-fe-tick).

---

## 1. Quy ước chung — đọc trước, dễ sai nhất

### 1.1 Không có lớp bọc response

Response trả **thẳng object**, không bọc `{ success, data }`:

```jsonc
// GET /boards/me/today  ->  200
{ "overdue": 3, "dueToday": 5, "doneToday": 2, "plannedMinutes": 180 }
```

Backend có sẵn `ResponseTransformInterceptor` nhưng **không đăng ký global**, nên
đừng viết `res.data.data`. Nếu FE đang mong có lớp bọc thì báo lại, bật thêm một
dòng là xong — nhưng phải bật cho *toàn bộ* API, kể cả auth/tasks cũ.

### 1.2 Không có prefix, không có version

Đường dẫn đúng như viết trong tài liệu: `GET /boards/me/full`, không phải
`/api/v1/boards/me/full`.

### 1.3 Xác thực

`Authorization: Bearer <access token>` như mọi endpoint hiện có. Không endpoint
nào của bảng là public.

### 1.4 Hình dạng lỗi — giữ nguyên cấu trúc cũ

```jsonc
{
  "statusCode": 404,
  "errorCode": "CARD_NOT_FOUND",
  "message": "Không tìm thấy việc",
  "path": "/tasks/9f1c.../move",
  "timestamp": "2026-09-15T03:12:44.918Z"
}
```

Mã lỗi mới:

| `errorCode` | HTTP | Khi nào |
|---|---|---|
| `BOARD_NOT_FOUND` | 404 | Bảng không tồn tại **hoặc** không phải của người gọi |
| `LIST_NOT_FOUND` | 404 | |
| `CARD_NOT_FOUND` | 404 | |
| `LABEL_NOT_FOUND` | 404 | Kể cả khi gắn `labelIds` có id lạ |
| `CHECKLIST_NOT_FOUND` / `CHECKLIST_ITEM_NOT_FOUND` | 404 | |
| `NOTE_NOT_FOUND` / `ATTACHMENT_NOT_FOUND` | 404 | |
| `CARD_NOT_IN_BOARD` | 400 | Chuyển thẻ sang danh sách thuộc bảng khác |
| `INVALID_TIMEZONE` | 400 | `?tz=` không phải IANA zone hợp lệ |

`LIST_WIP_EXCEEDED` **không bao giờ là lỗi** — xem [4.1](#41-patch-tasksidmove).

### 1.5 Body thừa field sẽ bị từ chối

Validation bật `forbidNonWhitelisted`. Gửi kèm field không có trong bảng body
dưới đây → **400**, không phải bỏ qua im lặng.

```jsonc
// PATCH /tasks/:id/move
{ "listId": "...", "position": 1536, "title": "abc" }   // -> 400
```

### 1.6 Mọi `:id` phải là UUID v4

Sai định dạng → **400** trước khi vào service.

### 1.7 Giới hạn tần suất

Mặc định toàn hệ thống vẫn là **20 request / 60 giây**. Các endpoint sau được nới
riêng lên **120 request / 60 giây**:

- `PATCH /tasks/:id/move`
- `PATCH /tasks/:id/snooze`
- `PATCH /checklist-items/:id`
- `POST /lists/:id/cards`, `POST /tasks/inbox/cards`
- `POST /checklists/:id/items`
- `PATCH /lists/:id/move`

Không cần `batch-move`. Nếu FE vẫn muốn gom batch thì báo, nhưng theo đo đạc thì
120/60s là thừa cho thao tác kéo thả bằng tay.

### 1.8 Bảng được tạo tự động

Không có bước "tạo bảng". Lần đầu người dùng gọi bất kỳ endpoint bảng nào,
backend tự tạo bảng + 5 danh sách mặc định (Hôm nay / Đang làm / Tuần này /
Sau này / Hoàn thành) và gán toàn bộ task cũ của họ vào cột theo `status`.

---

## 2. Hình dạng dữ liệu dùng lại

### 2.1 Thẻ rút gọn (`CardSummary`)

Dùng ở `/full`, `/agenda`, `/search`, `/lists/:id/cards`, và mọi response ghi
của thẻ.

```jsonc
{
  "id": "9f1c2e40-...",
  "listId": "li1-uuid",              // null = đang ở Hộp thư đến
  "boardId": "b1-uuid",
  "code": "TSK-000210",
  "title": "Chốt phương án tích hợp hộp thư Gmail",
  "position": 1024,
  "labelIds": ["l5-uuid"],
  "priority": "URGENT",              // LOW | NORMAL | HIGH | URGENT
  "category": "WORK",                // WORK | PERSONAL
  "status": "IN_PROGRESS",           // TODO | IN_PROGRESS | DONE | CANCELLED
  "deadline": "2026-09-15T12:00:00.000Z",
  "deadlineStatus": "IN_PROGRESS",   // IN_PROGRESS | ON_TIME | LATE
  "completedAt": null,
  "estimateMinutes": 90,
  "repeat": { "unit": "DAY", "interval": 1 },   // null nếu không lặp
  "source": "EMAIL",                 // EMAIL | ZALO | MANUAL
  "cover": "linear-gradient(135deg,#0a436d,#2d79a8)",

  "hasDescription": true,
  "attachmentCount": 2,
  "noteCount": 2,
  "checklistDone": 3,
  "checklistTotal": 5
}
```

> ⚠️ **Thêm so với mục 4.3 của đặc tả:** có thêm `status`. Kéo thẻ sang cột có
> `mapsToStatus` thì `status` đổi theo, FE cần giá trị này để không phải suy ra
> từ `listId`. Nếu không dùng thì cứ bỏ qua.

**`source` suy ra thế nào:** `sourceMailAccountId != null` → `EMAIL`;
`externalRef` bắt đầu bằng `zalo:` → `ZALO`; còn lại → `MANUAL`.

**`hasDescription`** tính bằng SQL, đã bỏ qua HTML rỗng: `<p><br></p>`,
`<p>&nbsp;</p>`, khoảng trắng → `false`. Mô tả chỉ có `<img>` → `true`.

### 2.2 Bảng / danh sách / nhãn

```jsonc
// Board
{ "id": "...", "title": "Bảng công việc của tôi", "starred": true,
  "createdAt": "...", "updatedAt": "..." }

// TaskList
{ "id": "...", "boardId": "...", "title": "Hôm nay", "position": 1024,
  "archived": false, "wipLimit": 5, "mapsToStatus": "TODO", "createdAt": "..." }

// BoardLabel
{ "id": "...", "boardId": "...", "name": "Khách hàng",
  "color": "#e63946", "slug": "khachhang" }
```

`mapsToStatus` là `TaskStatus` hoặc `null`. `wipLimit` là số hoặc `null`.
`Board` **không** trả `ownerId` — luôn là chính người gọi.

### 2.3 Quan hệ con (chỉ xuất hiện ở `/detail`)

```jsonc
// Checklist
{ "id": "...", "taskId": "...", "title": "Chuẩn bị tài liệu", "position": 1024,
  "items": [ { "id": "...", "checklistId": "...", "content": "Gọi xác nhận",
               "checked": true, "position": 1024,
               "checkedAt": "2026-09-14T09:00:00.000Z" } ] }

// TaskNote  (không có authorId — luôn là chủ bảng)
{ "id": "...", "taskId": "...", "content": "…", "createdAt": "...",
  "editedAt": null }

// TaskAttachment
{ "id": "...", "taskId": "...", "name": "baogia.pdf", "kind": "FILE",
  "url": "https://...", "sizeBytes": 128394, "isCover": false,
  "createdAt": "..." }

// TaskActivity  (không có actorId — luôn là chủ bảng)
{ "id": "...", "taskId": "...", "action": "CARD_MOVED",
  "message": "Chuyển từ Hôm nay sang Đang làm",
  "createdAt": "..." }
```

`action` ∈ `CARD_CREATED`, `CARD_MOVED`, `CARD_COMPLETED`, `CARD_REOPENED`,
`DUE_CHANGED`, `SNOOZED`, `CHECKLIST_ITEM_CHECKED`, `ATTACHMENT_ADDED`,
`NOTE_ADDED`.

FE **chỉ hiển thị nguyên `message`**, không tự ghép câu. Câu đã được đóng băng
lúc ghi nên đổi tên danh sách sau đó không làm sai nhật ký cũ.
`/detail` trả **50 dòng nhật ký gần nhất**, mới nhất trước.

---

## 3. Bảng

### 3.1 `GET /boards/me/full`

**Query:** `cardsPerList` (mặc định 20, tối đa 50) · `tz` (IANA zone)

```jsonc
{
  "board":  { /* 2.2 */ },
  "lists":  [ /* 2.2, sắp theo position tăng dần, gồm cả archived */ ],
  "labels": [ /* 2.2, sắp theo name */ ],
  "cards":  [ /* 2.1 — 20 thẻ đầu MỖI cột, Hộp thư đến đứng trước */ ],
  "cardCounts": { "<listId>": 42, "inbox": 7 },
  "today":  { "overdue": 3, "dueToday": 5, "doneToday": 2, "plannedMinutes": 180 }
}
```

- `cardCounts` là **tổng thật**, không phải số thẻ đã trả. Khoá của Hộp thư đến
  là chuỗi `"inbox"`. Cột rỗng **không có khoá** trong object → FE đọc
  `cardCounts[listId] ?? 0`.
- `cards` gộp mọi cột trong một mảng phẳng, FE tự nhóm theo `listId`.
- `lists` trả **cả danh sách đã lưu trữ** (`archived: true`) để FE tự lọc.

### 3.2 `GET /boards/me/today`

**Query:** `tz`

```jsonc
{ "overdue": 3, "dueToday": 5, "doneToday": 2, "plannedMinutes": 180 }
```

Định nghĩa đúng như mục 4.5:

| Trường | Nghĩa |
|---|---|
| `overdue` | Chưa xong (`completedAt = null`, status ∉ {DONE, CANCELLED}) và `deadline < bây giờ` |
| `dueToday` | Chưa xong và `deadline` rơi trong hôm nay **theo múi giờ người dùng** |
| `doneToday` | `completedAt` rơi trong hôm nay |
| `plannedMinutes` | Tổng `estimateMinutes` của nhóm `dueToday` (bỏ qua thẻ không khai) |

> ⚠️ **`overdue` và `dueToday` cố tình chồng nhau.** Việc đến hạn 06:00 hôm nay,
> lúc 10:00 sáng, được đếm ở **cả hai**. Đây đúng là định nghĩa ở mục 4.5 và
> đúng với ô nghiệm thu "dueToday đúng với việc đến hạn 06:00 và 23:00 giờ VN".
> `overdue + dueToday` **không** phải tổng việc cần làm — đừng cộng hai số này.

**Múi giờ:** ưu tiên `?tz=` → cột `User.timezone` → mặc định
`Asia/Ho_Chi_Minh`. FE cứ gửi `?tz=` cho chắc.

### 3.3 `PATCH /boards/:id`

Body: `{ "title"?: string, "starred"?: boolean }` → trả `Board` (2.2).

---

## 4. Thẻ

### 4.1 `PATCH /tasks/:id/move`

**Query:** `undo=true` để bỏ ghi nhật ký (xem [§9](#9-hoàn-tác-ctrlz)).

```jsonc
// Request
{ "listId": "li2-uuid", "position": 1536 }   // listId: null = trả về Hộp thư đến

// Response 200 — chỉ những gì đã đổi
{ "id": "...", "listId": "li2-uuid", "position": 1536,
  "status": "IN_PROGRESS", "updatedAt": "..." }
```

**Hai điều FE phải nhớ:**

1. **`position` trong response mới là chuẩn.** Nếu khe gửi lên đã bị chiếm,
   backend tự dịch sang giá trị trống gần nhất và trả về giá trị thật. Không có
   409. Gọi lại đúng `listId` + `position` cũ (đúng thao tác hoàn tác) luôn
   thành công và cho ra cùng một kết quả.
2. **Vượt WIP không bị chặn**, chỉ có thêm field `warning`:

```jsonc
{ "id": "...", "listId": "...", "position": 1536, "status": "TODO",
  "updatedAt": "...", "warning": "LIST_WIP_EXCEEDED" }
```

`warning` **vắng mặt** khi không có cảnh báo (không phải `null`).

`status` đổi theo `mapsToStatus` của cột đích. Kéo vào cột `DONE` thì backend tự
set `completedAt`; kéo ra khỏi `DONE` thì tự xoá `completedAt`.

### 4.2 `POST /lists/:id/cards` · `POST /tasks/inbox/cards`

Backend **không phân tích chuỗi tự nhiên** — nhận đúng các trường `quickParse.ts`
đã tách.

```jsonc
{
  "title": "Gọi khách hàng Hải An",   // bắt buộc, tối đa 500 ký tự
  "position": 1536,                    // bỏ trống = thêm vào cuối cột
  "deadline": "2026-09-16T02:00:00.000Z",
  "priority": "URGENT",
  "category": "WORK",
  "labelIds": ["l1-uuid"],
  "estimateMinutes": 30,
  "description": "<p>HTML Quill</p>",  // backend tự làm sạch
  "repeat": { "unit": "DAY", "interval": 1 },
  "cover": "linear-gradient(...)"
}
```

→ **201**, trả `CardSummary` (2.1).

Tạo trong cột có `mapsToStatus` thì thẻ nhận luôn `status` đó.
`labelIds` chứa id không thuộc bảng → **404 `LABEL_NOT_FOUND`**, không tạo thẻ.

### 4.3 `GET /tasks/:id/detail`

Trả `CardSummary` (2.1) **cộng thêm**:

```jsonc
{
  "...": "toàn bộ field của CardSummary",
  "description": "<p>HTML đã làm sạch</p>",   // null nếu chưa có
  "note": null,
  "taskTypeId": null,
  "attachmentLinks": ["https://..."],   // mảng String[] cũ trên Task, KHÁC attachments
  "checklists":  [ /* 2.3 */ ],
  "attachments": [ /* 2.3 — bản ghi TaskAttachment */ ],
  "notes":       [ /* 2.3, mới nhất trước */ ],
  "activities":  [ /* 2.3, mới nhất trước, tối đa 50 */ ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

> ⚠️ **Hai thứ tên gần giống nhau:** `attachmentLinks` là cột `String[]` có sẵn
> trên `Task` (link bóc ra từ email). `attachments` là bảng `TaskAttachment` mới
> (có `isCover`). Đừng lẫn.

### 4.4 `PATCH /tasks/:id/snooze`

**Query:** `tz` (để câu nhật ký ghi đúng giờ) · `undo=true`

```jsonc
{ "deadline": "2026-09-16T02:00:00.000Z" }   // hoặc null để bỏ hạn
```

→ **200**, trả `CardSummary`. Backend ghi `deadline`, tính lại
`deadlineStatus`, xoá cờ đã-nhắc (để cron Zalo nhắc lại theo hạn mới), và ghi một
dòng nhật ký `SNOOZED`.

### 4.5 `PATCH /tasks/:id/complete` — 🔴 **ĐỔI HÌNH DẠNG, FE PHẢI SỬA**

```jsonc
// Trước (đang chạy)
{ "id": "...", "title": "...", "status": "DONE", "...": "..." }

// Sau
{
  "completed": { /* CardSummary của thẻ vừa xong */ },
  "next":      { /* CardSummary của thẻ lặp mới */ } // null nếu thẻ không lặp
}
```

Đây là **chỗ duy nhất phá vỡ tương thích** trong toàn bộ đợt này. Mọi nơi đang
gọi endpoint này (`/kanban`, `/tasks`, `/dashboard`) cần đọc `res.completed` thay
vì `res`.

Không thể vừa giữ hình dạng cũ vừa trả `next` như ô nghiệm thu mục 8 yêu cầu —
nếu FE muốn giữ hình dạng cũ thì báo lại, sẽ tách `next` sang endpoint khác.

Việc lặp làm theo **cách 1** của mục 6: sinh ngay khi hoàn thành, cùng cột, cùng
nhãn, `position` ở cuối, `deadline` = hạn cũ + chu kỳ (không có hạn cũ thì tính
từ lúc hoàn thành). Không có job nền.

Hoàn thành cũng tự chuyển thẻ sang cột có `mapsToStatus = DONE` nếu bảng có cột
đó và chưa được lưu trữ.

### 4.6 `PATCH /tasks/:id/reopen`

Không body. Đặt `status = TODO`, xoá `completedAt`, ghi nhật ký `CARD_REOPENED`.
→ trả `CardSummary`.

### 4.7 `DELETE /tasks/:id` · `POST /tasks/:id/restore`

`DELETE` giờ là **xoá mềm** (`deletedAt`) → **204**, không body. Thẻ biến mất
khỏi mọi endpoint đọc nhưng checklist/ghi chú/đính kèm **không bị xoá**.

`POST /tasks/:id/restore` → **200**, trả `CardSummary`, khôi phục đầy đủ.

### 4.8 `PATCH /tasks/:id` (endpoint cũ, mở rộng)

Giữ nguyên toàn bộ field cũ, **nhận thêm**: `cover`, `estimateMinutes`,
`repeat` (`{unit, interval}` hoặc `null`), `labelIds` (thay thế toàn bộ nhãn).
`description` được làm sạch HTML khi ghi. Response vẫn là `TaskResponseDto` cũ.

### 4.9 Nhãn của thẻ

| Method | Path | Body | Trả về |
|---|---|---|---|
| PUT | `/tasks/:id/labels` | `{ "labelIds": [...] }` | `CardSummary` |
| POST | `/tasks/:id/labels/:labelId` | — | `CardSummary` |
| DELETE | `/tasks/:id/labels/:labelId` | — | `CardSummary` |

`PUT` thay thế toàn bộ. `POST` gắn thêm, gọi hai lần không lỗi.

---

## 5. Danh sách (cột)

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/boards/:id/lists` | `{ title, position?, mapsToStatus?, wipLimit? }` | `TaskList` (201) |
| PATCH | `/lists/:id` | `{ title?, wipLimit?, archived?, mapsToStatus? }` | `TaskList` |
| PATCH | `/lists/:id/move` | `{ position }` | `TaskList` |
| POST | `/lists/:id/rebalance` | — | `[{ id, position }]` (200) |
| GET | `/lists/:id/cards` | query `cursor`, `limit` | `CardPage` |

- `position` bỏ trống khi tạo = thêm vào cuối bảng.
- `wipLimit: null` và `mapsToStatus: null` đều hợp lệ để **bỏ** giá trị.
- **`archived: true`** → mọi thẻ trong cột chuyển `listId = null` (quay về Hộp
  thư đến), **không thẻ nào bị xoá**. Cột vẫn còn trong `lists` của `/full`.
- `rebalance` đánh số lại cả cột theo bội số 1024, **thứ tự không đổi**. FE gọi
  khi phát hiện khoảng cách hai `position` xuống dưới `0.001`. Backend cũng tự
  rebalance khi khe sập trong lúc `move`, nên đây là lớp phòng bị thứ hai.

**`CardPage`** (phân trang theo từng cột):

```jsonc
{
  "items": [ /* CardSummary */ ],
  "nextCursor": 5120,   // position thẻ cuối; null = đã hết
  "total": 42           // tổng thật của cột
}
```

Cursor là **`position`**, không phải số trang — thứ tự đổi liên tục nên offset sẽ
lặp hoặc bỏ sót thẻ. Lần gọi tiếp theo: `?cursor=5120`.

### Hộp thư đến

Hộp thư đến **không có bản ghi `TaskList`** nên không dùng được `/lists/:id/...`.
Ba endpoint riêng (không có trong đặc tả, thêm để đủ dùng):

| Method | Path | Tương đương |
|---|---|---|
| GET | `/boards/me/inbox/cards` | `GET /lists/:id/cards` |
| POST | `/boards/me/inbox/rebalance` | `POST /lists/:id/rebalance` |
| POST | `/tasks/inbox/cards` | `POST /lists/:id/cards` |

---

## 6. `GET /boards/me/agenda`

**Query:** `date=2026-09-15` (bỏ trống = hôm nay) · `tz=Asia/Ho_Chi_Minh`

```jsonc
{
  "date": "2026-09-15",
  "overdue":  [ /* CardSummary, sắp theo deadline tăng dần, KHÔNG phân trang */ ],
  "dueToday": [ /* CardSummary, sắp theo deadline tăng dần */ ],
  "plannedMinutes": 180,
  "doneToday": 2
}
```

- Việc **đã hoàn thành không xuất hiện** trong `overdue` / `dueToday`.
- `dueToday` **không gồm** việc quá hạn — việc đến hạn 06:00 hôm nay, lúc 10:00
  sáng, nằm ở `overdue`.
- ⚠️ **`plannedMinutes` và `doneToday` ở đây bằng đúng số của
  `/boards/me/today`**, tức tính trên *toàn bộ* việc đến hạn hôm nay kể cả việc
  đã quá hạn trong ngày — **không** phải tổng `estimateMinutes` của mảng
  `dueToday` ngay bên trên. Cố ý làm vậy để con số trên thanh công cụ và con số
  ở cột Lịch hôm nay không bao giờ lệch nhau. **FE đừng tự cộng lại từ mảng.**
- `date` trong response là ngày **theo múi giờ người dùng**, không phải UTC.

---

## 7. `GET /boards/me/search`

**Query:** `q` (bắt buộc) · `limit` (mặc định 8, tối đa 50)

```jsonc
{ "items": [ /* CardSummary */ ], "total": 23 }
```

- **Không phân biệt dấu** hai chiều: `bao gia` ra `Báo giá`, `Báo giá` ra
  `bao gia`. Dùng `unaccent` của Postgres.
- Tìm trên `code` (`TSK-000210`), `title`, và **mô tả đã bóc thẻ HTML** — gõ
  `strong` không ra mọi việc có chữ in đậm.
- **Xếp hạng:** khớp `code` → khớp `title` → khớp mô tả. Trong cùng nhóm, việc
  chưa hoàn thành lên trước, rồi tới deadline gần nhất.
- `total` là tổng số khớp thật, `items` chỉ có `limit` phần tử đầu.
- Chỉ tìm trong bảng của chính người gọi.

---

## 8. Checklist · ghi chú · đính kèm

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/tasks/:id/checklists` | `{ title }` | `Checklist` (201, `items: []`) |
| DELETE | `/checklists/:id` | — | 204 |
| POST | `/checklists/:id/items` | `{ content, position? }` | `ChecklistItem` (201) |
| PATCH | `/checklist-items/:id` | `{ checked?, content?, position? }` | `ChecklistItem` |
| DELETE | `/checklist-items/:id` | — | 204 |
| POST | `/tasks/:id/notes` | `{ content }` | `TaskNote` (201) |
| PATCH | `/notes/:id` | `{ content }` | `TaskNote` (đặt `editedAt`) |
| DELETE | `/notes/:id` | — | 204 |
| POST | `/tasks/:id/attachments` | xem dưới | `TaskAttachment` (201) |
| PATCH | `/attachments/:id` | `{ isCover }` | `TaskAttachment` |
| DELETE | `/attachments/:id` | — | 204 |

`PATCH /checklist-items/:id` với `checked: true` đồng thời ghi `checkedAt` và
tạo một dòng nhật ký `CHECKLIST_ITEM_CHECKED`. `checked: false` xoá `checkedAt`.

`PATCH /attachments/:id` với `isCover: true` tự bỏ cờ của mọi đính kèm khác trên
cùng thẻ — mỗi thẻ đúng một ảnh bìa.

> ⚠️ **Đính kèm chưa có upload.** `POST /tasks/:id/attachments` hiện nhận **JSON**,
> không phải multipart:
> ```jsonc
> { "name": "baogia.pdf", "kind": "FILE", "url": "https://...", "sizeBytes": 128394 }
> ```
> `kind` ∈ `IMAGE` | `FILE` | `LINK`. Nghĩa là FE phải tự có URL sẵn. Chỗ lưu
> file (S3 / đĩa / dịch vụ sẵn có) **chưa chốt** — đây là câu hỏi 9.3 của đặc tả,
> cần anh/chị quyết. Khi chốt xong sẽ thêm endpoint xin URL upload, hợp đồng trên
> **không đổi**.

---

## 9. Hoàn tác (Ctrl+Z)

Ba ràng buộc mục 5.7 đều đã thoả:

1. **Xoá mềm** — `DELETE /tasks/:id` + `POST /tasks/:id/restore`, khôi phục cả
   checklist lẫn ghi chú.
2. **Lặp lại được** — gọi `move` hai lần với cùng `listId` + `position` đều thành
   công, cho cùng kết quả. Có unit test.
3. **`?undo=true`** để bỏ ghi nhật ký, hỗ trợ trên:
   - `PATCH /tasks/:id/move?undo=true`
   - `PATCH /tasks/:id/snooze?undo=true`
   - `PATCH /checklist-items/:id?undo=true`

---

## 10. Mô tả HTML (Quill)

- Cột `description` đã đổi sang `TEXT`.
- **Làm sạch khi ghi** ở mọi đường: `POST /tasks`, `PATCH /tasks/:id`,
  `POST /lists/:id/cards`, và cả luồng tạo task tự động từ email.
- Thẻ giữ lại: `h1..h6 p br strong em u s sub sup ul ol li blockquote pre code
  a img iframe span div`, thuộc tính `class` (chỉ `ql-*`) và `style`,
  `data-checked` trên `li`.
- Chặn: `script`, `on*`, `javascript:`. `iframe` chỉ cho YouTube / Vimeo.
  `data:` URI chỉ cho `<img>` (ảnh dán).
- `hasDescription` bỏ qua HTML rỗng — xem [2.1](#21-thẻ-rút-gọn-cardsummary).

> ⚠️ Backend lọc lại **bất kể FE đã lọc hay chưa**, nên HTML FE gửi lên có thể
> quay về khác đi một chút (ví dụ `<a>` được thêm `rel="noopener noreferrer"`,
> class ngoài `ql-*` bị bỏ). Nếu FE đang so sánh chuỗi HTML để biết "đã sửa hay
> chưa" thì cần so sau khi lưu, không so trước.

---

## 11. Bảng đối chiếu với `board-spec.md`

| Mục | Đặc tả | Backend đã làm |
|---|---|---|
| 2.1 | Position Float + rebalance | ✅ + tự rebalance khi khe sập |
| 2.2 | Giữ `status`, ánh xạ từ `mapsToStatus` | ✅ |
| 2.3 | Hộp thư đến = `listId = null` | ✅ + 3 endpoint riêng cho Hộp thư đến |
| 3.1 | 9 bảng mới | ✅ |
| 3.2 | Sửa bảng `Task` | ✅ + `deletedAt` |
| 3.3 | 5 danh sách khởi tạo | ✅ tự chạy ở lần gọi API đầu tiên |
| 4.2 | `/boards/me/full` | ✅ |
| 4.3 | Thẻ rút gọn | ✅ thêm `status` |
| 4.4 | Danh sách | ✅ |
| 4.5 | `/boards/me/today` | ✅ `?tz=` + cột `User.timezone` |
| 4.6–4.9 | Thẻ | ✅ `/complete` đổi hình dạng |
| 4.10 | Checklist / ghi chú / đính kèm | ⚠️ đính kèm JSON, chưa multipart |
| 4.11 | `/boards/me/agenda` | ✅ đọc kỹ ghi chú `plannedMinutes` ở §6 |
| 4.12 | `/boards/me/search` | ✅ |
| 5.1 | Nới giới hạn tần suất | ✅ 120/60s, không cần batch |
| 5.2 | Phân trang theo cột | ✅ cursor = `position` |
| 5.3 | Nhật ký ngôi thứ nhất | ✅ |
| 5.4 | Phân quyền → 404 | ✅ ADMIN cũng không xem được |
| 5.5 | Mã lỗi | ✅ |
| 5.6 | Mô tả HTML | ✅ |
| 5.7 | Hoàn tác | ✅ |
| 6 | Việc lặp | ✅ cách 1 |

---

## 12. Danh sách FE tick

Đọc xong thì tick từng dòng, dòng nào sai thì ghi chú lại:

- [ ] Response **không** có lớp bọc `{ success, data }` — FE đọc thẳng
- [ ] Không có prefix `/api` hay version trong đường dẫn
- [ ] Body gửi thừa field sẽ bị 400 — FE không gửi field lạ
- [ ] `cardCounts` dùng khoá `"inbox"` cho Hộp thư đến, cột rỗng không có khoá
- [ ] `cards` của `/full` là **mảng phẳng**, FE tự nhóm theo `listId`
- [ ] `lists` gồm cả cột `archived: true` — FE tự lọc
- [ ] FE lấy `position` trong **response** của `move` làm chuẩn, không giữ giá trị đã gửi
- [ ] FE hiểu `warning: "LIST_WIP_EXCEEDED"` là cảnh báo, thao tác vẫn thành công
- [ ] FE **không cộng** `overdue + dueToday` (hai số chồng nhau)
- [ ] FE dùng `plannedMinutes` / `doneToday` của `/agenda` thay vì tự cộng từ mảng
- [ ] FE không lẫn `attachments` (bảng mới) với `attachmentLinks` (mảng cũ)
- [ ] FE hiển thị nguyên `activity.message`, không tự ghép câu
- [ ] FE gửi `?tz=` ở `/full`, `/today`, `/agenda`, `/snooze`
- [ ] FE gửi `?undo=true` khi replay thao tác Ctrl+Z
- [ ] FE dùng `cursor` = `position` thẻ cuối, không dùng số trang
- [ ] **FE sửa nơi gọi `/tasks/:id/complete` để đọc `res.completed`**
- [ ] FE chấp nhận đính kèm chỉ nhận URL (chưa upload) — hoặc báo lại để chốt chỗ lưu file
- [ ] `status` thêm vào thẻ rút gọn có hữu ích không, hay bỏ đi?

---

## 13. Đã kiểm tới đâu

Migration đã chạy trên DB Supabase dev, sau đó boot app thật và gọi từng service.
**Đã chứng minh chạy được:**

| Ô nghiệm thu (mục 8 của đặc tả) | Kết quả |
|---|---|
| `/search?q=bao gia` ra việc tên "Báo giá…" | ✅ cả `bao gia`, `BAO GIA`, `Báo giá` |
| Tìm theo `code`, tìm trong mô tả đã bóc thẻ HTML | ✅ gõ `strong` không ra việc in đậm |
| Mô tả `<p><br></p>` cho `hasDescription = false` | ✅ kể cả `<p>&nbsp;</p>` |
| `<script>alert(1)</script>` bị lọc sạch khi lưu | ✅ cả `onerror` |
| Chèn 60 lần cùng một khe rồi rebalance — thứ tự không đổi | ✅ |
| `cardCounts` khớp số thẻ thật, không phải số đã trả | ✅ |
| Gọi `move` hai lần cùng `listId` + `position` | ✅ cùng kết quả, không lỗi |
| Người dùng A gọi API trên thẻ của B → 404 | ✅ `CARD_NOT_FOUND` |
| Kéo sang cột có `mapsToStatus` thì `status` đổi theo | ✅ |
| Vượt WIP trả 200 kèm `warning`, không chặn | ✅ |
| Xoá mềm rồi `restore` | ✅ |
| Nhật ký ghi đúng câu tiếng Việt | ✅ `"Chuyển từ Hôm nay sang Đang làm"` |

> **Một lỗi đã tìm ra nhờ chạy thật:** `hasDescription` từng trả `true` cho
> `<p>&nbsp;</p>` (Postgres `btrim` không cắt ký tự U+00A0 mà `sanitize-html`
> sinh ra). Đã sửa. Unit test và typecheck **không** bắt được lỗi này.

**Chưa kiểm được:**

| Việc | Vì sao |
|---|---|
| Mốc 400 ms với bảng 200 thẻ | DB dev mới có 23 task |
| `/agenda` với thẻ thứ 25 của một cột | Chưa có cột nào đủ dài |
| Lưu trữ danh sách (thẻ quay về Hộp thư đến) | Chưa test, code đã có |
| Upload đính kèm | Chờ chốt chỗ lưu file (câu hỏi 9.3) |
