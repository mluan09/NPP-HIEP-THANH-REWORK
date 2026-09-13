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
