# 📦 NPP Hiệp Thành — Hệ Thống Quản Lý Nhà Phân Phối

Ứng dụng web quản lý toàn diện dành cho **Nhà Phân Phối Hiệp Thành**, hỗ trợ vận hành bán hàng, kho hàng, công nợ và tài chính hàng ngày. Giao diện tối ưu cho cả **desktop** và **mobile/tablet**, dark mode mặc định.

---

## 🚀 Tính năng chính

| Module | Mô tả |
|--------|-------|
| **Tạo Đơn Hàng** | Tạo đơn bán hàng nhanh, chọn khách hàng, thêm sản phẩm, tính tổng tự động |
| **Kho Hàng** | Quản lý sản phẩm, theo dõi tồn kho, nhập/xuất, cảnh báo hàng sắp hết & hết hàng |
| **Khách Hàng** | Danh sách khách hàng, thông tin liên hệ, lịch sử giao dịch |
| **Quản Lý Công Nợ** | Theo dõi công nợ từng khách, ghi nhận thanh toán, lịch sử nợ |
| **Nhật Ký Thu Chi** | Ghi chép thu/chi hàng ngày, phân loại khoản mục, thống kê tài chính |
| **Quản Lý Tài Khoản** | Tạo/sửa/xóa tài khoản người dùng, phân quyền (owner, manager, staff) |
| **Nhật Ký Hoạt Động** | Ghi lại mọi thao tác của người dùng trên hệ thống |
| **Góp Ý & Báo Lỗi** | Kênh phản hồi để người dùng gửi góp ý hoặc báo lỗi |

## 🔐 Phân quyền

| Quyền | Owner | Manager | Staff |
|-------|:-----:|:-------:|:-----:|
| Tạo đơn hàng | ✅ | ✅ | ✅ |
| Kho hàng | ✅ | ✅ | ✅ |
| Khách hàng | ✅ | ✅ | ✅ |
| Công nợ | ✅ | ✅ | ✅ |
| Nhật ký thu chi | ✅ | ✅ | ❌ |
| Quản lý tài khoản | ✅ | ❌ | ❌ |
| Nhật ký hoạt động | ✅ | ❌ | ❌ |
| Góp ý & Báo lỗi | ✅ | ✅ | ✅ |

## 🛠️ Công nghệ

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend / DB:** Supabase (PostgreSQL, Auth, Realtime)
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Build:** Vite 8
- **Export:** SheetJS (xlsx) cho xuất Excel
- **Deploy:** Vercel

## 📱 Giao diện

- **Dark mode mặc định** — giao diện tối giảm mỏi mắt
- **Responsive** — tối ưu cho mobile, tablet và desktop
- **Touch-friendly** — menu hamburger, vùng chạm tối thiểu 40×40px
- **Glassmorphism** — hiệu ứng kính mờ cho card và panel
- **Skeleton loading** — placeholder khi tải dữ liệu
- **Focus visible** — hỗ trợ điều hướng bằng bàn phím

## ⚡ Cài đặt & Chạy

```bash
# Clone repo
git clone https://github.com/mluan09/NPP-HIEP-THANH-REWORK.git
cd NPP-HIEP-THANH-REWORK

# Cài dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY

# Chạy dev server
npm run dev

# Build production
npm run build
```

## 📂 Cấu trúc thư mục

```
src/
├── components/     # Shared UI components (Header, Sidebar, Toast, SearchInput, EmptyState, Skeleton, ...)
├── pages/          # Các trang chính (Sales, Inventory, Customers, Debts, Cashbook, Accounts, ...)
├── hooks/          # Custom React hooks
├── lib/            # Supabase client, DB functions, utilities
├── data/           # Static data
└── assets/         # Hình ảnh, tài nguyên tĩnh
```

## 📄 License

Private — Dành riêng cho NPP Hiệp Thành.