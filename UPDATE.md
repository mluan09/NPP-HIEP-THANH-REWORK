# Cập nhật mới: Popup tìm kiếm trên Mobile

## Mục tiêu

Cải thiện trải nghiệm tìm kiếm trên thiết bị mobile: khi người dùng nhập
từ khóa trong popup tìm kiếm, các sản phẩm phù hợp phải tự động xuất hiện
để người dùng có thể chọn nhanh.

## Yêu cầu chức năng

- Popup tìm kiếm chỉ áp dụng cho giao diện mobile.
- Khi người dùng nhập hoặc thay đổi từ khóa, hệ thống tự động lọc và hiển
  thị các sản phẩm phù hợp trong popup; không yêu cầu nhấn nút tìm kiếm.
- Mỗi kết quả cần hiển thị thông tin đủ để nhận biết sản phẩm, gồm tối
  thiểu tên sản phẩm và ảnh đại diện; hiển thị giá nếu dữ liệu có sẵn.
- Người dùng có thể chạm vào một kết quả để chọn hoặc mở trang chi tiết
  sản phẩm.
- Hiển thị trạng thái phù hợp khi từ khóa trống và thông báo rõ ràng khi
  không có sản phẩm khớp từ khóa.

## Danh sách kết quả

- Ô nhập từ khóa luôn cố định ở phần trên của popup.
- Khi có nhiều sản phẩm vượt quá không gian hiển thị, chỉ danh sách kết
  quả được cuộn dọc.
- Người dùng có thể kéo lên/xuống mượt mà bằng thao tác cảm ứng để xem và
  chọn thêm sản phẩm.
- Danh sách không được làm popup tràn khỏi màn hình hoặc che khuất thao
  tác đóng popup.

## Accessibility

- Popup, ô tìm kiếm và danh sách kết quả phải có nhãn hoặc thuộc tính
  ARIA phù hợp.
- Có thể điều hướng đến và chọn kết quả bằng bàn phím khi sử dụng thiết
  bị hỗ trợ bàn phím.
- Kết quả đang được chọn hoặc focus phải có trạng thái trực quan rõ ràng.
- Người dùng luôn có thể tiếp tục nhập từ khóa hoặc đóng popup.

## Responsive

- Hoạt động tốt trên các kích thước màn hình mobile phổ biến.
- Vùng kết quả đáp ứng thao tác vuốt, không gây cuộn ngoài ý muốn cho
  trang nền khi người dùng đang xem danh sách sản phẩm.
