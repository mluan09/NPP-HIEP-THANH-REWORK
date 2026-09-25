# Quy Tắc Hoạt Động Của AI (Project Rules & Agentic Engineering)

> Hợp nhất từ **AI_RULES.md**, **karpathy-skills**, **superpowers**, **ponytail**, **caveman**, **ECC** và **best-practice**.
> Tệp này được Antigravity tự động nạp vào mọi phiên làm việc để định hình hành vi và chất lượng code.

---

## 1. Think Before Coding (Suy nghĩ trước khi gõ)
- Trước khi viết bất kỳ dòng code nào, AI phải **nói rõ giả định** đang được đặt ra.
- Nếu yêu cầu **mơ hồ hoặc thiếu thông tin**, AI **phải hỏi lại** — tuyệt đối không đoán bừa.
- Định dạng xác nhận trước khi code:
  ```markdown
  Giả định:
  - [giả định 1]
  - [giả định 2]
  Nếu sai, hãy chỉnh lại trước khi tôi tiến hành.
  ```

---

## 2. Simplicity First (Tối giản trước)
- Viết **lượng code tối thiểu** đủ để giải quyết đúng vấn đề được yêu cầu.
- **Cấm** tự ý thêm tính năng, abstraction, hoặc cấu trúc không được yêu cầu (over-engineering).
- Tiêu chí: *"Yêu cầu có đề cập đến điều này không?"* — Nếu không → loại bỏ.

---

## 3. Surgical Changes (Thay đổi phẫu thuật)
- AI **chỉ được chạm vào đúng file và vùng code** liên quan trực tiếp đến yêu cầu.
- **Cấm** tự ý:
  - Dọn dẹp code không liên quan
  - Refactor toàn bộ file hoặc đổi cấu trúc ngoài phạm vi
  - Đổi tên biến / hàm không liên quan
  - Format lại toàn bộ code ngoài vùng thay đổi
- Nguyên tắc: *Chạm vào càng ít càng tốt — giải quyết triệt để vấn đề, không gây hồi quy (regression).*

---

## 4. Goal-Driven Execution & Verification (Thực thi theo mục tiêu & kiểm thử)
- Trước khi code, chốt tiêu chí hoàn thành:
  ```markdown
  Tiêu chí hoàn thành:
  - [ ] [tiêu chí 1]
  - [ ] [tiêu chí 2]
  ```
- Luôn kiểm tra kết quả (chạy test, build check `npx tsc --noEmit` hoặc kiểm tra giao diện).
- Báo cáo kết quả rõ ràng:
  ```markdown
  Đã hoàn thành. Kết quả kiểm tra:
  - [x] [tiêu chí 1] — PASS
  - [x] [tiêu chí 2] — PASS
  ```

---

## 5. Token Efficiency & Directness (Ponytail & Caveman)
- Tránh văn hoa rườm rà, giải thích dài dòng không cần thiết.
- Đi thẳng vào giải pháp và kết quả cụ thể. Tiết kiệm token tối đa cho context window.
- Giữ giao tiếp bằng Tiếng Việt thân thiện, súc tích và rõ ràng.

---

## 6. UI/UX & Aesthetics (UI/UX Pro Max & Taste Skill)
- Mọi thay đổi giao diện phải tuân thủ chuẩn:
  - Bảng màu hài hòa, có độ tương phản cao (WCAG ≥ 4.5:1), không dùng màu chói gắt.
  - Spacing có nhịp điệu (khoảng cách thoáng, đệm hợp lý), bo góc tinh tế (`rounded-xl`).
  - Đầy đủ trạng thái tương tác (`hover`, `active`, `focus-visible`, `loading`).
  - Responsive mượt mà trên cả Mobile (375px) và Desktop (1280px+).

---

## 7. Cross-Session Memory (Planning with Files)
- Mọi tính năng lớn hoặc cập nhật quan trọng phải được ghi nhận vào [UPDATE.md](file:///d:/BIN/PROJECT%20WEB/PRJ%20WEBSITE%20REWORK%20-%20Copy/UPDATE.md) và [TASK_QUEUE.md](file:///d:/BIN/PROJECT%20WEB/PRJ%20WEBSITE%20REWORK%20-%20Copy/TASK_QUEUE.md).
