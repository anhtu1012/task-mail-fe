# Sự kiện lịch (EVENT) — hợp đồng API đã chạy

**Trạng thái:** backend **đã code xong, migration đã chạy trên DB dev, đã gọi
thật bằng token thật** (xem [§6](#6-đã-kiểm-tới-đâu)). Không phải đề xuất.

**Đọc trước:** [§1 Vì sao dùng chung bảng `tasks`](#1-một-bảng-hai-loại) —
quyết định đó chi phối mọi thứ còn lại.

---

## 1. Một bảng, hai loại

Việc (`TASK`) và sự kiện lịch (`EVENT`) nằm **chung bảng `tasks`**, phân biệt
bằng cột `kind`.

Vì sao không tách bảng riêng: sự kiện cần đúng những thứ việc đang có — nhãn,
ghi chú, đính kèm, thuộc dự án, nhắc qua Zalo, phân quyền theo `assigneeId`.
Tách ra là nhân đôi cả bảy quan hệ đó cùng toàn bộ tầng quyền, để đổi lại một
cột `kind`.

Khác nhau ở **mốc thời gian**, và đây là bất biến quan trọng nhất:

| | Mốc | Ý nghĩa |
|---|---|---|
| `TASK` | `deadline` | một mốc phải xong trước |
| `EVENT` | `startAt` … `endAt` | một khoảng có mặt |

Hai hệ quả **không hiển nhiên**:

1. **`EVENT` có `deadline` được nhân bản từ `startAt`.** Không phải dữ liệu
   thừa: bộ nhắc deadline sẵn có (cron Zalo, `findApproachingDeadline`) lọc
   theo `deadline`, nên nhân bản là cách để sự kiện được nhắc mà không phải
   viết bộ nhắc thứ hai. **Giao diện KHÔNG đọc `deadline` của EVENT.**
2. **`EVENT` luôn có `boardId = null`.** Bảng công việc là nơi làm việc, không
   phải nơi xem lịch hẹn. Mọi truy vấn bảng đều lọc theo `boardId`, nên `null`
   là đủ để sự kiện không bao giờ lọt vào Hộp thư đến.

---

## 2. Cột mới trên `tasks`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `kind` | `ItemKind` (`TASK` \| `EVENT`) | mặc định `TASK`; mọi hàng cũ nhận giá trị này |
| `start_at` | `timestamp?` | chỉ `EVENT` |
| `end_at` | `timestamp?` | chỉ `EVENT`, phải `>= start_at` |
| `all_day` | `boolean` | mặc định `false` |

Ràng buộc ép ở **tầng DB**, không chỉ ở DTO — cả API lẫn script đều ghi vào
bảng này:

```sql
CHECK (
  (kind = 'TASK'  AND start_at IS NULL AND end_at IS NULL)
  OR
  (kind = 'EVENT' AND start_at IS NOT NULL AND end_at IS NOT NULL
    AND end_at >= start_at)
)
```

Migration `20260922100000_add_calendar_events` là **additive hoàn toàn**: cột
mới đều nullable hoặc có DEFAULT, nên chạy thẳng trên bảng đang có dữ liệu và
hành vi cũ không đổi.

---

## 3. `GET /tasks?kind=`

| Giá trị | Trả về |
|---|---|
| *(bỏ trống)* | **chỉ `TASK`** |
| `TASK` | chỉ việc |
| `EVENT` | chỉ sự kiện |
| `ALL` | cả hai |

**Mặc định là `TASK`, không phải cả hai** — có chủ đích: mọi màn viết trước khi
có sự kiện (Công việc, Kanban, Tổng quan) giữ nguyên hành vi. Thêm một khái
niệm mới không được phép làm dữ liệu lạ tự chui vào những màn không biết gì về
nó. Lịch là màn duy nhất gửi `kind=ALL`.

### Lọc theo khoảng thời gian

`from`/`to` hỏi **hai câu khác nhau** cho hai loại:

- `TASK` chạm khoảng khi `deadline` nằm trong đó (một mốc);
- `EVENT` chạm khoảng khi nó **giao** với khoảng — `start_at <= to` và
  `end_at >= from`.

Hỏi cùng một câu cho cả hai sẽ đánh rơi đúng loại sự kiện dễ thấy nhất: cái kéo
dài từ tháng trước sang tháng đang xem.

---

## 4. Tạo và sửa

```jsonc
// POST /tasks — sự kiện
{
  "projectId": "…",
  "kind": "EVENT",
  "title": "Họp khách hàng",
  "startAt": "2026-09-24T03:00:00.000Z",
  "endAt": "2026-09-24T04:30:00.000Z",
  "allDay": false
}
```

- Thiếu `startAt` hoặc `endAt` → **400**.
- `endAt < startAt` → **400**.
- `deadline` gửi kèm sự kiện **bị bỏ qua** (backend nhân bản từ `startAt`).
- `startAt`/`endAt` gửi kèm một `TASK` **bị bỏ qua**.

**`PATCH /tasks/:id` KHÔNG cho đổi loại.** Đổi `TASK` thành `EVENT` nghe thì
tiện nhưng kéo theo cả dây: việc đang nằm trong một cột của bảng phải bị gỡ ra,
`completedAt` mất nghĩa, và ràng buộc CHECK sẽ chặn nếu quên dọn cột nào. Muốn
đổi thì xoá rồi tạo lại — hiếm và rõ ràng hơn nhiều.

---

## 5. Response

`TaskResponseDto` có thêm `kind`, `startAt`, `endAt`, `allDay`. Client cũ không
đọc bốn field này thì không bị ảnh hưởng.

---

## 6. Đã kiểm tới đâu

Gọi thật trên DB dev bằng token thật:

| Tình huống | Kết quả |
|---|---|
| Tạo sự kiện 10:00–11:30 | ✅ `kind=EVENT`, `deadline` nhân bản từ `startAt` |
| Thiếu `endAt` | ✅ 400 |
| `endAt < startAt` | ✅ 400 |
| `GET /tasks` mặc định | ✅ chỉ trả `TASK` |
| `GET /tasks?kind=ALL` | ✅ cả hai loại |
| Sự kiện có lọt vào `/boards/me/full` không | ✅ không |
| Sự kiện vắt qua ranh giới tuần (26→29/09) | ✅ truy vấn theo khoảng trả về đúng |

99/99 unit test cũ vẫn xanh.

---

## 7. Việc còn lại của FE

- [ ] Kéo thả sự kiện trên lịch để dời (hiện chỉ kéo được việc — dời sự kiện
      phải dịch cả `startAt` lẫn `endAt`, chưa làm).
- [ ] Lịch tuần/ngày theo khung giờ (hiện chỉ có lưới tháng).
- [ ] Sự kiện lặp lại: `repeat` dùng được về mặt dữ liệu nhưng lượt kế tiếp chỉ
      sinh khi bấm "hoàn thành" — khái niệm đó không hợp với sự kiện.
