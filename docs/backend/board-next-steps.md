# Bảng công việc — việc backend cần làm tiếp

**Bối cảnh:** frontend đã nối xong API thật, bỏ hoàn toàn dữ liệu giả. Tài liệu
này ghi những gì phát hiện **trong lúc nối**, cộng với các việc backend còn treo.

**Nguồn:** `board-api-contract.md` (bản backend bàn giao) và `board-spec.md`
(đặc tả gốc). Chỉ ghi phần còn lại, không nhắc lại phần đã xong.

**Trạng thái frontend:** typecheck / lint / build sạch. Đã gọi thử
`GET /boards/me/full` trên bản triển khai — trả 401 đúng hình dạng lỗi, không có
lớp bọc `{ success, data }`. **Chưa chạy thử với tài khoản thật.**

---

## 1. 🔴 Thiếu `?undo=true` ở 5 endpoint — nhật ký sẽ bị rác

Đây là phát hiện quan trọng nhất khi nối FE, chưa có trong tài liệu nào.

Mục 5.7.3 của đặc tả yêu cầu cờ `?undo=true` để thao tác hoàn tác không ghi
nhật ký. Backend đã làm cho **3** endpoint:

- `PATCH /tasks/:id/move`
- `PATCH /tasks/:id/snooze`
- `PATCH /checklist-items/:id`

Nhưng Ctrl+Z ở frontend còn phát sinh các lời gọi sau, và tất cả đều ghi nhật ký:

| Người dùng làm gì | Ctrl+Z gọi endpoint nào | Nhật ký hiện bị ghi thừa |
|---|---|---|
| Tạo việc | `DELETE /tasks/:id` | — (xoá không ghi log, cần xác nhận) |
| Xoá việc | `POST /tasks/:id/restore` | dòng khôi phục |
| Hoàn thành việc | `PATCH /tasks/:id/reopen` | `CARD_REOPENED` |
| Mở lại việc | `PATCH /tasks/:id/complete` | `CARD_COMPLETED` |
| Sửa việc (tiêu đề, ưu tiên, bìa, hạn) | `PATCH /tasks/:id` | `DUE_CHANGED` khi đụng `deadline` |
| Đổi tên / lưu trữ danh sách | `PATCH /lists/:id` | tuỳ cách hiện tại |

**Hệ quả thực tế:** người dùng bấm nhầm "Hoàn thành" rồi Ctrl+Z ngay, nhật ký
của việc đó có 2 dòng — "Đánh dấu hoàn thành" và "Mở lại việc" — trong khi họ
không hề chủ ý làm gì. Làm vài lần là nhật ký mất hết giá trị tra cứu.

**Đề nghị:** thêm `?undo=true` (bỏ qua bước ghi `TaskActivity`) cho:

```
POST   /tasks/:id/restore?undo=true
PATCH  /tasks/:id/reopen?undo=true
PATCH  /tasks/:id/complete?undo=true
PATCH  /tasks/:id?undo=true
PATCH  /lists/:id?undo=true
```

Frontend đã sẵn sàng gửi cờ này ngay khi backend nhận — chỗ gọi nằm gọn trong
`components/board/BoardStore.tsx`, mỗi thao tác có một cặp hàm `undo` / `redo`.

Nếu backend thấy cách khác gọn hơn (ví dụ header `X-Undo: 1` dùng chung cho mọi
endpoint ghi) thì càng tốt — chỉ cần thống nhất một cách.

---

## 2. 🔴 Đính kèm: URL ngoài domain sẽ bị trình duyệt chặn

`POST /tasks/:id/attachments` hiện nhận JSON `{ name, kind, url, sizeBytes }`,
tức frontend phải tự có URL. Nhưng **kể cả có URL thì ảnh vẫn không hiển thị
được**, vì Content-Security-Policy của frontend (`next.config.ts`) chỉ cho:

```
img-src 'self' data: blob:
```

Ảnh ở S3, Cloudinary hay bất kỳ domain nào khác đều bị chặn **im lặng** — không
có lỗi trên màn, ảnh chỉ đơn giản là không hiện.

Ba hướng, đề nghị chọn hướng 1:

