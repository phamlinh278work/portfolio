# Portfolio v2 — 3D, tự chạy, quay video

Bản thử nghiệm song song với trang đang chạy (`../index.html`). Đã có trên GitHub Pages ở `/v2/`.

## Xem trên máy

```bash
cd "~/Job and CV/portfolio"
python3 -m http.server 8811
```

- Trang thường: http://localhost:8811/v2/
- Tiếng Việt: http://localhost:8811/v2/?lang=vi (hoặc bấm EN / VI trên thanh menu)
- Tự chạy như một bài thuyết trình (dùng khi phỏng vấn): http://localhost:8811/v2/?autoplay

Phải mở qua http (không mở thẳng file), vì trang dùng ES module.

## Quay video tự động (hiện không dùng)

Trang không cần video; công cụ vẫn để lại phòng khi cần:

```bash
python3 v2/tools/record.py portrait              # 1080×1920 cho TikTok / Reels (bố cục mobile)
python3 v2/tools/record.py landscape             # 1920×1080 cho LinkedIn / YouTube (bố cục desktop)
python3 v2/tools/record.py portrait --lang vi    # bản tiếng Việt
```

Video ra ở `v2/video/`. Script tự mở server, dùng đồng hồ ảo (mỗi khung tiến đúng 1/30 giây) nên video mượt dù máy chụp chậm. Một video khoảng 60 giây mất vài phút để quay.

## Cấu trúc

- `index.html` — nội dung song ngữ (`<span class="en">` / `<span class="vi">`)
- `css/site.css` — bảng màu E (ngọc trai · sâm panh), kính mờ, bố cục
- `js/scene.js` — lớp cánh hoa 3D (Three.js): cánh hoa thật cắt từ ảnh chụp. Bình thường cánh hoa bay PHÍA SAU nội dung; chỉ khi màn mở đầu tách ra hoặc khi đổi mục ở các phần không cần đọc (màn đầu, dự án, 3D, liên hệ) mới lướt ngang phía trước khoảng 3 giây
- `js/scene-procedural.js` — bản hoa dựng bằng hình học (cũ, không dùng)
- `js/main.js` — cuộn mượt (Lenis), chuyển động khi cuộn (GSAP ScrollTrigger), tường dự án 3D cong (bấm chấm để nhảy thẻ, bấm thẻ để xuống mục liên quan, nút "Xem tất cả" trải thẻ thành lưới), sơ đồ luồng hiện dần, lưới màn hình, khung phóng to ảnh (mọi ảnh có `data-zoom`), số chạy, menu mobile, chế độ `?autoplay` / `?record`
- Màn mở đầu: người xem thường chỉ thấy 2,5 giây, bấm/cuộn/gõ phím là bỏ qua, mỗi phiên chỉ chạy một lần. Bản `?autoplay` và video quay dùng bản dài 4,4 giây
- `assets/` — ảnh, sơ đồ luồng EN/VI (xuất từ Figma), video Phú Thọ đã nén
- `assets/bloom/` — cảnh quay mẫu đơn thật đã chỉnh màu: `intro-*` (màn mở đầu), `loop-*` (nền Hero và mục liên hệ), bản desk và mob, webm + mp4 + ảnh bìa
- `assets/petals/` — bộ 8 cánh hoa thật (hàng trên nét, hàng dưới mờ) và mặt nạ của chúng
- `tools/intro-frames/` — khung hình màn mở đầu, chỉ dùng khi quay video (không cần đưa lên mạng)
- `tools/record.py` — quay video
- KHÔNG còn dùng, có thể xoá: `assets/rose/`, `assets/intro/` (bông hồng cắt rời của bản trước); `assets/img/lh-autopilot-hero.jpg`, `sali-giao-an.jpg`, `sali-het-luot.jpg`, `sali-ket-qua.jpg`, `sali-soan-moi.jpg`, `sali-xoa.jpg` (không còn màn nào dùng)

## Nút "Tự chạy"

- Nằm trên thanh menu của cả `index.html` và `linhieu.html` (trên điện thoại chỉ còn biểu tượng ▶).
- Bấm là trang tự cuộn và tự diễn từ chỗ đang đứng; nền của nút đầy dần theo tiến độ. Cuộn, chạm, bấm vào trang hoặc gõ phím là dừng; bấm lại thì chạy tiếp từ chỗ đang đứng. Đang ở cuối trang mà bấm thì chạy lại từ đầu.
- Trang chính dùng chung danh sách điểm dừng với `?autoplay` (`tourStops()` trong `js/main.js`). Trang case study có bản riêng, gọn hơn, trong `js/case.js`.

## Trang case study

- `linhieu.html` — case study LinHiêu (bài toán, insight, phạm vi, ba quyết định, trợ lý thuật ngữ, hiện trạng). Dùng `css/site.css` + `css/case.css` và `js/case.js` (đổi ngôn ngữ, hiện dần khi cuộn, phóng to ảnh). Trang đọc tĩnh: không có cánh hoa, không ghim mục.
- Câu chữ lấy từ trang portfolio BA (`../index.html`, mục LinHiêu), phần "không làm" trong đặc tả, và brainstorm trợ lý thuật ngữ trong thư mục dự án `Translator & Audio`.
- Trên trang chính, hai thẻ LinHiêu dẫn sang trang này.

## Thứ tự nội dung (bản 16/11/2026)

Màn đầu → 4 dự án (LinHiêu trợ lý thuật ngữ, Khám phá Phú Thọ, Sali, LinHiêu dịch sách) → sơ đồ luồng (một ví dụ, lấy từ Sali) → lưới 10 màn → cách làm → dựng 3D → BA/PO → về tôi → kinh nghiệm → liên hệ.

Thư viện (bản cố định, tải từ jsDelivr): three 0.160.0, gsap 3.12.5, lenis 1.1.13.
Người xem bật "giảm chuyển động" (Reduce Motion) thì trang tắt cảnh 3D động, cuộn mượt và màn mở đầu.

## Khi script không chạy được

- Không có WebGL, hoặc thư viện 3D không tải được trong 5 giây: trang vẫn chạy đủ, chỉ thiếu cánh hoa.
- jsDelivr bị chặn, JavaScript tắt, hoặc mạng chậm quá 6 giây: trang hiện ở dạng tĩnh (lớp `plain` trên `<html>`), không có màn mở đầu, bốn dự án xếp thành lưới, mục lưới màn hình ẩn đi. Luật CSS nằm ngay dưới `[data-reveal]` trong `css/site.css`.
- Ảnh hiện khi dán link (LinkedIn, Zalo): `assets/og.jpg`, 1200×630. Thẻ `og:` trong hai trang trỏ tới địa chỉ GitHub Pages; đổi tên miền thì sửa ở đó.

## Trước khi đẩy lên mạng

- `assets/img/portrait.jpg` là ảnh cá nhân: đẩy lên GitHub Pages là công khai.

## Nguồn hình hoa (Pexels, giấy phép Free — dùng tự do, không bắt buộc ghi nguồn)

- Mẫu đơn desktop: https://www.pexels.com/video/8745309/
- Mẫu đơn điện thoại: https://www.pexels.com/video/close-up-of-white-peony-flowers-12210260/
- Cánh hoa: ảnh "Set of pink rose petals on white background" của Karola G (kaboompics.com) — https://www.pexels.com/photo/set-of-pink-rose-petals-on-white-background-4041281/

Đã xử lý: chỉnh màu về tông sâm panh (giảm xanh lá), cắt đoạn, làm vòng lặp xuôi–ngược, tách và đổi màu cánh hoa.
