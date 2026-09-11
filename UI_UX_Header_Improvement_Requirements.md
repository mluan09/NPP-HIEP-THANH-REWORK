# Yêu cầu chỉnh sửa UI/UX giao diện

## 1. Mục tiêu

Refactor lại giao diện hiện tại theo hướng **trực quan, rõ ràng và gọn gàng hơn**, ưu tiên:

- Khả năng đọc và nhận biết thông tin.
- Phân cấp nội dung rõ ràng.
- Giảm các hiệu ứng khiến giao diện bị rối hoặc text bị chìm.
- Giữ nguyên toàn bộ chức năng hiện tại.
- Chỉ tập trung cải thiện UI/UX, CSS và cấu trúc layout nếu cần thiết.

---

## 2. Cải thiện độ rõ của tiêu đề và danh mục

### Vấn đề hiện tại

Một số phần text, đặc biệt là khu vực hiển thị **tiêu đề, danh mục và thông tin**, đang bị hiệu ứng nền, transparency, border hoặc shadow làm cho chữ có cảm giác bị **nhấn chìm vào khung giao diện**.

Điều này khiến:

- Text thiếu độ tương phản.
- Khó quan sát nội dung quan trọng.
- Hierarchy của giao diện chưa rõ ràng.
- Các thành phần UI dễ hòa lẫn vào background.

### Yêu cầu

- Tăng độ tương phản giữa text và background.
- Text phải luôn rõ ràng và dễ đọc.
- Các tiêu đề quan trọng cần có hierarchy rõ ràng bằng:
  - Font weight phù hợp.
  - Font size phù hợp.
  - Màu sắc có độ tương phản tốt.
- Không để `blur`, transparency hoặc background overlay làm giảm độ sắc nét của text.
- Hạn chế sử dụng quá nhiều:
  - Border.
  - Shadow.
  - Glass effect.
  - Transparency.
- Không để mọi component có cảm giác bị hòa lẫn vào background.

### Mục tiêu thiết kế

Giao diện cần có cảm giác:

> **Clean UI + Solid Surface + Clear Typography**

Ưu tiên sự rõ ràng và khả năng sử dụng hơn các hiệu ứng trang trí.

---

## 3. Loại bỏ hiệu ứng Liquid Glass khi cuộn trang

### Vấn đề hiện tại

Khi người dùng scroll lên hoặc xuống, khu vực header hoặc phần phía trên giao diện xuất hiện hiệu ứng giống:

- Liquid Glass.
- Glassmorphism.
- Blur background.
- Transparency thay đổi khi scroll.

Hiệu ứng này làm giao diện có cảm giác thiếu ổn định và khiến các nội dung phía sau ảnh hưởng đến khả năng đọc của header.

### Yêu cầu

Khi người dùng scroll:

- Header phải giữ giao diện ổn định.
- Không sử dụng Liquid Glass.
- Không sử dụng Glassmorphism khi sticky/fixed header được kích hoạt.
- Không sử dụng `backdrop-filter: blur()`.
- Không làm background header trở nên trong suốt quá mức.
- Không thay đổi opacity mạnh khi scroll.

### Hành vi mong muốn

#### Trạng thái bình thường

- Header có background rõ ràng.
- Thiết kế sạch sẽ và đồng nhất với giao diện.

#### Khi scroll

- Header vẫn giữ background solid.
- Không blur.
- Không transparency mạnh.
- Không có Liquid Glass effect.
- Có thể sử dụng:
  - Border nhẹ.
  - Shadow nhẹ.

Chỉ để tạo sự phân cách giữa header và nội dung phía dưới.

### Nguyên tắc

```text
NORMAL STATE
Header → Solid background

SCROLL STATE
Header → Solid background
       → No blur
       → No glass effect
       → Optional subtle shadow/border
```

---

## 4. Chỉnh lại vị trí nút Menu 3 gạch

### Vấn đề hiện tại

Nút menu hamburger (3 gạch) hiện đang:

- Bị lệch vị trí.
- Có một phần bị lòi ra ngoài khung header.
- Trông giống như đang đè lên header thay vì nằm trong header.
- Làm tổng thể bố cục thiếu gọn gàng.

### Yêu cầu

Nút menu phải:

- Nằm hoàn toàn bên trong khung header.
- Không có bất kỳ phần nào bị tràn ra ngoài.
- Được căn giữa theo chiều dọc của header.
- Có khoảng cách bên trái hợp lý.
- Đồng bộ spacing với các thành phần khác.
- Trông như một phần tự nhiên của header.

### Layout mong muốn

```text
┌─────────────────────────────────────────────────────────────┐
│  [ ☰ ]    Tạo Đơn Hàng Nhanh                    ADMIN  [A] │
└─────────────────────────────────────────────────────────────┘
```

### Không mong muốn

