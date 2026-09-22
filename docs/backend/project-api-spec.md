# Dự án (Project) — hợp đồng API đã chạy

**Trạng thái:** backend **đã code xong cả ba đợt, migration đã chạy trên DB dev,
đã gọi thật bằng token thật**. File này mô tả thứ đang chạy, không còn là đề xuất.

FE bỏ mock được ngay: `apis/project.api.ts` gặp 200 ở `GET /projects` là mock tự
ngừng, không phải sửa code cũng không phải đổi biến môi trường.

**Đọc trước khi tick:** [§1 Bốn chỗ lệch](#1-bốn-chỗ-lệch-so-với-đề-xuất) và
[§8 Trả lời §12](#8-trả-lời-bốn-câu-hỏi-ở-12-của-đề-xuất). Một trong bốn chỗ lệch
là **sửa lỗi trong đề xuất**, không phải lựa chọn triển khai.

---

## 1. Bốn chỗ lệch so với đề xuất

### 1.1 ⚠️ §5.4 sai chủ thể — task từ mail theo **người được giao**, không phải chủ hộp thư

Đây là chỗ quan trọng nhất trong cả tài liệu.

Đề xuất viết: task từ mail "rơi vào dự án mặc định của **chủ hộp thư**". Nhưng
backend có sẵn `MailIngestionService.resolveAssigneeId()`: một mail chứa dòng

```
Giao cho: nguoikhac@cty.com
```

tạo ra task gán cho **người khác**, không phải chủ hộp thư đã nhận mail.

Làm đúng chữ trong đề xuất sẽ tạo ra hàng dữ liệu tự mâu thuẫn: task của người B
nằm trong dự án của người A. Nó vi phạm chính §8 của đề xuất ("`projectId` luôn
phải thuộc người gọi"), và hậu quả thực tế là **người B mở dự án của mình sẽ
không thấy việc của mình ở đâu cả** — không lỗi, không thông báo, việc chỉ đơn
giản là không xuất hiện.

Backend chốt theo `assigneeId`. Đây cũng là trục mà bảng đã dùng từ trước
(`ensureBoard(assigneeId)`), nên ba thứ — việc, bảng, dự án — giờ cùng thuộc một
người.

Chuỗi dự phòng, **không nhánh nào bỏ qua email**:

1. dự án mặc định của người được giao, nếu nó chưa lưu trữ;
2. không được thì dự án **hoạt động cũ nhất** của người đó (ghi log cảnh báo);
3. không còn dự án hoạt động nào thì dựng lại "Công việc chung" đã lưu trữ;
4. chưa từng có dự án nào thì tạo mới "Công việc chung".

**Việc của FE:** không có. Nhưng nếu về sau dựng màn hình "vì sao việc này nằm ở
đây", nhánh 2 có log `[Projects] Dự án mặc định của user … không dùng được`.

### 1.2 Zalo không tạo task — bớt được một nhánh

§5.4 viết "task tạo từ mail `[TASK]` **hoặc từ Zalo Bot**". Trong code, Zalo chỉ
đọc và gửi thông báo (`findApproachingDeadline`, `markDeadlineNotified`); không
có đường nào tạo task. Chỉ có **đúng một** nguồn tự động là Gmail ingestion.

### 1.3 §6.1 kéo theo một sửa đổi mà đề xuất không lường: `requireCard`

Đổi `Board.ownerId @unique` thành `@@unique([ownerId, projectId])` không chỉ là
một dòng schema. `BoardAccessService.requireCard` — hàm gác cho `move`,
`snooze`, `complete`, `reopen`, `restore`, checklist, ghi chú, đính kèm — đang
làm thế này:

```ts
const board = await this.ensureBoard(userId);   // "bảng của user X"
if (card.boardId !== board.id) throw NotFound;  // → 404
```

Với nhiều bảng mỗi người, "bảng của user X" không còn là câu hỏi có một đáp án.
Phép so sánh đó sẽ **404 mọi thẻ nằm ngoài dự án tình cờ được chọn**.

Backend đảo chiều: bảng được suy **từ chính thẻ đó** (`card.projectId` →
`card.boardId`), rồi mới kiểm bảng ấy có phải của người gọi không. Đã kiểm thật:
thẻ ở hai dự án khác nhau đều `complete` được trong cùng một phiên.

**Việc của FE:** không có. Các endpoint thao tác theo id vẫn **không cần**
`projectId`, đúng như §6.2 của đề xuất.

### 1.4 Sắp xếp tiếng Việt làm ở tầng ứng dụng, không phải SQL

§4.1 yêu cầu "theo `name` tăng dần (collation tiếng Việt)". Postgres của Supabase
chạy collation `en_US.utf8`: `ORDER BY name` sẽ xếp `Đào tạo nội bộ` **sau**
`Zulu`. Backend sắp bằng `Intl.Collator('vi')` ở tầng ứng dụng (mỗi người tối đa
30 dự án nên chi phí bằng không).

Đã kiểm: `Công việc chung` (mặc định) → `Đào tạo nội bộ` → `Khách hàng A`.

---

## 2. Quy ước chung

Giống mọi API hiện có:

- **Không prefix, không version**: `GET /projects`.
- **Không bọc response**: trả thẳng object.
- **Xác thực**: `Authorization: Bearer <access token>`, mọi endpoint.
- **Hình dạng lỗi**: `{ statusCode, errorCode, message, path, timestamp }`.
- **`forbidNonWhitelisted` đang bật**: body thừa field → **400** (`message` là
  mảng chuỗi).
- **Rate limit 20 req/60s** vẫn áp dụng cho `/projects`.

---

## 3. Endpoint của dự án

### 3.1 `GET /projects`

| Query | Kiểu | Mặc định |
|---|---|---|
| `includeArchived` | `boolean` | `false` |

```json
{
  "items": [
    {
      "id": "d325577a-3434-4ec0-90b7-cbe6208195ea",
      "code": "CHUNG",
      "name": "Công việc chung",
      "description": null,
      "color": "#0a436d",
      "icon": "folder",
      "isDefault": true,
      "archived": false,
      "stats": {
        "totalTasks": 2,
        "openTasks": 1,
        "overdueTasks": 0,
        "lastActivityAt": "2026-09-19T04:10:47.231Z"
      },
      "createdAt": "2026-09-19T04:10:09.476Z",
      "updatedAt": "2026-09-19T04:10:09.476Z"
    }
  ],
  "total": 1
}
```

**`stats` có sẵn ngay từ đợt 1** — trả lời [§12 câu 4](#8-trả-lời-bốn-câu-hỏi-ở-12-của-đề-xuất).
Không cache: ba con số lấy bằng ba truy vấn `groupBy` gộp cho **tất cả** dự án
cùng lúc (không phải ba truy vấn mỗi dự án), có index `[project_id, status]`.

Định nghĩa đúng như đề xuất: `totalTasks` = việc chưa xoá mềm; `openTasks` =
`status NOT IN (DONE, CANCELLED)`; `overdueTasks` = `openTasks` và `deadline <
now()`; `lastActivityAt` = `max(updatedAt)`, `null` khi chưa có việc.

`POST /projects` trả về `stats` toàn số 0 — dự án vừa tạo thì chưa có việc nào.

### 3.2 `GET /projects/:id`

Một object `Project`. Không phải của người gọi → **404 `PROJECT_NOT_FOUND`**.

### 3.3 `POST /projects`

```jsonc
{
  "name": "Khách hàng A website",   // bắt buộc
  "code": "KHA",                     // tuỳ chọn
  "description": "Deadline cuối quý",
  "color": "#0ea5e9",
  "icon": "rocket",
  "isDefault": false
}
// 201 -> object Project
```

- **`code` bỏ trống thì backend sinh**: bỏ dấu, chữ cái đầu mỗi từ, HOA, ≤4 ký
  tự; trùng thì thêm số (`KHA` → `KHA2` → `KHA3`). Đã kiểm:
  `"Khách hàng A website"` → `KHAW`, `"Đào tạo nội bộ"` → `DTNB` (chữ Đ ra D).
  Tên chỉ có một từ thì lấy đầu từ đó: `"Website"` → `WEBS`.
- **`code` gửi chữ thường vẫn nhận** — backend tự hoa (`"vn"` → `"VN"`).
- **Dự án đầu tiên của một người luôn là mặc định**, kể cả khi gửi
  `isDefault: false` hoặc không gửi.
- `isDefault: true` → gỡ cờ ở dự án khác trong cùng transaction.

### 3.4 `PATCH /projects/:id`

Tập con của `POST` cộng `archived`. Field không gửi thì giữ nguyên.
`description: ""` = xoá mô tả (lưu `null`).

**`PATCH` cố tình không nhận `isDefault`** — đặt mặc định chạm vào bản ghi khác
nên nó có endpoint riêng. Gửi `isDefault` vào `PATCH` sẽ bị
`forbidNonWhitelisted` trả 400.

### 3.5 `PUT /projects/:id/default`

Body rỗng. Dự án đang lưu trữ → **409 `PROJECT_ARCHIVED`**.

### 3.6 `PUT /projects/:id/archive`

Body `{ "archived": true }` (`false` = mở lại). Lưu trữ **không đụng vào task**.

Dự án bị lưu trữ đang là mặc định → cờ **tự chuyển** sang dự án hoạt động cũ
nhất. Đã kiểm. Không còn dự án hoạt động nào khác → **409 `PROJECT_LAST_ONE`**.

Mở lại một dự án lúc người dùng không còn dự án mặc định nào thì nó nhận luôn cờ
mặc định — FE không bao giờ rơi vào trạng thái "không có dự án nào để mở".

### 3.7 `DELETE /projects/:id`

**204.** Chỉ cho phép khi dự án không còn task nào **kể cả đã xoá mềm**
(→ `409 PROJECT_NOT_EMPTY`) và không phải dự án hoạt động cuối cùng
(→ `409 PROJECT_LAST_ONE`). Bảng/cột/nhãn đi theo bằng cascade.

> Thẻ trong thùng rác vẫn khôi phục được bằng Ctrl+Z nên nó vẫn tính là "dự án
> còn việc". Muốn dọn thì **lưu trữ**.

---

## 4. Thay đổi ở `/tasks`

| Endpoint | Thay đổi |
|---|---|
| `GET /tasks` | thêm query `projectId` |
| `GET /tasks/stats` | thêm query `projectId` |
| `POST /tasks` | thêm field `projectId` |
| `PATCH /tasks/:id` | `projectId` = **chuyển việc sang dự án khác** |

### 4.1 Thiếu `projectId` ở `GET /tasks`

Trả việc của **mọi** dự án, kèm một dòng log cảnh báo phía backend — đúng đề
xuất của FE ([§12 câu 2](#8-trả-lời-bốn-câu-hỏi-ở-12-của-đề-xuất)). Xuất CSV và
script cũ không phải sửa.

`projectId` trỏ tới dự án của người khác → **404 `PROJECT_NOT_FOUND`**, không
phải mảng rỗng. Đã kiểm.

`GET /tasks/stats` thiếu `projectId` = thống kê cả tài khoản, **không** cảnh báo
(trang tổng quan muốn con số gộp).

### 4.2 `POST /tasks` — dự án là của người được giao

1. body có `projectId` hợp lệ → dùng nó;
2. không có → dự án mặc định **của `assigneeId`**, không phải của người gọi;
3. chưa có dự án nào → tự tạo "Công việc chung".

**Nhánh 3 khác đề xuất:** §5.3 đề nghị trả `400 PROJECT_NOT_FOUND` kèm "Hãy tạo
dự án trước". Backend tạo luôn thay vì chặn — tài khoản mới đã có sẵn dự án
(§8 câu 1), nên nhánh này chỉ xảy ra với dữ liệu bất thường, và lúc đó tạo giúp
vẫn đúng ý người dùng hơn là dựng một lỗi trước mặt họ.

Nghĩa là: **`POST /tasks` không bao giờ trả `PROJECT_NOT_FOUND` vì thiếu dự án
mặc định.** FE không cần nhánh xử lý đó.

Dự án đã lưu trữ → **409 `PROJECT_ARCHIVED`**. Đã kiểm.

Điểm 2 đáng chú ý cho màn hình admin: admin gán việc cho nhân viên thì việc rơi
vào dự án của **nhân viên**, không phải dự án admin đang mở.

### 4.3 Chuyển việc giữa hai dự án

`PATCH /tasks/:id` với `projectId` mới. Backend tự dọn:

- `boardId` → bảng của dự án mới;
- `listId` → `null` (về Hộp thư đến của dự án mới);
- **gỡ toàn bộ nhãn** — nhãn thuộc bảng, bảng thuộc dự án, nhãn không đi theo
  việc sang dự án khác.

⚠️ **Gửi `labelIds` kèm trong cùng request chuyển dự án sẽ bị bỏ qua**, không
phải 404. Lý do: `labelIds` mà FE gửi là nhãn của bảng **cũ**, nên kiểm chúng
trên bảng mới chắc chắn hỏng. FE muốn gắn nhãn ở dự án mới thì gọi
`PUT /tasks/:id/labels` sau, với id nhãn của bảng mới.

---

## 5. Thay đổi ở `/boards`

`@@unique([ownerId, projectId])` — mỗi người một bảng cho mỗi dự án.

| Endpoint | `projectId` |
|---|---|
| `GET /boards/me/full` | query. Chưa có bảng cho dự án đó thì **tự tạo**, kèm **đúng một** cột mẫu "Hôm nay" (trước 22/09/2026 là năm cột — xem `DEFAULT_LISTS` của backend) |
| `GET /boards/me/agenda` | query |
| `GET /boards/me/search` | query |
| `GET /boards/me/today` | query |
| `GET /boards/me/labels` | query |
| `GET /boards/me/inbox/cards` | query |
| `POST /boards/me/inbox/rebalance` | query |
| `POST /tasks/inbox/cards` | **body** |
| `POST /lists/:id/cards` | **không đổi** — dự án suy từ bảng chứa cột |
| `/tasks/:id/move`, `/snooze`, `/complete`, `/reopen`, `/restore`, checklist, ghi chú, đính kèm | **không cần** |

**Bỏ trống `projectId` = dự án mặc định**, không phải "gộp mọi dự án". Đây là chỗ
lệch nhỏ với §6.2 (đề xuất viết agenda thiếu `projectId` thì gộp): bảng thuộc dự
án, nên một agenda gộp nhiều bảng sẽ phải gộp nhiều bộ cột và nhãn khác nhau —
không có cách hiển thị nào đúng. FE luôn gửi nên không ảnh hưởng.

Nhãn tự phân vùng theo dự án vì nhãn thuộc bảng. Tìm kiếm Ctrl+K không trả việc
của dự án khác — đã kiểm.

---

## 6. Mã lỗi

Đủ bảy mã, đúng tên và đúng HTTP status như §7 của đề xuất, nên
`PROJECT_ERROR_MESSAGES` trong `models/project.ts` dùng được nguyên.

| `errorCode` | HTTP | Đã kiểm thật |
|---|---|---|
| `PROJECT_NOT_FOUND` | 404 | ✅ GET / PATCH / POST /tasks của người khác |
| `PROJECT_CODE_TAKEN` | 409 | ✅ |
| `PROJECT_NAME_TAKEN` | 409 | ✅ |
| `PROJECT_LIMIT_REACHED` | 409 | trần **30** dự án hoạt động |
| `PROJECT_LAST_ONE` | 409 | ✅ lưu trữ dự án hoạt động cuối cùng |
| `PROJECT_NOT_EMPTY` | 409 | ✅ xoá dự án còn việc |
| `PROJECT_ARCHIVED` | 409 | ✅ đặt mặc định + thêm việc |

Lỗi **validate** (icon lạ, color sai, field thừa) vẫn là **400 `errorCode:
"ERROR"`** với `message` là mảng chuỗi — giống phần còn lại của API, không nằm
trong bảy mã trên.

---

## 7. Kết quả smoke test

Chạy thật trên DB dev bằng token thật.

**Migration** — hai file tách đúng §3.3 (tạo bảng + cột nullable / backfill +
siết NOT NULL). Bước kiểm `projectId IS NULL = 0` được viết thành khối `DO`
trong SQL, migration sẽ **dừng** nếu còn hàng thiếu. Cả hai chạy qua, nghĩa là
kiểm đã pass.

Kiểm bất biến trên dữ liệu thật sau migration (29 task, 11 dự án, 7 bảng):

| Bất biến | Kết quả |
|---|---|
| task thiếu `project_id` | 0 ✅ |
| board thiếu `project_id` | 0 ✅ |
| **task có dự án thuộc người khác `assignee`** | 0 ✅ |
| board có dự án thuộc người khác `owner` | 0 ✅ |
| người có >1 dự án mặc định | 0 ✅ |

**API**

| Tình huống | Kết quả |
|---|---|
| Đăng ký → `GET /projects` có sẵn "Công việc chung", `isDefault: true` | ✅ |
| Sinh mã từ tên tiếng Việt có dấu | ✅ `KHAW`, `DTNB` |
| `code` chữ thường tự hoa | ✅ `vn` → `VN` |
| Sắp xếp tiếng Việt | ✅ Công việc chung → Đào tạo → Khách hàng |
| `/tasks?projectId=` tách đúng từng dự án | ✅ |
| `/tasks` không `projectId` trả mọi dự án | ✅ |
| `/boards/me/full` hai dự án ra **hai bảng khác nhau** | ✅ |
| **Thẻ ở hai dự án khác nhau đều `complete` được** | ✅ (phép thử cho §1.3) |
| `PATCH /tasks/:id` đổi dự án → sang bảng mới, `listId: null` | ✅ |
| Tìm kiếm phân vùng theo dự án | ✅ |
| `PUT /:id/default` gỡ cờ ở dự án cũ | ✅ |
| Lưu trữ dự án mặc định → cờ tự chuyển | ✅ |
| Người khác GET/PATCH/POST vào dự án này → 404 | ✅ |

Unit test: 87/87 xanh, trong đó có hai test khoá riêng bất biến §1.1 (dự án lấy
theo `assigneeId` ở cả nhánh mail lẫn nhánh HTTP).

---

## 8. Trả lời bốn câu hỏi ở §12 của đề xuất

1. **Đăng ký có tự tạo dự án không?** → **Có.** `RegisterHandler` tạo
   "Công việc chung" (`CHUNG`, `#0a436d`, `folder`, `isDefault: true`). FE vào
   thẳng, **không cần** màn hình "tạo dự án đầu tiên".
   Đăng nhập bằng Google đi đường khác nên `GET /projects` cũng tự tạo nếu
   thiếu — cả hai nhánh đều đảm bảo danh sách không rỗng.
2. **`GET /tasks` thiếu `projectId`?** → **Trả mọi dự án** + log cảnh báo. FE
   không phải rà lại chỗ gọi `taskApi` trực tiếp.
3. **Trần số dự án?** → **30 dự án hoạt động** mỗi người; dự án đã lưu trữ
   không tính. Vượt → `409 PROJECT_LIMIT_REACHED`. FE hiện cảnh báo lúc gần
   chạm là hợp lý.
4. **`stats` có kịp đợt 1 không?** → **Có**, đã có sẵn. Không cần hiện `—`.

---

## 9. Danh sách FE check

**Dự án**

- [ ] Bỏ mock: `GET /projects` trả 200, `apis/mock/project.mock.ts` ngừng dùng
- [ ] Tài khoản mới vào thẳng, không hiện màn hình "tạo dự án đầu tiên"
- [ ] Tạo dự án bỏ trống `code` → mã backend sinh hiện đúng trên thẻ
- [ ] Bảy `errorCode` hiện đúng thông điệp `PROJECT_ERROR_MESSAGES`
- [ ] Lỗi validate (icon/color) là **400 `errorCode: "ERROR"`**, không nằm trong
      bảy mã — kiểm nhánh xử lý lỗi không rơi vào "Có lỗi xảy ra"
- [ ] `PATCH /projects/:id` **không** gửi kèm `isDefault` (sẽ 400)
- [ ] Cảnh báo khi gần chạm trần 30 dự án hoạt động

**Công việc**

- [ ] `useTasks` gửi `projectId` ở mọi trang; đổi dự án thì danh sách đổi theo
- [ ] Gỡ nhãn vàng "mọi dự án hiện cùng một tập công việc" ở trang quản lý dự án
- [ ] Chuyển việc sang dự án khác: việc về Hộp thư đến dự án mới và **mất nhãn** —
      xác nhận đây là hành vi mong muốn trên giao diện
- [ ] Không gửi `labelIds` chung request với `projectId` (sẽ bị bỏ qua)

**Bảng**

- [ ] `/boards/me/full?projectId=` — mỗi dự án một bảng riêng, cột mặc định tự tạo
- [ ] Ctrl+K không trả việc của dự án khác
- [ ] Nhãn ở dự án A không hiện ở dự án B
- [ ] Kéo thả / hoàn thành / hoãn thẻ vẫn chạy khi **không** gửi `projectId`

---

## 10. Ngoài phạm vi (giữ nguyên như đề xuất)

- **Làm việc nhóm trong dự án** — không có `project_member`, không có cột
  `members`/`role`. Nếu làm thì đó là một đợt riêng.
- **Gắn dự án theo hộp thư** (`MailAccount.projectId`) — chưa làm. Hiện mọi mail
  rơi vào dự án mặc định của người được giao. Nếu FE muốn ô chọn ở trang Tích
  hợp thì báo, backend thêm một cột và một nhánh, không lớn.

---

## 11. Backend đã làm gì (để tra khi cần)

| Việc | Vị trí trong repo backend |
|---|---|
| Bảng + hai migration | `prisma/migrations/20260919000000_add_projects/`, `…000001_backfill_projects/` |
| Model | `prisma/schema.prisma` → `Project`, `Task.projectId`, `Board.projectId` |
| Route | `src/modules/projects/controllers/projects.controller.ts` |
| Quyền + tra cứu dùng chung | `src/modules/projects/services/project-access.service.ts` |
| Sinh mã dự án | `src/modules/projects/project-code.util.ts` |
| Trần, icon, mặc định | `src/modules/projects/project.constants.ts` |
| **Dự án cho task từ mail** | `ProjectAccessService.resolveForAutomation` ← `TasksService.createSystemTask` |
| **`requireCard` đảo chiều** | `src/modules/board/services/board-access.service.ts` |
| Tạo dự án lúc đăng ký | `src/modules/auth/handlers/register.handler.ts` |

Swagger: tag `Projects` trên `/api-docs`.
