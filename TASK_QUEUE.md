# Task Board & Vibe Kanban

> Quản lý tiến độ dự án (Tích hợp từ **vibe-kanban** & **planning-with-files**).
> Cập nhật trạng thái `[ ]` -> `[x]` khi hoàn thành nhiệm vụ.

---

## 📋 Backlog (Chờ thực hiện)
- [ ] Tích hợp Playwright MCP để tự động kiểm thử giao diện web (E2E testing).
- [ ] Tối ưu hóa hiệu năng bundle Vite và kiểm tra lazy load components.
- [ ] Kiểm tra toàn diện Responsive trên thiết bị di động (375px).

## 🔄 In Progress (Đang thực hiện)
- [ ] Hoàn thiện thêm các mẫu banner ưu đãi theo chương trình mới của cửa hàng.

## ✅ Done (Đã hoàn thành)
- [x] Tạo `GEMINI.md` với đầy đủ quy tắc: Think Before Coding, Surgical Changes, Token Saver, Taste & UI/UX.
- [x] Tích hợp toàn diện 30 công cụ/skills từ `claude-code-map` vào Antigravity (`.agents/skills/`).
- [x] Nâng cấp Giao diện mới (Modern Theme) sang nền sáng (Light Theme) cao cấp, độ tương phản sắc nét đạt chuẩn WCAG.
- [x] Thiết kế Banner Ưu Đãi toàn khung (Full-width) tại Dashboard, tự động chuyển ảnh mỗi 15 giây (kèm nút thủ công & chỉ số chấm tròn).
- [x] Thiết kế lưới sản phẩm Grid Card (Phương án 1) với chỉ số biến động giá % và biểu đồ Mini Sparkline.
- [x] Bỏ nút "Thêm đơn hàng" ở Dashboard, thay bằng nút "Theo dõi giá" và Modal xem chi tiết lịch sử giá các ngày trước đó.
- [x] Đổi tab "Quản lý tài khoản" thành "ADMIN" chia làm 3 phân hệ: Quản lý tài khoản, Quản lý ưu đãi (Upload banner từ máy tính), và Quản lý giá bán (đồng bộ kho hàng `inventory`).
- [x] Chạy kiểm thử thành công: 17/17 tests PASS, build production `npm run build` hoàn tất không lỗi.

---

## 📌 Ghi chú & Blockers
- Stack: React + TypeScript + Tailwind CSS + Supabase + Vite.
- Thiết kế: Giao diện mới (`modern`) sử dụng nền sáng hiện đại, độ tương phản cao, thẻ bo góc `rounded-2xl`, accent cam hổ phách. Giao diện cũ (`classic`) vẫn giữ nguyên nền tối.
