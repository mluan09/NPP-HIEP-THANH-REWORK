# Đề xuất giao diện mới + bỏ nút sáng/tối

## 1. Tổng quan
- Giữ cố định dark mode, bỏ toggle trắng/tối.
- Menu Profile giữ mục GIAO DIỆN: Giao diện hiện tại / Giao diện mới.
- Giao diện mới theo hướng Extej: Sidebar + Hero Wallet + Top Tokens.

## 2. Bỏ nút nền trắng và tối
- Bỏ switch light/dark khỏi Header/Profile.
- Xóa logic ThemeContext, chỉ giữ dark.
- Lưu flag layout riêng, không dùng chung flag theme.
- Kiểm tra Header, Sidebar, BottomNav không vỡ layout khi xóa theme.

## 3. Menu Profile
- Hiện tại trong `src/components/Header.tsx`: Giao diện hiện tại / Giao diện mới.
- Map: hiện tại = layout cũ, mới = layout Extej.
- Lưu trong `src/hooks/usePersistedState.ts`.
- Giữ nguyên avatar, tên, vai trò, Đăng xuất.
- Ảnh tham khảo: dropdown ADMIN / Chủ Cửa Hàng / #ADMIN.

## 4. Giao diện mới

### 4.1 Sidebar
- Giữ: Markets, Trading, Wallet, Loans, Vaults, Portfolio, Swap.
- Bỏ khỏi PAGES: Menu Styles, Tables, Charts, Forms, Pricing, Modals/Pop-Ups.
- Chuyển nhóm UI ELEMENTS + DOCUMENTATION & SUPPORT xuống Settings / Dev only.
- Active Wallet màu cam rõ, giữ icon + mũi tên >.

### 4.2 Header
- Tăng contrast ô Search.
- Bỏ bell, mail thừa.
- Giữ avatar + tên + vai trò + trạng thái ví + mạng Bitcoin.
- File: `src/components/Header.tsx`.

### 4.3 Hero Wallet
- Thay dòng Welcome to Ordinals Wallet bằng số dư, địa chỉ ví, nút Restore / Create.
- Thu gọn ảnh NFT, làm carousel thay vì 3 ảnh lớn.
- Phân cấp CTA: Create Wallet primary cam đậm, Restore Wallet outline.
- File ảnh hưởng: `src/pages/*`, `src/assets/hero.png`.

### 4.4 Khối Pepe & Pepita
- Thêm sparkline Week Change, hiển thị -18.46% rõ.
- Thêm nút Buy / View Collection.
- Floor giữ màu cam: FLOOR 0.00100014 BTC.

### 4.5 Top Tokens (đổi tên từ Transactions)
- Đổi nhãn Transactions -> Top Tokens / Markets vì đây là danh sách token.
- Tabs ALL, DAO, XEN ECOSYSTEM, DEFI, GAMEFI, MEME: làm pill, active cam.
- Thêm sort Price, Market Cap, Volume [24H], Supply, Holders.
- Bảng: giá trị giữ trắng, chỉ % 24h/7d đỏ/xanh.
- Tách ngày khỏi cột Token, chuyển sang cột Updated riêng.
- Ví dụ dòng: ordi $7.29, VMPX $0.15, OXBT $0.06, Oshi $722.61, WHEE $0.29.
- Thêm phân trang, skeleton load, empty state.
- Mobile: table cuộn ngang, search + filter gọn.

## 5. File ảnh hưởng dự kiến
- `src/context/ThemeContext.tsx`: bỏ hoặc rút gọn.
- `src/components/Header.tsx`: bỏ toggle, giữ menu GIAO DIỆN.
- `src/components/Sidebar.tsx`: rút gọn PAGES.
- `src/components/BottomNav.tsx`: đồng bộ mobile.
- `src/hooks/usePersistedState.ts`: lưu layout.
- `src/pages/*`: hero + bảng token.

## 6. Bước tiếp theo
- Chốt giữ/bỏ mục sidebar.
- Chốt bỏ sáng/tối hoàn toàn.
- Triển khai layout mới sau khi chốt.

---

## 7. Cập nhật mới: Tab Dashboard (Home) Nền Sáng & Trung Tâm ADMIN

- **Banner Ưu Đãi Toàn Khung (15s Auto-Rotate)**:
  - Banner hiển thị toàn khung, tự động chuyển slide sau mỗi 15 giây.
  - Có nút điều hướng thủ công, chấm tròn indicators, tự dừng khi rê chuột.
- **Lưới Sản Phẩm Card Grid (Phương án 1) & Theo Dõi Giá**:
  - Từng thẻ sản phẩm hiển thị giá bán, badge biến động giá % (xanh lá/đỏ), biểu đồ Mini Sparkline đường sóng.
  - Thay thế nút "Thêm đơn hàng" thành **"Theo Dõi Giá Chi Tiết"**.
  - Modal xem lịch sử biến động giá theo ngày: biểu đồ xu hướng nhiều ngày trước đó và bảng nhật ký chi tiết.
- **Nâng Cấp Tab ADMIN (`/admin`)**:
  - Đổi tên tab "Quản Lý Tài Khoản" thành **"ADMIN"** dành cho Chủ Cửa Hàng (Owner).
  - Tích hợp 3 phân hệ:
    1. Quản lý tài khoản (phân quyền, khóa tài khoản).
    2. Quản lý ưu đãi (thêm/sửa/xóa, upload ảnh banner từ máy tính).
    3. Quản lý giá bán (điều chỉnh giá theo ngày, tự động đồng bộ vào kho hàng `inventory` và lưu vết vào `price_history`).
- **Nền Sáng Cho Giao Diện Mới (Light Theme)**:
  - Nền `#f4f6fa`, thẻ card `#ffffff` đổ bóng nhẹ, chữ đen than `#0f172a` và `#334155` đạt chuẩn WCAG tương phản cao.
  - Điểm nhấn cam rực rỡ `#ea580c` / `#f59e0b`. Giao diện cũ (`classic`) vẫn giữ nguyên nền tối mặc định.

