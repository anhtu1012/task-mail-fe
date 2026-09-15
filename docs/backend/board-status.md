# Bảng công việc — trạng thái hai bên, tính tới 16/09/2026

**Dùng để làm gì:** FE đọc rồi tick, xem còn gì chưa nối và còn gì backend chưa làm.

**Nguồn:** trả lời cho `board-next-steps.md`. Danh sách endpoint bên dưới **lấy
từ router thật của app đã build**, không phải chép tay — nếu endpoint có trong
bảng nghĩa là nó tồn tại.

---

## 1. Backend đã làm xong từ `board-next-steps.md`

| Mục | Trạng thái |
|---|---|
| **1. `?undo=true` thiếu ở 5 endpoint** | ✅ Xong — và mở rộng hơn đề nghị, xem [§2](#2-undo-đọc-kỹ-mục-này) |
| **3. Chuẩn bị chạy migration ngoài dev** | ✅ Có script kiểm tra + script backfill, xem [§5](#5-vận-hành--việc-của-backenddevops) |
| **4. Ba ô nghiệm thu chưa kiểm được** | ✅ Đã kiểm hết bằng dữ liệu seed thật, xem [§4](#4-ba-ô-nghiệm-thu-đã-kiểm-xong) |
| **2. Đính kèm / CSP** | ⏸️ **Hoãn theo quyết định** — chưa chốt chỗ lưu file. FE cứ tiếp tục ẩn nút thêm đính kèm |
| **5. Job rebalance định kỳ** | ⏸️ Chưa dựng job (đúng như FE đề nghị). Nhưng đã thêm `logger.warn` mỗi lần tự rebalance — trước đó nó chạy im lặng nên không có cách nào biết "khi nào thấy log chạy nhiều" |
| **6. WebSocket / nhiều bảng / `PATCH /notes/:id`** | ⏸️ Đúng, chưa cần |

---

## 2. Undo — đọc kỹ mục này

### Đã mở rộng rộng hơn đề nghị

FE đề nghị thêm cờ cho 5 endpoint. Backend cho **mọi endpoint ghi** nhận cờ,
kể cả những cái hiện không ghi nhật ký — vì validation bật
`forbidNonWhitelisted`, gửi cờ vào endpoint không khai báo sẽ bị **400**. Cho
nhận hết thì FE không phải nhớ chỗ nào gửi được chỗ nào không.

| Endpoint | `?undo=true` làm gì |
|---|---|
| `PATCH /tasks/:id/move` | bỏ `CARD_MOVED` |
| `PATCH /tasks/:id/snooze` | bỏ `SNOOZED` |
| `PATCH /checklist-items/:id` | bỏ `CHECKLIST_ITEM_CHECKED` |
| `PATCH /tasks/:id/complete` | bỏ `CARD_COMPLETED` **và không sinh lại thẻ lặp** |
| `PATCH /tasks/:id/reopen` | bỏ `CARD_REOPENED` |
| `PATCH /tasks/:id` | bỏ `DUE_CHANGED` |
| `PATCH /lists/:id` | no-op (endpoint này không ghi nhật ký) — vẫn nhận cờ |
| `POST /tasks/:id/restore` | no-op (khôi phục không ghi nhật ký) — vẫn nhận cờ |
| `DELETE /tasks/:id` | xoá không ghi nhật ký, không cần gửi cờ |

Giá trị hợp lệ: `?undo=true` hoặc `?undo=1`. Mọi giá trị khác, kể cả
`?undo=false`, đều hiểu là **không** undo.

### 🔴 Ba điều FE cần biết vì khác với giả định trong `board-next-steps.md`

**a. `?undo=true` ở `/snooze` trước đây không có tác dụng.** Tham số query khai
báo bằng intersection type của TypeScript nên Nest không nhận ra là DTO, `undo`
nằm lại dạng chuỗi `'true'`, phép so sánh luôn sai. Đã sửa. Nếu FE đang thấy
nhật ký có dòng "Dời hạn sang…" thừa sau khi Ctrl+Z thì đó là lý do.

**b. `PATCH /tasks/:id` trước đây KHÔNG ghi `DUE_CHANGED`.** Bảng ở mục 1 của
`board-next-steps.md` ghi là có, nhưng thực tế endpoint này không ghi nhật ký gì
cả. **Nay mới thêm:** đổi `deadline` thì ghi một dòng `DUE_CHANGED`. Đổi tiêu đề,
ưu tiên, ảnh bìa **không** ghi gì.

**c. 🔴 Undo một lần "hoàn thành" KHÔNG xoá thẻ lặp đã sinh — cần FE xử lý.**

Việc có `repeat` khi `PATCH /complete` sẽ sinh ngay thẻ kế tiếp và trả trong
`next`. Người dùng Ctrl+Z thì `reopen` chỉ mở lại thẻ gốc, **thẻ kế tiếp vẫn
nằm đó**. Backend không lần ngược được vì không lưu quan hệ cha–con giữa hai thẻ.

Cách rẻ nhất, làm ở FE:

```ts
const res = await completeCard(id)          // { completed, next }
if (res.next) undoStack.push({ ...entry, spawnedId: res.next.id })
// khi undo:
await reopenCard(id, { undo: true })
if (entry.spawnedId) await deleteTask(entry.spawnedId)
```

Nếu FE muốn backend tự lo thì cần thêm cột `repeatSourceId` vào `Task` — báo lại,
đây là một migration nhỏ.

---

## 3. Việc FE còn nợ

Lấy từ §8 của `board-next-steps.md`, cộng thêm phần phát sinh.

| Việc | Endpoint đã sẵn sàng | Ghi chú |
|---|---|---|
| Tải thêm khi cuộn trong cột | `GET /lists/:id/cards`, `GET /boards/me/inbox/cards` | Cursor là `position` thẻ cuối, không phải số trang |
| Gọi rebalance khi khe sập | `POST /lists/:id/rebalance`, `POST /boards/me/inbox/rebalance` | Backend cũng tự rebalance khi `move` gặp khe sập, nên đây là lớp phòng bị. Ưu tiên thấp |
| Giao diện chọn nhãn cho thẻ | `PUT /tasks/:id/labels`, `POST`/`DELETE /tasks/:id/labels/:labelId` | |
| Quản lý nhãn của bảng | `GET /boards/me/labels`, `POST /boards/:id/labels`, `PATCH`/`DELETE /labels/:id` | `slug` sinh tự động từ tên, FE không gửi |
| Sửa `repeat` / `estimateMinutes` từ giao diện | `PATCH /tasks/:id` | Hiện chỉ đặt được qua cú pháp nhập nhanh |
| **Xoá thẻ lặp khi undo "hoàn thành"** | `DELETE /tasks/:id` | 🔴 **Mới** — xem [§2c](#-ba-điều-fe-cần-biết-vì-khác-với-giả-định-trong-board-next-stepsmd) |
| **Gửi `?undo=true` cho 6 endpoint mới** | xem bảng ở §2 | 🔴 **Mới** — trước chỉ gửi được 3 |
| Chạy thử với tài khoản thật | — | `board-next-steps.md` ghi "chưa chạy thử với tài khoản thật". Đây là việc còn lại lớn nhất |

---

## 4. Ba ô nghiệm thu đã kiểm xong

Seed 230 thẻ trên một tài khoản dùng một lần, đo xong xoá sạch.

| Ô | Kết quả |
|---|---|
| Dưới 400 ms với bảng 200 thẻ | ✅ đo 5 lần: 195 / 213 / 219 / 253 / 255 ms — **trung vị 219 ms**, đã gồm độ trễ mạng tới Supabase Singapore |
| `/agenda` trả thẻ thứ 25 của một cột | ✅ thẻ đó **không** nằm trong 20 thẻ đầu (`/lists/:id/cards` không trả), nhưng `/agenda` vẫn trả — đúng cái bẫy FE lo |
| Lưu trữ danh sách → thẻ về Hộp thư đến | ✅ 70 thẻ về inbox, tổng thẻ không đổi (230), cột vẫn còn trong `lists` với `archived: true` |

Cơ chế undo cũng đã kiểm trên DB thật: có/không cờ, `complete?undo=true` không
nhân đôi thẻ lặp, `DUE_CHANGED` ghi đúng câu và im lặng khi có cờ.

---

## 5. Vận hành — việc của backend/devops

| Việc | Trạng thái |
|---|---|
| Migration trên Supabase dev | ✅ đã chạy |
| Backfill bảng cho toàn bộ user | ✅ **đã chạy thật** — 5/5 người dùng có bảng, 24/24 việc đã xếp cột, 0 việc còn thiếu `boardId`, 0 vị trí trùng, 0 thẻ sai cột so với `status` |
| Script kiểm tra trước khi chạy ngoài dev | ✅ `npm run check:migration` — kiểm quyền tạo `unaccent`, kiểu cột `description`, số user chưa có bảng. Thoát khác 0 khi có vấn đề chặn |
| Migration trên staging/production | ⏸️ chưa — chạy `check:migration` trước |

**Hệ quả cho FE:** không còn ai phải chờ dựng bảng ở lần mở app đầu tiên nữa.

---

## 6. Toàn bộ endpoint đang có — FE tick cột cuối

48 route, lấy trực tiếp từ router. Cột "FE dùng chưa" điền theo §7 và §8 của
`board-next-steps.md`; chỗ nào ghi **?** thì FE tự xác nhận.

### Bảng

| Method | Path | FE dùng chưa |
|---|---|---|
| GET | `/boards/me/full` | ✅ |
| GET | `/boards/me/today` | ❌ chưa — FE đọc `today` trong `/full`. Sẽ dùng khi có nút làm mới riêng cho thanh chỉ số |
| GET | `/boards/me/agenda` | ✅ |
| GET | `/boards/me/search` | ✅ |
| GET | `/boards/me/inbox/cards` | ❌ chưa |
| POST | `/boards/me/inbox/rebalance` | ❌ chưa |
| GET | `/boards/me/labels` | ❌ chưa |
| PATCH | `/boards/:id` | ✅ gắn sao. Đổi tên bảng chưa có giao diện |
| POST | `/boards/:id/lists` | ✅ |
| POST | `/boards/:id/labels` | ❌ chưa |

### Danh sách (cột)

| Method | Path | FE dùng chưa |
|---|---|---|
| PATCH | `/lists/:id` | ✅ (đổi tên, lưu trữ) |
| PATCH | `/lists/:id/move` | ✅ kéo đổi thứ tự cột |
| POST | `/lists/:id/rebalance` | ❌ chưa |
| GET | `/lists/:id/cards` | ❌ chưa |
| POST | `/lists/:id/cards` | ✅ |

### Thẻ

| Method | Path | FE dùng chưa |
|---|---|---|
| PATCH | `/tasks/:id/move` | ✅ |
| PATCH | `/tasks/:id/snooze` | ✅ |
| PATCH | `/tasks/:id/complete` | ✅ (đã sửa đọc `res.completed`) |
| PATCH | `/tasks/:id/reopen` | ✅ |
| GET | `/tasks/:id/detail` | ✅ |
| PATCH | `/tasks/:id` | ✅ một phần — chưa sửa `repeat` / `estimateMinutes` |
| DELETE | `/tasks/:id` | ✅ (xoá mềm) |
| POST | `/tasks/:id/restore` | ✅ |
| POST | `/tasks/inbox/cards` | ✅ ô nhập nhanh của Hộp thư đến |
| PUT | `/tasks/:id/labels` | ❌ chưa |
| POST | `/tasks/:id/labels/:labelId` | ❌ chưa |
| DELETE | `/tasks/:id/labels/:labelId` | ❌ chưa |

### Nhãn · checklist · ghi chú · đính kèm

| Method | Path | FE dùng chưa |
|---|---|---|
| PATCH | `/labels/:id` | ❌ chưa |
| DELETE | `/labels/:id` | ❌ chưa |
| POST | `/tasks/:id/checklists` | ✅ |
| DELETE | `/checklists/:id` | ❌ chưa — xoá được từng mục, chưa xoá được cả danh sách |
| POST | `/checklists/:id/items` | ✅ |
| PATCH | `/checklist-items/:id` | ✅ |
| DELETE | `/checklist-items/:id` | ✅ |
| POST | `/tasks/:id/notes` | ✅ |
| PATCH | `/notes/:id` | ❌ chưa (FE ghi là không cần) |
| DELETE | `/notes/:id` | ✅ |
| POST | `/tasks/:id/attachments` | ⛔ bị chặn bởi CSP — FE đang ẩn nút |
| PATCH | `/attachments/:id` | ⛔ như trên |
| DELETE | `/attachments/:id` | ⛔ như trên |

### Endpoint cũ, không thuộc màn bảng

`GET /tasks`, `GET /tasks/:id`, `GET /tasks/stats`, `POST /tasks`,
`GET|POST|PATCH|DELETE /task-types` — giữ nguyên, các màn `/kanban`, `/tasks`,
`/dashboard` vẫn dùng.

> ⚠️ `GET /attachments/:id/raw` **chưa tồn tại**. Nó nằm trong hướng 1 mà FE đề
> nghị ở mục 2, và chỉ có sau khi chốt chỗ lưu file.

---

## 7. Giới hạn tần suất

Mặc định **20 request / 60 giây**. Nới lên **120 / 60 giây** cho:

```
PATCH /tasks/:id/move
PATCH /tasks/:id/snooze
PATCH /checklist-items/:id
PATCH /lists/:id/move
POST  /lists/:id/cards
POST  /tasks/inbox/cards
POST  /checklists/:id/items
```

Các endpoint còn lại vẫn ở mức 20/60s. Nếu FE thấy 429 ở endpoint nào ngoài danh
sách này thì báo, nới thêm là chuyện một dòng.

---

## 8. Việc duy nhất đang chặn một tính năng

**Đính kèm.** Cần chốt chỗ lưu file thì mới làm tiếp được. Hướng phục vụ file thì
đã thống nhất theo đề nghị của FE (hướng 1: backend phục vụ qua
`GET /attachments/:id/raw`, CSP của FE chỉ cần thêm domain API).

Ba lựa chọn chỗ lưu:

| | Đổi lại |
|---|---|
| **Supabase Storage** | Dùng lại Supabase đang có, free tier 1GB tách khỏi hạn mức 500MB của DB. Cần cấp `SUPABASE_URL` + service key |
| **Postgres (bytea)** | Không cần cấu hình gì, làm được ngay. Nhưng ăn vào hạn mức 500MB của DB và backup phình theo ảnh |
| **S3 / Cloudflare R2** | Chuẩn nhất lâu dài, R2 miễn phí egress. Cần tạo tài khoản + bucket + access key trước |

Mọi phương án đều **không đổi hợp đồng API** đã ghi ở `board-api-contract.md`.


---

## 9. FE trả lời — cập nhật 16/09/2026

Kiểm chứng bằng code thật (đếm nơi gọi từng phương thức trong `apis/board.api.ts`),
không điền theo trí nhớ. Typecheck / lint / build đều sạch sau các thay đổi dưới đây.

### 9.1 Đã xác nhận các khẳng định của backend

Đọc code backend chứ không chỉ đọc tài liệu:

| Khẳng định | Kiểm bằng gì | Kết quả |
|---|---|---|
| `?undo=true` nhận ở mọi endpoint ghi | `@Query() flags: UndoFlagQueryDto` trong 2 controller | ✅ 7 chỗ, gồm cả `_flags` không dùng tới ở `/lists/:id` và `/restore` |
| `PATCH /tasks/:id` nay ghi `DUE_CHANGED` | `tasks.service.ts:183-195` | ✅ chỉ ghi khi `deadline` đổi, và bỏ qua khi có cờ undo |
| Đổi tiêu đề / ưu tiên / bìa không ghi log | cùng đoạn trên | ✅ |

### 9.2 Đã làm xong hai việc FE còn nợ ở §3

**a. Gửi `?undo=true` cho toàn bộ endpoint ghi.** Gom vào một hàm `undoQuery()`
trong `apis/board.api.ts`, các phương thức `updateCard`, `completeCard`,
`reopenCard`, `restoreCard`, `updateList` nay đều nhận tham số `undo`. Mọi cặp
undo/redo trong `BoardStore.tsx` đã gửi cờ.

**b. Xoá thẻ lặp khi hoàn tác "hoàn thành"** — đúng cách backend gợi ý ở §2c.

Một chi tiết không nằm trong gợi ý, đáng ghi lại: `spawnedId` **không thể là hằng
số**. Redo gọi lại `complete` sẽ sinh thẻ mới với id khác, nên nếu giữ id cũ thì
lần hoàn tác thứ hai sẽ xoá nhầm một thẻ không còn tồn tại (404) và để lại thẻ
thật. FE lưu id này trong biến đóng và ghi đè sau mỗi lần redo:

```ts
let spawned = next?.id ?? null;
undo: async () => {
  await reopenCard(cardId, true);
  if (spawned) { await deleteCard(spawned); spawned = null; }
},
redo: async () => {
  const again = await completeCard(cardId);
  spawned = again.next?.id ?? null;   // id MỚI, không phải id cũ
},
```

**Không cần thêm cột `repeatSourceId`** như backend đề nghị ở cuối §2c — cách này
đủ dùng và không phải migration.

### 9.3 Một chỗ trong §2 cần backend xác nhận lại

Bảng ở §2 ghi `PATCH /tasks/:id/complete` với `?undo=true` thì **không sinh lại
thẻ lặp**. FE đang dùng cờ này cho chiều **undo của thao tác "mở lại việc"**
(mở lại → Ctrl+Z → hoàn thành lại). Ở tình huống đó, không sinh thẻ lặp là đúng.

Nhưng chiều **redo của "hoàn thành"** thì FE gọi `complete` **không kèm cờ**, để
thẻ lặp được sinh lại — đúng với thứ người dùng vừa hoàn tác. Nếu backend hiểu cờ
này theo nghĩa khác thì báo lại, chỗ này chỉ khác nhau một tham số.

### 9.4 Còn lại phía FE, theo thứ tự ưu tiên

| Việc | Vì sao chưa làm |
|---|---|
| **Chạy thử với tài khoản thật** | Việc lớn nhất còn lại. Cần đăng nhập rồi thao tác thật; xem danh sách cần để ý ở §9.5 |
| Tải thêm khi cuộn trong cột | `GET /lists/:id/cards` đã sẵn sàng. Bộ đếm cột nay hiện dạng `20/42` bất cứ khi nào số đã tải khác tổng thật, nên ít nhất người dùng không bị hiểu nhầm cột chỉ có 20 việc |
| Giao diện chọn nhãn cho thẻ, quản lý nhãn của bảng | Chưa dựng. 6 endpoint nhãn đều chưa gọi |
| Sửa `repeat` / `estimateMinutes` từ giao diện | Hiện chỉ đặt được qua cú pháp nhập nhanh (`30p`), và chỉ đọc được ở màn chi tiết |
| Xoá cả một danh sách việc cần làm | `DELETE /checklists/:id` chưa gọi |
| Gọi rebalance khi khe sập | Ưu tiên thấp, backend đã tự rebalance trong `move` |

### 9.5 Cần để ý khi chạy thử thật

Bốn thứ dễ hỏng nhất, xếp theo mức khó phát hiện:

1. **Kéo một thẻ sang cột khác — mở tab Network, phải thấy đúng MỘT request
   `/move`.** FE xem trước vị trí bằng cách sửa cache, chỉ gọi API lúc thả. Nếu
   thấy hàng chục request thì phần tách preview/commit đã hỏng.
2. **Bấm "Hoàn thành" một việc có lặp rồi Ctrl+Z** — thẻ gốc phải mở lại **và**
   thẻ lặp mới phải biến mất. Đây là §2c, chỗ dễ để lại việc thừa nhất.
3. **Ctrl+Z rồi mở nhật ký của việc đó** — không được có dòng thừa. Nếu có thì
   một endpoint nào đó chưa nhận cờ undo.
4. **Kéo thẻ vào cột có `mapsToStatus = DONE`** — việc phải tự đánh dấu hoàn
   thành, và trang `/kanban` cũ phải phản ánh đúng.