| | Hướng | Đánh đổi |
|---|---|---|
| **1** | Backend phục vụ file qua chính domain API (`GET /attachments/:id/raw`), lưu ở đâu cũng được | FE chỉ cần thêm domain API vào `img-src`; mọi file đi qua kiểm tra quyền, không lo lộ link |
| 2 | Dùng S3 public, FE nới CSP cho domain S3 | Nhanh nhưng link công khai ai có cũng xem được — với công cụ cá nhân thì không ổn |
| 3 | FE tải file về rồi dựng `blob:` URL | Không cần đổi CSP nhưng mỗi lần mở thẻ phải tải lại toàn bộ ảnh |

Cần kèm theo:

```
POST /tasks/:id/attachments/upload-url   -> { uploadUrl, attachmentId }   (nếu dùng presigned)
```
hoặc đơn giản là nhận **multipart** thẳng ở endpoint hiện có.

Đây là câu hỏi 9.3 của đặc tả vẫn đang treo. Cho tới khi chốt, frontend **ẩn nút
thêm đính kèm** và chỉ hiển thị đính kèm sẵn có.

---

## 3. 🟡 Chạy migration ngoài môi trường dev

Theo §13 của hợp đồng, migration `20260915000000_add_personal_board` mới chạy
trên **Supabase dev**. Trước khi lên staging/production cần chú ý 3 chỗ:

- `CREATE EXTENSION IF NOT EXISTS "unaccent"` — cần user DB có quyền tạo
  extension. Supabase production thường siết quyền này hơn dev.
- `ALTER TABLE "tasks" ALTER COLUMN "description" TYPE TEXT` — trên bảng đã có
  dữ liệu thật thì đây là thao tác khoá bảng, nên chạy lúc vắng người dùng.
- Backfill `position` và tạo bảng mặc định chạy **lười** ở lần gọi API đầu tiên
  của mỗi người (§1.8). Với tài khoản có sẵn vài trăm task, lần gọi đầu sẽ chậm
  bất thường. Cân nhắc chạy sẵn một script backfill cho toàn bộ user thay vì để
  người dùng đầu tiên gánh.

---

## 4. 🟡 Ba ô nghiệm thu chưa kiểm được

Từ §13 của hợp đồng, cần dữ liệu thật mới kiểm được:

| Ô | Cách tạo dữ liệu để kiểm |
|---|---|
| Mốc 400 ms với bảng 200 thẻ | Seed 200 task cho một tài khoản rồi đo `/boards/me/full` |
| `/agenda` trả thẻ thứ 25 của một cột | Tạo cột 30 thẻ, đặt hạn hôm nay cho thẻ thứ 25 — đây là **bẫy phân trang**, chính là lý do endpoint này tồn tại |
| Lưu trữ danh sách → thẻ về Hộp thư đến | `PATCH /lists/:id { archived: true }` rồi kiểm `cardCounts.inbox` |

Ô thứ hai là quan trọng nhất: nếu `/agenda` cũng bị giới hạn 20 thẻ mỗi cột ở
đâu đó trong tầng repository thì lỗi sẽ **không ai thấy** — màn vẫn hiện bình
thường, chỉ thiếu vài việc.

---

## 5. 🟡 Job rebalance định kỳ

Backend đã tự rebalance khi khe sập trong lúc `move` (§5 hợp đồng) — đủ cho vận
hành bình thường. Đặc tả mục 2.1 còn đề nghị thêm một job quét định kỳ các cột có
khoảng cách `position` nhỏ hơn `0.001` làm lớp phòng bị.

Mức ưu tiên thấp: với công cụ cá nhân, một người phải chèn 50 lần liên tiếp vào
đúng một khe mới cạn precision. Cứ để đó, khi nào thấy log rebalance chạy nhiều
thì hãy làm.

---

## 6. ⚪ Chưa cần — ghi lại để khỏi quên

- **WebSocket** (mục 6 đặc tả). Công cụ cá nhân một người dùng, một phiên — chưa
  cần. Chỉ cần khi mở nhiều thiết bị cùng lúc.
- **Nhiều bảng một người.** `Board.ownerId @unique` đang đúng với hiện tại.
  Frontend đã giữ sẵn route `/boards` (chuyển hướng thẳng vào bảng duy nhất) nên
  khi bỏ ràng buộc `@unique` thì chỉ cần dựng lại giao diện danh sách, không phải
  sửa kiến trúc.
