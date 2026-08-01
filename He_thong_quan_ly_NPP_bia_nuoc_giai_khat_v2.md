# HỆ THỐNG QUẢN LÝ PHÂN PHỐI BIA \& NƯỚC GIẢI KHÁT (HIỆP THÀNH) - KIẾN TRÚC TOÀN DIỆN

Đây là tài liệu đặc tả hệ thống (PRD \& Architecture) hoàn chỉnh nhất, bao trùm toàn bộ cơ sở dữ liệu, giao diện, thuật toán và quy trình triển khai dành cho dự án phân phối.

\---

## 1\. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

* **Mô hình**: Single Page Application (SPA) - Module hóa độc lập từng Trang (Code-Splitting).
* **Mục tiêu**: Xây dựng hệ thống quản lý kho, bán hàng, công nợ và thu chi đơn giản, dễ sử dụng cho một nhóm/NPP nhỏ dưới 20 người; ưu tiên thao tác nhanh, dữ liệu chính xác và dễ bảo trì, không xây dựng Dashboard phân tích phức tạp.
* **Môi trường**:

  * **Dev/Staging**: Supabase Free + Vercel (`.vercel.app`).
  * **Production**: Supabase + Vercel + Tên miền riêng.

\---

## 2\. TECH STACK (CÔNG NGHỆ CỐT LÕI)

* **Frontend Framework**: React 19 + TypeScript + Vite.
* **Routing \& Navigation**: `react-router-dom` v6+ (Sử dụng `lazy` \& `Suspense`).
* **State Management \& Data Fetching**: TanStack Query v5 (React Query) kết hợp Supabase JS Client.
* **UI/UX \& Styling**: Tailwind CSS v4 + Shadcn UI + Lucide Icons + Framer Motion (Animation).
* **Data Tables**: TanStack Table v8 (Cho phép Sort, Filter, Pagination, Virtualized Scroll).
* **Backend \& Database**: Supabase (PostgreSQL) + Auth (Row Level Security - RLS).
* **Xử lý tiện ích**:

  * `xlsx`: Xử lý Excel Import/Export.
  * `zod`: Validate form và dữ liệu đầu vào.
  * `date-fns`: Xử lý ngày tháng.

\---

## 3\. CẤU TRÚC CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (DATABASE SCHEMA)

Hệ thống được thiết kế tối giản cho NPP/nhóm dưới 20 người. Không xây dựng mô hình ERP hoặc quản trị doanh nghiệp phức tạp. Các bảng chính gồm:

```text
profiles
inventory
customers
sales
sale\_items
debts
cashbook
```

### 3.1. Bảng Người dùng (profiles)

