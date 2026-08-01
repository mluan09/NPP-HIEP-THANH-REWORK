# UPDATE.md

## Mục tiêu

Cập nhật chức năng của trang đăng nhập nhằm cải thiện trải nghiệm người
dùng, đảm bảo tuân thủ Semantic HTML, Accessibility và chuẩn bị dữ liệu
để thử nghiệm đăng nhập.

## 1. Cập nhật Form đăng nhập

-   Sử dụng thẻ `<form>` gốc của HTML.
-   Bên trong form có:
    -   Ô **Mã nhân viên** với `type="text"` và
        `autocomplete="username"`.
    -   Ô **Mật khẩu** với `type="password"` và
        `autocomplete="current-password"`.
-   Mỗi ô đều có `label` rõ ràng.

## 2. Nút đăng nhập

-   Dùng `<button type="submit">Sign in</button>`.
-   Nhấn **Enter** trong ô Mã nhân viên hoặc Mật khẩu phải submit form.

## 3. Hiện / Ẩn mật khẩu

-   Dùng `<button type="button">`.
-   Accessible name mặc định: **Show password**.
-   Chuyển `type="password"` ↔ `type="text"` khi bấm.
-   Cập nhật icon, `aria-label`, `aria-pressed`.
-   Không làm mất focus của ô mật khẩu.

## 4. Thuộc tính autocomplete

Giữ nguyên: - `autocomplete="username"` -
`autocomplete="current-password"`

Không được thay đổi vì đây là thuộc tính quan trọng giúp các Password
Manager nhận diện tài khoản.

## 5. Dữ liệu đăng nhập thử nghiệm

Tạo file dữ liệu mẫu, ví dụ:

``` json
[
  {"employeeId":"NV001","password":"123456"},
  {"employeeId":"NV002","password":"abcdef"},
  {"employeeId":"ADMIN","password":"admin123"}
]
```

Yêu cầu: - Chỉ dùng cho Development. - Không dùng xác thực thật. - Chưa
cần API, Database hoặc mã hóa mật khẩu.

## 6. Xử lý đăng nhập

-   Đọc dữ liệu từ file thử nghiệm.
-   So khớp Mã nhân viên và Mật khẩu.
-   Đúng → đăng nhập.
-   Sai → thông báo lỗi.
-   Nếu là SPA thì không reload trang.

## 7. Accessibility

-   Semantic HTML.
-   Label liên kết đúng với Input.
-   Có thể thao tác hoàn toàn bằng bàn phím.
-   Hỗ trợ Screen Reader.

## 8. Responsive

Hoạt động tốt trên Desktop, Tablet và Mobile.

## 9. Lưu ý

Thiết kế theo hướng dễ mở rộng để sau này thay bằng Backend API,
Database, JWT, Session/Cookie và phân quyền.

## 10. Thông báo thành công bằng Toast (Snackbar)

Sau khi người dùng thực hiện hành động thành công, hiển thị Toast
(Snackbar).

### Yêu cầu

-   Sử dụng `role="status"` kết hợp Live Region.
-   Hiển thị ở góc cố định, không che nội dung chính.
-   Tự động ẩn các thông báo không quan trọng sau khoảng 3--5 giây.
-   Nếu người dùng hover hoặc Toast có keyboard focus thì tạm dừng bộ
    đếm tự động ẩn.
-   Khi hover/focus kết thúc thì tiếp tục đếm thời gian.

### Accessibility

-   Không tự động cướp keyboard focus.
-   Hiệu ứng nhẹ nhàng.
-   Vị trí hiển thị nhất quán trên toàn website.

### Chỉ dùng cho

-   Đăng nhập thành công.
-   Lưu/Cập nhật/Xóa dữ liệu thành công.

Không dùng Toast cho lỗi nghiêm trọng hoặc yêu cầu xác nhận; hãy dùng
Dialog hoặc Modal.