- **`PATCH /notes/:id`** đã có nhưng frontend chưa dùng (ghi chú hiện chỉ thêm và
  xoá). Không cần làm gì thêm.

---

## 7. Trả lời danh sách §12 của hợp đồng

Frontend đã nối xong, xác nhận từng dòng:

| Mục | Trạng thái |
|---|---|
| Response không có lớp bọc | ✅ đã kiểm bằng lời gọi thật, đọc thẳng |
| Không prefix `/api` | ✅ |
| Không gửi field lạ trong body | ✅ có hàm lọc `undefined` trước khi gửi |
| `cardCounts` khoá `"inbox"`, cột rỗng không có khoá | ✅ đọc `counts[id] ?? 0` |
| `cards` là mảng phẳng, FE tự nhóm | ✅ |
| `lists` gồm cả `archived`, FE tự lọc | ✅ |
| Lấy `position` trong response làm chuẩn | ✅ ghi đè cache theo response của `move` |
| Hiểu `warning` là cảnh báo | ✅ hiện toast, thao tác vẫn thành công |
| Không cộng `overdue + dueToday` | ✅ hiển thị hai số riêng |
| Dùng `plannedMinutes`/`doneToday` của `/agenda` | ✅ không tự cộng từ mảng |
| Không lẫn `attachments` với `attachmentLinks` | ✅ `attachmentLinks` chỉ hiện dạng "N liên kết từ nội dung gốc" |
| Hiển thị nguyên `activity.message` | ✅ |
| Gửi `?tz=` | ✅ lấy từ `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| Gửi `?undo=true` khi replay | ⚠️ **chỉ gửi được ở 3 endpoint có hỗ trợ — xem mục 1** |
| `cursor` = `position` | ⚠️ **chưa dùng — xem mục 8** |
| Sửa nơi gọi `/complete` để đọc `res.completed` | ✅ đã sửa, có báo thêm khi `next != null` |
| Chấp nhận đính kèm chỉ nhận URL | ❌ **không dùng được vì CSP — xem mục 2** |

**Câu hỏi cuối của §12 — `status` trong thẻ rút gọn có hữu ích không?**

**Giữ lại.** Hiện frontend chưa dùng nó để vẽ giao diện (trạng thái xong/chưa đọc
từ `completedAt`), nhưng nó cần cho hai việc sắp tới: đồng bộ với trang `/kanban`
cũ vốn nhóm theo `status`, và phân biệt `CANCELLED` với `DONE` — hai thứ mà
`completedAt` không tách được. Chi phí gửi kèm gần như bằng không.

---

## 8. Việc phía frontend còn nợ — ghi ở đây để hai bên cùng thấy

Không phải việc của backend, nhưng liên quan:

| Việc | Ghi chú |
|---|---|
| Tải thêm khi cuộn trong cột | Endpoint `/lists/:id/cards` và `/boards/me/inbox/cards` đã sẵn sàng, FE chưa gọi. Hiện mỗi cột chỉ hiện 20 thẻ đầu, phần đếm đã hiện đúng dạng `20/42` nên người dùng biết còn thiếu |
| Gọi `rebalance` khi phát hiện khe sập | Đã có hàm `needsRebalance` nhưng chưa nối vào luồng kéo thả |
| Sửa nhãn của thẻ | `PUT /tasks/:id/labels` đã có, FE chưa dựng giao diện chọn nhãn |
| Đặt `repeat` và `estimateMinutes` từ giao diện | Hiện chỉ đọc được, chưa sửa được (trừ qua cú pháp nhập nhanh `30p`) |

---

## Tóm tắt thứ tự nên làm

1. **Mục 1** — thêm `?undo=true` cho 5 endpoint. Rẻ, và không có nó thì nhật ký
   hỏng dần theo thời gian sử dụng.
2. **Mục 2** — chốt chỗ lưu file rồi làm upload. Đang chặn hẳn một tính năng.
3. **Mục 4** — tạo dữ liệu thật để kiểm 3 ô còn lại, đặc biệt là bẫy phân trang
   của `/agenda`.
4. **Mục 3** — chuẩn bị chạy migration ngoài dev.
5. Mục 5, 6 để sau.