```text
      [ ☰ ]
┌─────────────────────────────────────────────────────────────┐
│       Tạo Đơn Hàng Nhanh                       ADMIN  [A]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Kiểm tra nguyên nhân gây tràn layout

Hãy kiểm tra toàn bộ CSS và layout liên quan đến nút menu.

Đặc biệt kiểm tra:

- `position: absolute`
- `position: fixed`
- `transform: translate()`
- Negative margin
- `top`
- `left`
- `right`
- `z-index`
- Chiều cao của button.
- Padding và margin.
- `overflow: visible`
- Border radius và shadow có làm element trông bị lòi ra ngoài hay không.

### Ưu tiên sử dụng Flexbox

Ưu tiên cấu trúc:

```css
display: flex;
align-items: center;
```

Thay vì sử dụng:

```css
position: absolute;
```

trừ khi thực sự cần thiết.

---

## 6. Cấu trúc Header được đề xuất

Header nên được tổ chức theo cấu trúc:

```text
Header
│
├── Left Section
│   ├── Menu Button
│   └── Page Title
│
└── Right Section
    ├── Role / Store Button
    └── User Avatar
```

### Layout logic

```text
┌───────────────────────────────────────────────────────┐
│ LEFT                                  RIGHT           │
│                                                       │
│ [☰]  Page Title                 Role Button   Avatar │
└───────────────────────────────────────────────────────┘
```

Sử dụng Flexbox để:

- Căn giữa các phần tử theo chiều dọc.
- Giữ spacing đồng nhất.
- Đảm bảo menu không bị overflow.
- Responsive tốt trên nhiều kích thước màn hình.

---

## 7. Kiểm tra Overflow

Sau khi chỉnh sửa, kiểm tra:

### Desktop

- Không có thành phần nào tràn khỏi header.
- Menu nằm hoàn toàn bên trong header.
- Text không bị cắt.
- Spacing đồng nhất.

### Tablet

- Header vẫn giữ bố cục hợp lý.
- Không bị overlap giữa title và user controls.

### Mobile

- Không xuất hiện horizontal scroll không cần thiết.
- Menu không bị tràn ra ngoài màn hình.
- Các thành phần có thể thu gọn hợp lý.
- Title không đè lên avatar hoặc các nút bên phải.

Có thể sử dụng:

```css
box-sizing: border-box;
max-width: 100%;
overflow-x: hidden;
```

khi phù hợp, nhưng không được dùng `overflow: hidden` chỉ để che lỗi layout. Cần sửa đúng nguyên nhân gây overflow.

---

## 8. Nguyên tắc UI/UX tổng thể

Hãy refactor giao diện theo các nguyên tắc sau:

### Typography

- Text rõ ràng.
- Không bị chìm vào background.
- Hierarchy rõ ràng giữa:
  - Page title.
  - Section title.
  - Label.
  - Value.
  - Secondary information.

### Background

- Ưu tiên solid background.
- Giảm transparency không cần thiết.
- Không lạm dụng Glassmorphism.

### Components

- Spacing nhất quán.
- Border radius đồng bộ.
- Shadow nhẹ và có mục đích.
- Không tạo cảm giác component bị nổi quá mức hoặc đè lên nhau.

### Header

- Luôn ổn định khi scroll.
- Không Liquid Glass.
- Không backdrop blur.
- Menu nằm hoàn toàn bên trong.

---

## 9. Yêu cầu quan trọng khi chỉnh sửa source code

Trước khi thực hiện chỉnh sửa:

1. Kiểm tra source code hiện tại.
2. Xác định chính xác component đang quản lý:
   - Header.
   - Menu hamburger.
   - Scroll behavior.
   - Glass/Liquid Glass effect.
3. Xác định CSS hoặc component đang gây ra overflow.
4. Không chỉnh sửa theo kiểu đoán mò.
5. Chỉ sửa sau khi xác định nguyên nhân.

---

## 10. Yêu cầu sau khi hoàn thành

Sau khi hoàn thành chỉnh sửa:

- Kiểm tra lại toàn bộ giao diện.
- Kiểm tra trạng thái trước khi scroll.
- Kiểm tra trạng thái khi scroll.
- Kiểm tra menu hamburger.
- Kiểm tra desktop.
- Kiểm tra tablet.
- Kiểm tra mobile.

### Checklist bắt buộc

- [ ] Text rõ ràng và không bị chìm vào background.
- [ ] Các danh mục và tiêu đề có hierarchy rõ ràng.
- [ ] Không còn Liquid Glass khi scroll.
- [ ] Không còn `backdrop-filter: blur()` gây hiệu ứng kính mờ khi scroll.
- [ ] Header có background solid và ổn định.
- [ ] Menu hamburger nằm hoàn toàn bên trong header.
- [ ] Không còn element bị lòi hoặc overflow khỏi header.
- [ ] Spacing và alignment đồng nhất.
- [ ] Không làm ảnh hưởng đến chức năng hiện tại.
- [ ] Responsive tốt trên desktop, tablet và mobile.

---

## 11. Mục tiêu cuối cùng

Thiết kế cuối cùng cần hướng đến:

> **Modern, Clean, Solid, Readable and Functional UI**

Ưu tiên:

**Usability > Readability > Visual Hierarchy > Decorative Effects**

Không cần thêm hiệu ứng phức tạp nếu hiệu ứng đó làm giảm trải nghiệm người dùng.