```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full\_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('owner', 'manager', 'staff')) DEFAULT 'staff',
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2. Bảng Danh mục Kho hàng (inventory)

Sử dụng mô hình đơn giản:

```text
Tồn cuối = Tồn đầu + Tổng nhập - Tổng xuất
```

Không chia `import\_l1`, `import\_l2`, `import\_l3` nếu NPP chỉ có một nguồn nhập hoặc không cần phân biệt nhiều loại nhập.

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    sku VARCHAR(50) UNIQUE,
    product\_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost\_price DECIMAL(15, 2) DEFAULT 0,
    selling\_price DECIMAL(15, 2) DEFAULT 0,
    initial\_stock INT DEFAULT 0 CHECK (initial\_stock >= 0),
    import\_qty INT DEFAULT 0 CHECK (import\_qty >= 0),
    export\_qty INT DEFAULT 0 CHECK (export\_qty >= 0),
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Tồn kho hiện tại được tính:

```text
current\_stock = initial\_stock + import\_qty - export\_qty
```

Hệ thống phải hiển thị cảnh báo khi tồn kho thấp hơn `minimum\_stock` (nếu có cấu hình mức tồn tối thiểu).

### 3.3. Bảng Khách hàng (customers)

Tách thông tin khách hàng thành bảng riêng để không phải nhập lại tên và địa chỉ trong mỗi đơn hàng.

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    customer\_code VARCHAR(50) UNIQUE,
    customer\_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    notes TEXT,
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.4. Bảng Bán hàng (sales)

```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    seller\_id UUID REFERENCES profiles(id),
    customer\_id UUID REFERENCES customers(id),
    sale\_date DATE NOT NULL DEFAULT CURRENT\_DATE,
    status VARCHAR(50) CHECK (status IN ('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))
        DEFAULT 'DRAFT',
    total\_revenue DECIMAL(15, 2) DEFAULT 0,
    total\_cost DECIMAL(15, 2) DEFAULT 0,
    profit DECIMAL(15, 2) GENERATED ALWAYS AS (total\_revenue - total\_cost) STORED,
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Trạng thái đơn hàng:

```text
DRAFT       → Đang nhập/chưa xác nhận
CONFIRMED   → Đã xác nhận
COMPLETED   → Hoàn thành
CANCELLED   → Đã hủy
```

Chỉ khi đơn hàng được xác nhận theo quy trình nghiệp vụ, hệ thống mới cập nhật xuất kho.

### 3.5. Bảng Chi tiết đơn hàng (sale\_items)

```sql
CREATE TABLE sale\_items (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    sale\_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product\_id UUID REFERENCES inventory(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    selling\_price DECIMAL(15, 2) NOT NULL,
    cost\_price DECIMAL(15, 2) NOT NULL,
    subtotal\_revenue DECIMAL(15, 2) GENERATED ALWAYS AS (quantity \* selling\_price) STORED,
    subtotal\_cost DECIMAL(15, 2) GENERATED ALWAYS AS (quantity \* cost\_price) STORED
);
```

### 3.6. Bảng Công nợ (debts)

Công nợ được quản lý đơn giản theo khách hàng và đơn hàng.

```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    customer\_id UUID REFERENCES customers(id),
    sale\_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    total\_amount DECIMAL(15, 2) NOT NULL CHECK (total\_amount >= 0),
    paid\_amount DECIMAL(15, 2) DEFAULT 0 CHECK (paid\_amount >= 0),
    remaining\_debt DECIMAL(15, 2) GENERATED ALWAYS AS (total\_amount - paid\_amount) STORED,
    status VARCHAR(50) GENERATED ALWAYS AS (
        CASE
            WHEN (total\_amount - paid\_amount) <= 0 THEN 'PAID'
            ELSE 'PENDING'
        END
    ) STORED,
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Giao diện công nợ cần có:

```text
\[Tất cả] \[Còn nợ] \[Đã trả]
\[Tìm khách hàng...]
\[+ Thanh toán]
```

Khi khách hàng thanh toán:

```text
Nợ cũ
- Số tiền thanh toán
= Còn nợ
```

### 3.7. Bảng Nhật ký Thu Chi / Sổ Quỹ (cashbook)

```sql
CREATE TABLE cashbook (
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    code VARCHAR(50) UNIQUE,
    transaction\_date DATE NOT NULL DEFAULT CURRENT\_DATE,
    description TEXT NOT NULL,
    income DECIMAL(15, 2) DEFAULT 0,
    expense\_purchase DECIMAL(15, 2) DEFAULT 0,
    expense\_operation DECIMAL(15, 2) DEFAULT 0,
    expense\_other DECIMAL(15, 2) DEFAULT 0,
    total\_expense DECIMAL(15, 2) GENERATED ALWAYS AS (
        expense\_purchase + expense\_operation + expense\_other
    ) STORED,
    notes TEXT,
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.8. Tự động cập nhật tổng tiền đơn hàng

PostgreSQL Trigger tự động cập nhật `total\_revenue` và `total\_cost` của `sales` khi `sale\_items` được thêm hoặc thay đổi.

Lưu ý: Trigger cần xử lý đúng cả trường hợp `INSERT`, `UPDATE` và `DELETE`, sử dụng `OLD.sale\_id` khi xóa hoặc khi một dòng chi tiết được chuyển sang đơn hàng khác.

### 3.9. Cập nhật tồn kho an toàn khi xác nhận đơn

Không để Frontend tự quyết định hoàn toàn việc trừ tồn kho.

Khi xác nhận đơn hàng, nên gọi một PostgreSQL RPC/Function theo quy trình:

```text
Frontend
   ↓
confirm\_sale(sale\_id)
   ↓
Kiểm tra trạng thái đơn
   ↓
Kiểm tra tồn kho từng sản phẩm
   ↓
Nếu đủ hàng:
    Tạo/cập nhật sale\_items
    Tăng export\_qty
    Cập nhật trạng thái = COMPLETED
   ↓
Nếu thiếu hàng:
    Hủy toàn bộ giao dịch
    Thông báo lỗi
```

Mục tiêu là tránh trường hợp hai nhân viên cùng bán một sản phẩm và làm tồn kho bị âm ngoài ý muốn.

\---

## 4\. CẤU TRÚC THƯ MỤC PROJECT VÀ KIẾN TRÚC (ISOLATED PAGES)

```text
src/
├── app/
│   ├── routes.tsx
│   └── App.tsx
├── components/
│   ├── layout/
│   ├── ui/
│   └── shared/
├── hooks/
│   ├── useAuth.ts
│   ├── useInventory.ts
│   ├── useSales.ts
│   ├── useCustomers.ts
│   └── useDebts.ts
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── excel.ts
└── pages/
    ├── auth/
    ├── inventory/
    ├── customers/
    ├── sales/
    ├── debts/
    └── cashbook/
```

Mỗi module là một trang độc lập, nhưng dùng chung các component UI và logic cần thiết.

\---

## 5\. GIAO DIỆN VÀ CHỨC NĂNG CẢI TIẾN

### 5.1. Kho hàng

Trang Kho hàng cần có:

```text
\[Tìm tên sản phẩm / SKU...]

\[Tất cả] \[Sắp hết] \[Hết hàng]

Danh sách:
SKU | Tên sản phẩm | Đơn vị | Giá vốn | Giá bán | Tồn đầu | Nhập | Xuất | Tồn cuối
```

Công thức:

```text
Tồn cuối = Tồn đầu + Nhập - Xuất
```

Không cần Dashboard kho phức tạp.

### 5.2. Khách hàng

Trang Khách hàng:

```text
\[Tìm tên / SĐT...]

Mã KH | Tên | SĐT | Địa chỉ | Tổng mua | Còn nợ
```

Khi bấm vào khách hàng:

```text
Thông tin khách hàng
Lịch sử đơn hàng
Tổng tiền đã mua
Tổng đã thanh toán
Số tiền còn nợ
```

### 5.3. Tạo đơn hàng nhanh

Giao diện ưu tiên thao tác nhanh:

```text
KHÁCH HÀNG
\[Tìm và chọn khách hàng ▼]

SẢN PHẨM
\[Tìm sản phẩm / SKU...]

Danh sách sản phẩm:
Tên | Số lượng | Giá bán | Thành tiền

Tổng tiền
Đã trả
Còn nợ

\[ LƯU NHÁP ] \[ XÁC NHẬN ĐƠN ]
```

Hệ thống tự động lấy giá vốn hiện tại khi thêm sản phẩm vào đơn để lưu vào `sale\_items.cost\_price`.

### 5.4. Công nợ

Bộ lọc:

```text
\[Tất cả] \[Còn nợ] \[Đã trả]
\[Tìm khách hàng...]
```

Mỗi dòng hiển thị:

```text
Khách hàng | Tổng nợ | Đã trả | Còn nợ | Trạng thái | \[Thanh toán]
```

### 5.5. Tìm kiếm và lọc

Tất cả các bảng chính phải có tìm kiếm/lọc phù hợp:

```text
Kho:
- Tìm SKU
- Tìm tên sản phẩm
- Lọc sắp hết/hết hàng

Bán hàng:
- Tìm mã đơn
- Tìm khách hàng
- Lọc theo ngày
- Lọc trạng thái

Khách hàng:
- Tìm tên
- Tìm số điện thoại

Công nợ:
- Tìm khách hàng
- Lọc còn nợ/đã trả

Thu chi:
- Lọc theo ngày
- Lọc thu/chi
```

### 5.6. Phân quyền đơn giản

Chỉ sử dụng 3 vai trò:

```text
OWNER
MANAGER
STAFF
```

Quyền đề xuất:

|Chức năng|Owner|Manager|Staff|
|-|-|-|-|
|Xem kho|Có|Có|Có|
|Tạo đơn hàng|Có|Có|Có|
|Sửa/xóa sản phẩm|Có|Có|Không|
|Xem giá vốn|Có|Có|Không|
|Xem lợi nhuận|Có|Có|Không|
|Xem công nợ|Có|Có|Có|
|Thanh toán công nợ|Có|Có|Có|
|Thu chi|Có|Có|Không|
|Quản lý tài khoản|Có|Không|Không|

### 5.7. Không xây dựng Dashboard

Hệ thống **không có Dashboard phân tích riêng**.

Sau khi đăng nhập, người dùng có thể được đưa thẳng đến module phù hợp hoặc trang Bán hàng/Kho hàng tùy vai trò.

Mục tiêu là giao diện đơn giản, ít thành phần dư thừa và tập trung vào các thao tác:

```text
Nhập hàng
↓
Quản lý tồn kho
↓
Tạo đơn hàng
↓
Theo dõi công nợ
↓
Thu chi
```

\---

## 6\. THUẬT TOÁN \& PHƯƠNG THỨC HOẠT ĐỘNG

### 6.1. Cơ chế Realtime

Tiếp tục sử dụng Supabase Realtime theo từng module khi thực sự cần thiết.

Mỗi module có thể lắng nghe thay đổi dữ liệu liên quan và cập nhật TanStack Query Cache.

Khi rời khỏi trang:

```js
return () => supabase.removeChannel(channel)
```

Không cần bật Realtime cho mọi bảng nếu không có nhu cầu thực tế.

### 6.2. Quy trình tồn kho

```text
Nhập hàng
    ↓
Tăng import\_qty

Xác nhận đơn hàng
    ↓
Kiểm tra current\_stock
    ↓
Đủ hàng
    ↓
Tăng export\_qty
    ↓
Cập nhật tồn kho
```

Nếu không đủ hàng:

```text
Không cho xác nhận đơn
→ Thông báo sản phẩm thiếu
→ Không thay đổi dữ liệu kho
```

### 6.3. Quy trình công nợ

```text
Tạo đơn
    ↓
Tổng tiền
    ↓
Khách trả tiền
    ↓
paid\_amount
    ↓
remaining\_debt
    ↓
Nếu remaining\_debt <= 0
    → PAID
Nếu > 0
    → PENDING
```

### 6.4. Tính giá vốn và lợi nhuận

Khi tạo `sale\_items`, lưu lại `cost\_price` tại thời điểm bán.

```text
Doanh thu = quantity × selling\_price
Giá vốn = quantity × cost\_price
Lợi nhuận = Doanh thu - Giá vốn
```

Điều này giúp lịch sử lợi nhuận của đơn hàng không bị thay đổi khi giá vốn sản phẩm trong `inventory` thay đổi về sau.

### 6.5. Excel Import/Export

Giữ chức năng Excel nhưng đơn giản:

* Import danh sách sản phẩm.
* Import số lượng nhập kho.
* Export danh sách kho.
* Export lịch sử bán hàng.
* Export công nợ.

Khi Import:

```text
Đọc Excel
↓
Chuẩn hóa tên cột
↓
Preview dữ liệu
↓
Zod Validation
↓
Báo lỗi từng dòng
↓
Xác nhận
↓
Ghi Database
```

\---

## 7\. QUẢN LÝ PHÂN QUYỀN (AUTH \& SECURITY)

Tiếp tục sử dụng:

* Supabase Auth.
* Protected Routes.
* Row Level Security (RLS).
* RBAC với 3 role: `owner`, `manager`, `staff`.

Ngoài việc ẩn giao diện, **RLS phải được cấu hình ở Database** để người dùng không thể gọi API trực tiếp và truy cập dữ liệu vượt quyền.

Ví dụ:

```text
STAFF:
- Được xem sản phẩm và giá bán.
- Không được đọc cost\_price.
- Được tạo đơn.
- Không được xem profit.
- Không được quản lý tài khoản.

MANAGER:
- Được quản lý kho, bán hàng, khách hàng, công nợ.
- Được xem giá vốn và lợi nhuận.

OWNER:
- Toàn quyền.
```

\---

## 8\. QUY TRÌNH DEPLOYMENT THỰC TẾ

1. Khởi tạo Database trên Supabase.
2. Cấu hình Auth và RLS.
3. Tạo RPC/Function xử lý xác nhận đơn và cập nhật tồn kho an toàn.
4. Push code lên GitHub Private Repository.
5. Deploy Frontend lên Vercel.
6. Cấu hình Environment Variables bằng 1 file .env:

   * `VITE\_SUPABASE\_URL`
   * `VITE\_SUPABASE\_ANON\_KEY`
7. Kiểm tra phân quyền bằng tài khoản `owner`, `manager`, `staff`.
8. Kiểm tra các luồng quan trọng:

   * Tạo khách hàng.
   * Nhập hàng.
   * Tạo đơn.
   * Xác nhận đơn.
   * Trừ tồn kho.
   * Tạo công nợ.
   * Thanh toán công nợ.
   * Thu chi.
   * Import/Export Excel.

\---

## 9\. PHẠM VI PHIÊN BẢN ĐẦU TIÊN (MVP)

Phiên bản đầu tiên chỉ tập trung vào 6 nghiệp vụ chính:

```text
1. Đăng nhập \& phân quyền
2. Quản lý sản phẩm \& tồn kho
3. Quản lý khách hàng
4. Tạo và quản lý đơn hàng
5. Theo dõi \& thanh toán công nợ
6. Quản lý thu - chi
```

Các tính năng nâng cao như Dashboard, quản lý giao hàng, nhiều kho, nhà cung cấp nâng cao, kiểm kê chuyên sâu và Audit Log không nằm trong phạm vi MVP.

Mục tiêu của hệ thống là:

```text
ĐƠN GIẢN
    +
DỄ DÙNG
    +
DỮ LIỆU CHÍNH XÁC
    +
THAO TÁC NHANH
    +
PHÙ HỢP NHÓM DƯỚI 20 NGƯỜI
```

\---

## 10\. NGUYÊN TẮC THIẾT KẾ

* Không xây dựng hệ thống quá phức tạp so với quy mô sử dụng.
* Ưu tiên tốc độ thao tác của nhân viên.
* Giữ số lượng bảng Database ở mức tối thiểu cần thiết.
* Không xây dựng Dashboard nếu người dùng không có nhu cầu.
* Tính toán tồn kho và công nợ tự động.
* Các nghiệp vụ quan trọng phải được kiểm tra ở Database.
* Không để Frontend tự ý thay đổi tồn kho mà không qua quy trình xác nhận.
* Có tìm kiếm và lọc ở các bảng dữ liệu chính.
* Giao diện responsive, ưu tiên desktop nhưng có thể sử dụng trên tablet.
* Dễ mở rộng về sau nhưng không triển khai chức năng chưa cần thiết.

