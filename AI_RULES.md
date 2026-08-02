# Quy Tắc Làm Việc Với AI

## 1. Think Before Coding — Suy nghĩ trước khi code

- Trước khi viết bất kỳ dòng code nào, AI phải **nói rõ giả định** đang được đặt ra.
- Nếu yêu cầu **mơ hồ hoặc thiếu thông tin**, AI **phải hỏi lại** — tuyệt đối không được đoán bừa rồi code.
- Định dạng xác nhận bắt buộc trước khi code:
  ```
  Giả định:
  - [giả định 1]
  - [giả định 2]
  Nếu sai, hãy chỉnh lại trước khi tôi tiến hành.
  ```

---

## 2. Simplicity First — Tối giản trước

- Viết **lượng code tối thiểu** đủ để giải quyết đúng vấn đề được yêu cầu.
- **Cấm** tự ý thêm tính năng, abstraction, hoặc cấu trúc không được yêu cầu (over-engineering).
- Nếu thấy cơ hội cải tiến ngoài phạm vi yêu cầu, AI **phải hỏi trước** — không được tự ý làm.
- Câu hỏi kiểm tra trước khi thêm bất kỳ thứ gì:
  > *"Yêu cầu có đề cập đến điều này không?"* — Nếu không → bỏ đi.

---

## 3. Surgical Changes — Thay đổi phẫu thuật

- AI **chỉ được đụng vào đúng file và vùng code** liên quan trực tiếp đến yêu cầu.
- **Cấm** tự ý:
  - Dọn dẹp code không liên quan
  - Refactor toàn bộ file
  - Đổi tên biến / hàm không được yêu cầu
  - Format lại code ngoài vùng thay đổi
- Nguyên tắc: *Chạm vào càng ít càng tốt — đủ để fix, không hơn.*

---

## 4. Goal-Driven Execution — Thực thi theo mục tiêu

- Trước khi code, phải **chốt định nghĩa "Hoàn Thành"** với người dùng:
  ```
  Tiêu chí hoàn thành:
  - [ ] [tiêu chí 1]
  - [ ] [tiêu chí 2]
  ```
- AI **phải viết test** (unit test hoặc kiểm tra thủ công có ghi rõ bước) và **chạy pass test** mới được báo cáo hoàn thành.
- **Cấm** báo cáo "hoàn thành" khi chưa verify kết quả thực tế.
- Mẫu báo cáo hoàn thành bắt buộc:
  ```
  Đã hoàn thành. Kết quả kiểm tra:
  - [x] [tiêu chí 1] — PASS
  - [x] [tiêu chí 2] — PASS
  ```

---

## Tóm tắt nhanh

| # | Quy tắc | Hành động bắt buộc |
|---|---------|-------------------|
| 1 | Think Before Coding | Nói rõ giả định, hỏi lại nếu mơ hồ |
| 2 | Simplicity First | Code tối thiểu, không over-engineer |
| 3 | Surgical Changes | Chỉ đụng đúng vùng liên quan |
| 4 | Goal-Driven Execution | Chốt tiêu chí, test pass mới báo hoàn thành |