# Portfolio v2 — 3D, tự chạy, quay video

Bản thử nghiệm song song với trang đang chạy (`../index.html`). Chưa commit, chưa đẩy lên GitHub Pages.

## Xem trên máy

```bash
cd "~/Job and CV/portfolio"
python3 -m http.server 8811
```

- Trang thường: http://localhost:8811/v2/
- Tiếng Việt: http://localhost:8811/v2/?lang=vi (hoặc bấm EN / VI trên thanh menu)
- Tự chạy như một bài thuyết trình (dùng khi phỏng vấn): http://localhost:8811/v2/?autoplay

Phải mở qua http (không mở thẳng file), vì trang dùng ES module.

## Quay video tự động

```bash
python3 v2/tools/record.py portrait              # 1080×1920 cho TikTok / Reels (bố cục mobile)
python3 v2/tools/record.py landscape             # 1920×1080 cho LinkedIn / YouTube (bố cục desktop)
python3 v2/tools/record.py portrait --lang vi    # bản tiếng Việt
```

Video ra ở `v2/video/`. Script tự mở server, dùng đồng hồ ảo (mỗi khung tiến đúng 1/30 giây) nên video mượt dù máy chụp chậm. Một video khoảng 60 giây mất vài phút để quay.

## Cấu trúc

- `index.html` — nội dung song ngữ (`<span class="en">` / `<span class="vi">`)
- `css/site.css` — bảng màu E (ngọc trai · sâm panh), kính mờ, bố cục
- `js/scene.js` — lớp cánh hoa 3D (Three.js): cánh hoa thật cắt từ ảnh chụp, bay có độ mờ nông sâu; tách ra khi màn mở đầu kết thúc và lướt qua mỗi lần đổi mục
- `js/scene-procedural.js` — bản hoa dựng bằng hình học (cũ, không dùng)
- `js/main.js` — cuộn mượt (Lenis), chuyển động khi cuộn (GSAP ScrollTrigger), tường dự án 3D cong, sơ đồ luồng hiện dần, số chạy, menu mobile, chế độ `?autoplay` / `?record`
- `assets/` — ảnh, sơ đồ luồng EN/VI (xuất từ Figma), video Phú Thọ đã nén
- `assets/bloom/` — cảnh quay mẫu đơn thật đã chỉnh màu: `intro-*` (màn mở đầu), `loop-*` (nền Hero và mục liên hệ), bản desk và mob, webm + mp4 + ảnh bìa
- `assets/petals/` — bộ 8 cánh hoa thật (hàng trên nét, hàng dưới mờ) và mặt nạ của chúng
- `tools/intro-frames/` — khung hình màn mở đầu, chỉ dùng khi quay video (không cần đưa lên mạng)
- `assets/rose/`, `assets/intro/` — bông hồng cắt rời của bản trước, KHÔNG còn dùng, có thể xoá
- `tools/record.py` — quay video

Thư viện (bản cố định, tải từ jsDelivr): three 0.160.0, gsap 3.12.5, lenis 1.1.13.
Người xem bật "giảm chuyển động" (Reduce Motion) thì trang tắt cảnh 3D động, cuộn mượt và màn mở đầu.

## Trước khi đẩy lên mạng

- `assets/img/portrait.jpg` là ảnh cá nhân: đẩy lên GitHub Pages là công khai.
- Nút "Get my CV" đang mở email xin CV; thay bằng file CV Product Designer khi có.

## Nguồn hình hoa (Pexels, giấy phép Free — dùng tự do, không bắt buộc ghi nguồn)

- Mẫu đơn desktop: https://www.pexels.com/video/8745309/
- Mẫu đơn điện thoại: https://www.pexels.com/video/close-up-of-white-peony-flowers-12210260/
- Cánh hoa: ảnh "Set of pink rose petals on white background" của Karola G (kaboompics.com) — https://www.pexels.com/photo/set-of-pink-rose-petals-on-white-background-4041281/

Đã xử lý: chỉnh màu về tông sâm panh (giảm xanh lá), cắt đoạn, làm vòng lặp xuôi–ngược, tách và đổi màu cánh hoa.
