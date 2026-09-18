# Cài đặt giao diện — hợp đồng API đã chạy

**Trạng thái:** backend **đã code xong, migration đã chạy trên DB dev, đã gọi
thật bằng token thật**. File này mô tả thứ đang chạy, không còn là đề xuất.

Bản trước của file này là đề xuất FE gửi sang. Backend làm theo, có **bốn chỗ
lệch** — đều nằm ở [§7](#7-chỗ-lệch-so-với-đề-xuất-ban-đầu), FE cần đọc mục đó
trước khi tick.

**FE không phải sửa code.** `themeApi` bắt 404/501 để lùi về lưu dưới máy; giờ
route đã có nên nó tự dùng DB. Việc còn lại của FE là xác nhận
([§8](#8-danh-sách-fe-check)) rồi gỡ ghi chú "backend có thể chưa triển khai"
trong `apis/endpoints.ts` và `apis/theme.api.ts`.

---

## 1. Quy ước chung

Giống mọi API hiện có:

- **Không prefix, không version**: đường dẫn đúng như viết ở đây.
- **Không bọc response**: trả thẳng object, không `{ success, data }`.
- **Xác thực**: `Authorization: Bearer <access token>`. Cả ba endpoint đều bắt
  buộc — gọi không token trả **401** (đã kiểm).
- **Hình dạng lỗi**: `{ statusCode, errorCode, message, path, timestamp }`.

---

## 2. Dữ liệu

Đúng bốn trường, khớp `ThemeState` trong `libs/theme/presets.ts`.

| Trường | Kiểu JSON | Ràng buộc | Mặc định hệ thống |
|---|---|---|---|
| `background` | `string` | 1–40 ký tự, `^[a-z0-9-]+$` | `"harbour"` |
| `accent` | `string` | `^#[0-9a-fA-F]{6}$` | `"#0a436d"` |
| `surfaceOpacity` | `number` | `0.5 ≤ x ≤ 1` | `0.7` |
| `surfaceBlur` | `number` | `0 ≤ x ≤ 28`, **số nguyên** | `16` |

Biên là **bao gồm**: `0.5`, `1`, `0`, `28` đều hợp lệ (đã kiểm từng giá trị).

`background` cố tình là chuỗi tự do chứ không phải enum — FE thêm ảnh nền mới
không cần backend chạy migration. FE vẫn tự chịu trách nhiệm với id lạ qua
`findBackground()`.

Bộ mặc định hệ thống nằm ở `src/modules/preferences/theme.constants.ts` phía
backend. **Đây là bản sao có chủ ý** của `DEFAULT_THEME` bên FE: nếu FE đổi mặc
định thì phải báo backend đổi theo, hai file không tự đồng bộ.

---

## 3. `GET /me/preferences/theme`

**Luôn 200**, kể cả khi chưa từng lưu.

Đã lưu:

```json
{
  "theme": {
    "background": "midnight",
    "accent": "#7C3AED",
    "surfaceOpacity": 0.62,
    "surfaceBlur": 20
  },
  "source": "user",
  "updatedAt": "2026-09-18T10:16:32.768Z"
}
```

Chưa từng lưu:

```json
{
  "theme": {
    "background": "harbour",
    "accent": "#0a436d",
    "surfaceOpacity": 0.7,
    "surfaceBlur": 16
  },
  "source": "default",
  "updatedAt": null
}
```

`source` hoạt động đúng như FE yêu cầu:

- `"default"` → chưa có bản ghi, FE được phép đẩy cấu hình dưới máy lên.
- `"user"` → đã có bản ghi, FE lấy làm chuẩn, không ghi đè.

`updatedAt` là chuỗi ISO 8601 UTC, `null` khi `source: "default"`.

**Không có đường nào endpoint này trả 404.** Người dùng chưa lưu vẫn là 200 —
nên `unsupported` bên `themeApi` chỉ bật khi route thật sự chưa deploy.

---

## 4. `PUT /me/preferences/theme`

Upsert. Body là đúng object `theme`, không bọc:

```json
{ "background": "midnight", "accent": "#7C3AED", "surfaceOpacity": 0.62, "surfaceBlur": 20 }
```

**200** trả về bản ghi sau khi lưu, cùng hình dạng `GET`, `source` luôn
`"user"`, `updatedAt` là thời điểm vừa ghi.

### 4.1 Lỗi — 422

```json
{
  "statusCode": 422,
  "errorCode": "VALIDATION_FAILED",
  "message": ["surfaceOpacity must not be less than 0.5"],
  "path": "/me/preferences/theme",
  "timestamp": "2026-09-18T10:16:32.846Z"
}
```

`message` **luôn là mảng chuỗi**, có thể nhiều phần tử khi sai nhiều trường
cùng lúc. Nếu FE hiển thị thẳng `message` thì nhớ `join`, đừng in mảng.

Câu chữ trong `message` do class-validator sinh, đa phần tiếng Anh, vài ràng
buộc backend viết tiếng Việt. **Đừng hiển thị thẳng cho người dùng cuối** — đây
là lỗi chỉ xảy ra khi client bị qua mặt, người dùng thường không bao giờ thấy.

### 4.2 ⚠️ Trường thừa cũng bị chặn — 422

Đây là thứ đề xuất ban đầu không nói, FE cần biết:

```jsonc
// gửi thêm một trường lạ
{ "background": "harbour", "accent": "#0a436d", "surfaceOpacity": 0.7, "surfaceBlur": 16, "hacked": true }
```
```json
{
  "statusCode": 422,
  "errorCode": "VALIDATION_FAILED",
  "message": ["property hacked should not exist"]
}
```

Backend bật `forbidNonWhitelisted` toàn cục. Nghĩa là **body phải đúng bốn
trường, không thừa không thiếu**. Nếu về sau FE thêm trường mới vào
`ThemeState` (ví dụ `fontScale`) mà gửi luôn lên, request sẽ hỏng ngay —
`schedulePush()` cần cắt đúng bốn trường trước khi gửi, hoặc báo backend thêm
trường trước.

### 4.3 Tần suất và rate limit

Trần **60 request/phút** cho cả ba endpoint của controller này (mức chung của
app là 20/phút — đã nâng riêng). Debounce 700ms của FE cho ra vài request mỗi
phiên, còn rất xa trần.

Vượt trần trả **429** với hình dạng lỗi chung. `themeApi` hiện **không** coi
429 là `unsupported` — đúng, vì đó là tình huống tạm thời.

---

## 5. `DELETE /me/preferences/theme`

**204 No Content**, không có body.

**Idempotent**: gọi khi chưa có bản ghi vẫn 204 (đã kiểm bằng cách gọi hai lần
liên tiếp). Gọi xong thì `GET` quay về `source: "default"`.

---

## 6. Kết quả smoke test

Chạy thật trên DB dev bằng token thật, không phải unit test:

| Tình huống | Kỳ vọng | Thực tế |
|---|---|---|
| `GET` khi chưa lưu | 200, `source: "default"`, `updatedAt: null` | ✅ |
| `PUT` hợp lệ | 200, `source: "user"` | ✅ |
| `GET` sau `PUT` | trả đúng bản vừa lưu | ✅ |
| `surfaceOpacity` trong JSON | số `0.62`, không phải chuỗi `"0.62"` | ✅ |
| `accent` giữ nguyên hoa/thường | gửi `#7C3AED` → nhận `#7C3AED` | ✅ |
| Biên `0.5` / `1` / `0` / `28` | chấp nhận | ✅ |
| `surfaceOpacity: 0.3` | 422 | ✅ |
| `accent: "0a436d"` (thiếu `#`) | 422 | ✅ |
| `background: "Harbour_01"` | 422 | ✅ |
| `surfaceBlur: 16.5` | 422 (`must be an integer number`) | ✅ |
| Body có trường thừa | 422 | ✅ |
| `DELETE` lần 1 | 204 | ✅ |
| `DELETE` lần 2 (không còn bản ghi) | 204, không phải 404 | ✅ |
| `GET` sau `DELETE` | `source: "default"` | ✅ |
| Cả 3 endpoint không token | 401 | ✅ |
| 25 `GET` liên tiếp | không 429 (trần 60/phút) | ✅ |

---

## 7. Chỗ lệch so với đề xuất ban đầu

Bốn chỗ. Ba chỗ đầu không ảnh hưởng FE, chỗ thứ tư thì có.

### 7.1 `surfaceOpacity` lưu `double precision`, không phải `numeric(3,2)`

Đề xuất gợi ý `numeric(3,2)`. Backend dùng `double precision` vì đúng cái bẫy
mà đề xuất cảnh báo: driver Postgres trả `numeric` về dạng **chuỗi**, phải ép
kiểu ở tầng serialize mới thành số. `double` trả thẳng số JS, bỏ được hẳn một
bước dễ quên.

**Hệ quả FE cần biết:** không có làm tròn về 2 chữ số. Gửi `0.6234567` thì nhận
lại đúng `0.6234567`. Thanh trượt của FE đang sinh giá trị 2 chữ số nên không
đổi gì, nhưng đừng trông chờ server làm tròn hộ.

### 7.2 `accent` lưu `varchar(7)`, không phải `char(7)`

`char` của Postgres đệm và cắt khoảng trắng ở đuôi — rủi ro thừa cho một chuỗi
luôn đúng 7 ký tự. Hoa/thường giữ nguyên như client gửi, đã kiểm.

### 7.3 Tên bảng là `user_theme_preferences` (số nhiều)

Đề xuất ghi `user_theme_preference`. Backend để số nhiều cho khớp `users`,
`boards`, `mail_accounts`. Thuần nội bộ, FE không thấy.

### 7.4 ⚠️ 422 chỉ áp cho endpoint này, phần còn lại của API vẫn 400

Global validation pipe của app trả **400** cho body sai, và các màn hình khác
(board, tasks…) đang rẽ nhánh theo mã đó. Đổi toàn cục sang 422 là phá hợp
đồng của những endpoint đã chạy.

Nên backend gắn một exception filter **ở phạm vi controller preferences**:
riêng `/me/preferences/theme` trả 422 `VALIDATION_FAILED` đúng như FE yêu cầu,
mọi nơi khác giữ nguyên 400.

**Hệ quả FE:** nếu có helper xử lý lỗi validation dùng chung, nó phải nhận cả
400 lẫn 422, hoặc `theme.api.ts` tự xử lý riêng. Đừng giả định cả API đã chuyển
sang 422.

---

## 8. Danh sách FE check

- [ ] `GET` sau khi đăng nhập trả `source: "default"` với tài khoản mới, và
      `useThemeSync()` đẩy cấu hình dưới máy lên đúng một lần
- [ ] Tài khoản đã lưu: `source: "user"`, FE **không** ghi đè bằng localStorage
- [ ] Kéo thanh trượt → đúng một request sau 700ms, không phải hàng chục
- [ ] Đổi trình duyệt / máy khác: đăng nhập vào thấy đúng giao diện đã chỉnh
- [ ] Đăng xuất (`localStorage.clear()`) rồi đăng nhập lại: cấu hình **không**
      mất nữa
- [ ] "Khôi phục mặc định" → `DELETE` → giao diện về mặc định; bấm lần nữa
      không lỗi
- [ ] `schedulePush()` chỉ gửi đúng bốn trường, không kèm trường nào khác
      (xem [§4.2](#42-️-trường-thừa-cũng-bị-chặn--422))
- [ ] Xử lý lỗi không giả định toàn API dùng 422
      (xem [§7.4](#74-️-422-chỉ-áp-cho-endpoint-này-phần-còn-lại-của-api-vẫn-400))
- [ ] Gỡ ghi chú "backend có thể chưa triển khai" trong `apis/endpoints.ts` và
      `apis/theme.api.ts`

---

## 9. Ngoài phạm vi (giữ nguyên như đề xuất)

- **Giao diện mặc định cấp tổ chức** — khi làm, `source` chỉ cần thêm giá trị
  `"organization"`, FE không phải đổi cấu trúc. Cấu trúc response hiện tại đã
  chừa sẵn chỗ.
- **Tải ảnh nền riêng lên** — cần storage và kiểm duyệt ảnh.
- **Đồng bộ thời gian thực giữa thiết bị** — hiện chỉ đồng bộ giữa các tab cùng
  trình duyệt qua sự kiện `storage`.

---

## 10. Backend đã làm gì (để tra khi cần)

| Việc | Vị trí trong repo backend |
|---|---|
| Bảng + migration | `prisma/migrations/20260918000000_add_user_theme_preferences/` |
| Model | `prisma/schema.prisma` → `UserThemePreference` |
| Route | `src/modules/preferences/controllers/theme-preference.controller.ts` |
| Ràng buộc + Swagger | `src/modules/preferences/dto/theme-preference.dto.ts` |
| Mặc định hệ thống | `src/modules/preferences/theme.constants.ts` |
| 400 → 422 | `src/common/exceptions/validation-422.filter.ts` |

Swagger: `Preferences` tag trên `/api-docs`.
