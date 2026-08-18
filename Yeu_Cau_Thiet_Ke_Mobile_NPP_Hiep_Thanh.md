# Yêu cầu Tối ưu hóa Giao diện Mobile (Landscape Mode & UX/UI) - NPP Hiệp Thành

## 1. MỤC TIÊU DỰ ÁN
Tối ưu hóa toàn bộ giao diện và trải nghiệm người dùng (UX/UI) của website quản lý **NPP Hiệp Thành** trên thiết bị di động (Mobile), đặc biệt hỗ trợ tối đa cho **Chế độ xoay ngang màn hình (Landscape Mode)**. 

Mục tiêu cốt lõi:
- Xử lý triệt để việc giao diện bị rối, tràn màn hình hoặc khó thao tác tới lui trên điện thoại.
- Biến giao diện điện thoại xoay ngang thành một bảng điều khiển chuyên nghiệp dạng **Master-Detail (3 cột)** giống trên Tablet/iPad, giúp nhân viên/quản lý duyệt đơn và xử lý dữ liệu cực nhanh mà không cần chuyển trang liên tục.

---

## 2. YÊU CẦU THIẾT KẾ & BỐ CỤC (LAYOUT DESIGN)

### 2.1. Chế độ Xoay Ngang Mobile (Landscape Mode - `orientation: landscape`)
Khi người dùng xoay ngang điện thoại (hoặc màn hình từ 640px - 1024px chiều ngang nhưng chiều cao ngắn):

1. **Cấu trúc 3 Cột (Master-Detail Layout):**
   - **Cột 1 (Sidebar thu gọn / Mini Sidebar):**
     - Chiều rộng cố định: `60px - 72px`.
     - Chỉ hiển thị Icon chính (Trang chủ, Đơn hàng, Sản phẩm, Báo cáo, Cài đặt).
     - Cố định bên trái (`sticky` / `fixed`), có tooltip khi di chuột hoặc bấm giữ.
   - **Cột 2 (Danh sách thẻ / Grid Cards):**
     - Hiển thị danh sách Đơn hàng / Dữ liệu dạng **Grid Card 2 cột** (thay vì Bảng Table tràn ngang).
     - Cho phép cuộn dọc độc lập (`overflow-y: auto`).
     - Khi bấm vào 1 thẻ (Card), thẻ đó được highlight (đánh dấu active) và hiển thị chi tiết sang Cột 3.
   - **Cột 3 (Side Panel / Drawer Chi tiết):**
     - Chiều rộng: `320px - 380px` (chiếm khoảng 30-35% màn hình).
     - Cố định bên phải.
     - Hiển thị toàn bộ thông tin chi tiết của đơn hàng đang chọn: Thông tin khách hàng, Danh sách mặt hàng, Trạng thái thanh toán, Lịch sử tác vụ và Nút thao tác nhanh (Cập nhật, In đơn, Hủy).

2. **Thanh Header trên cùng (Compact Header):**
   - Thiết kế siêu gọn (chiều cao tối đa `44px - 48px`) để tiết kiệm không gian chiều cao của màn hình ngang.
   - Chứa: Logo NPP Hiệp Thành, Ô tìm kiếm nhanh (Quick search), Icon Thông báo, Profile.

---

### 2.2. Chế độ Dọc Mobile (Portrait Mode - `orientation: portrait`)
Khi xoay đứng điện thoại:
- **Bottom Navigation Bar:** Tự động chuyển Sidebar bên trái thành Thanh điều hướng dưới đáy màn hình (`fixed bottom-0`).
- **Data Table -> Card View:** Tự động chuyển toàn bộ Bảng dữ liệu thành dạng List Card 1 cột.
- **Bottom Sheet:** Khi bấm vào thẻ đơn hàng, mở một bảng vuốt từ dưới lên (Bottom Sheet) để xem chi tiết và thao tác.

---

## 3. QUY CHUẨN THAO TÁC & UX

1. **Nguyên tắc "Zero-Redirection" (Hạn chế chuyển trang tới lui):**
   - Người dùng phải xem được Chi tiết đơn hàng và thực hiện thay đổi trạng thái ngay tại màn hình hiện tại mà không cần chuyển sang trang `/orders/detail/123` rồi bấm Back quay lại.
2. **Kích thước vùng chạm (Touch Targets):**
   - Tất cả các nút bấm, ô input, selector phải có chiều cao tối thiểu `44px`.
   - Khoảng cách giữa các nút thao tác chính (`Cập nhật`, `Chi tiết`, `Xóa`) tối thiểu `8px`.
3. **Tối ưu Bàn phím & Input Type:**
   - Các trường nhập số lượng, đơn giá phải dùng `type="number"` hoặc `inputmode="numeric"` để hiển thị bàn phím số gọn nhẹ.
   - Dùng **Bottom Sheet** hoặc **Autocomplete Custom Dropdown** thay cho thẻ `<select>` mặc định của trình duyệt.

---

## 4. HƯỚNG DẪN KỸ THUẬT (TECHNICAL IMPLEMENTATION GUIDELINES)

### Tailwind CSS Responsive Breakpoints & Orientation Rules:
Sử dụng các class điều kiện xoay màn hình của Tailwind CSS:

```html
<!-- Cấu trúc Khung chính (Main Wrapper) -->
<div class="flex h-screen w-screen overflow-hidden bg-gray-100">
  
  <!-- Cột 1: Mini Sidebar (Hiện ở Landscape Mobile & Desktop) -->
  <aside class="hidden landscape:flex md:flex flex-col w-16 bg-slate-900 text-white p-2">
    <!-- Icon navigation -->
  </aside>

  <!-- Cột 2: Content / Card List -->
  <main class="flex-1 overflow-y-auto p-4">
    <div class="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-2 gap-4">
      <!-- Item Cards -->
    </div>
  </main>

  <!-- Cột 3: Detail Panel (Hiện khi chọn item ở Landscape) -->
  <section class="hidden landscape:block w-80 lg:w-96 bg-white border-l overflow-y-auto p-4">
    <!-- Detail Content -->
  </section>

  <!-- Bottom Nav (Chỉ hiện khi Portrait Mobile) -->
  <nav class="portrait:flex landscape:hidden md:hidden fixed bottom-0 left-0 right-0 bg-white border-t justify-around p-2">
    <!-- Bottom nav items -->
  </nav>

</div>
```

---

## 5. BẢNG CHECKLIST KIỂM THỬ (TESTING CHECKLIST)
Vui lòng kiểm tra lại hệ thống sau khi lập trình:
- [ ] Xoay ngang điện thoại: Màn hình không xuất hiện thanh cuộn ngang chính (`scroll-x`).
- [ ] Chọn 1 đơn hàng ở cột giữa -> Cột chi tiết bên phải cập nhật dữ liệu lập tức mà không reload trang.
- [ ] Chỉnh sửa trạng thái đơn hàng -> Danh sách ở cột giữa tự động cập nhật status badge (Đã thanh toán / Đang xử lý).
- [ ] Thử nghiệm trên cả iOS (Safari) và Android (Chrome) ở chế độ xoay ngang.

---
> **Ghi chú cho AI Developer:** Hãy giữ nguyên màu sắc thương hiệu chính của NPP Hiệp Thành (Xanh xanh lá / Xanh đen navy) và áp dụng thiết kế này trực tiếp vào các route quản lý đơn hàng, kho bãi, và báo cáo.
