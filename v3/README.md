# Portfolio v3 — v2 cộng thêm một lớp chuyển động

Cùng nội dung, bảng màu (ngọc trai · sâm panh) và hoa mẫu đơn thật như v2. Thêm một lớp chuyển động mượn ý từ video portfolio motion-design (17/11/2026), đổi sang gu nhẹ nhàng của trang: không neon, không cạnh cứng, không cắt chữ.

## Chạy thử

```bash
cd portfolio            # thư mục chứa v2/ và v3/
python3 -m http.server 8830
# mở http://localhost:8830/v3/   (tiếng Việt: ?lang=vi, tự chạy: ?autoplay)
```

Phải mở qua http (không mở thẳng file) vì trang dùng ES module. v2 không bị đổi gì.

## Hiệu ứng mới (lấy ý từ video → bản của trang này)

| Từ video | Trong v3 |
|---|---|
| Chữ tiêu đề lớn + nét vẽ tay quanh "2025" | Tiêu đề hiện từng từ từ trong làn mờ; nét vẽ tay dưới cụm in nghiêng ở hero |
| Hai vòng cung phát sáng | Vòng quỹ đạo champagne có hạt ngọc trai quay chậm sau chân dung (hero) và quanh lời kêu gọi (liên hệ); xê dịch theo chuột và khi cuộn |
| Tiêu đề "Introduction" khổng lồ mờ sau thẻ kính | Chữ "Về tôi / About" khổng lồ sau thẻ kính ở mục Về tôi, trôi theo khi cuộn |
| Icon phần mềm trôi quanh thẻ + menu quỹ đạo "Selected Works" | Khối "Công cụ": 6 công cụ quay quanh viên ngọc trai; rê chuột/chạm để dừng và đọc dùng làm gì; cuộn nhanh thì quay nhanh; tự gọi tên từng công cụ khi chưa ai tương tác |
| Khung chat có dấu "đang gõ" | Mục "Hỏi nhanh": câu hỏi đầu tự chạy (gõ chữ → dấu ba chấm → câu trả lời gõ dần), 4 câu còn lại bấm để hỏi |
| Chữ "giải mã" | Nhãn nhỏ (eyebrow) các mục hiện qua hiệu ứng chữ xếp dần vào chỗ |
| Tường 3D nghiêng, camera bay qua | Lưới màn hình ở mục "Màn tôi đã vẽ" bắt đầu nghiêng như tường nhìn từ trên, tự phẳng lại khi tới nơi; tường dự án mờ nhẹ các thẻ ở xa (độ sâu trường ảnh) |
| — (đợt 2, sau nghiên cứu) | Cánh hoa 3D bị cuốn theo tay khi quét chuột (gió từ con trỏ, `js/scene.js`); đoạn dẫn và đoạn giới thiệu sáng dần từng từ khi đọc xuống; viền thẻ kính phát sáng vàng ngay chỗ con trỏ; đường vàng nối năm bước "Cách làm" và sáng từng số khi cuộn tới; ảnh trượt nhẹ trong khung (mục dựng 3D); nền đổi sắc theo từng mục; hero nhìn có chiều sâu theo chuột; chuyển trang sang case study mờ dần thay vì cắt (`@view-transition`) |
| Các poster nổi trên bức tường cong, hai bên mờ (17/11, theo ảnh Linh gửi) | **Màn tôi đã vẽ** (máy tính): 10 màn bay lên rồi xếp trên một bức tường cong 3D. Màn ở giữa nét, nổi lên, có viền sáng vàng và bóng phản chiếu dưới sàn; màn hai bên xoay vào và mờ dần. Cuộn thì cả dãy trượt qua từng màn (đoạn này được ghim lại), dừng giữa chừng thì tự về màn gần nhất. Bấm màn bên cạnh thì nó trượt vào giữa, bấm màn ở giữa thì mở ảnh lớn. Trên cùng là tên sản phẩm và số thứ tự "03 / 10", bên dưới là chú thích. Điện thoại vẫn giữ dạng lưới |
| — (17/11, Linh yêu cầu) | **Luồng**: trên máy tính, cả sơ đồ nằm vừa một màn hình, chữ ở cột trái, sơ đồ ở cột phải. Khi cuộn tới, sơ đồ tự vẽ: đường nối chạy từ ô này sang ô kia, có đốm sáng ở đầu đường. Mỗi ô nở ra kèm một vòng sáng khi đường chạm tới, rồi đến các đường nét đứt quay lại. Vẽ xong, vài đốm sáng nhỏ tiếp tục chạy dọc luồng chính. Rê chuột lên sơ đồ thì có kính lúp phóng to 2,5 lần để đọc chữ. Có nút "Vẽ lại luồng" |
| — (17/11, Linh: "quá nhiều chữ, muốn hình hoạ hơn") | **Cách làm**: mỗi bước có một hình nhỏ, tự vẽ khi đường vàng chạy tới, rồi chuyển động lặp nhẹ. 01: câu hỏi biến thành danh sách đã chốt, có người quyết. 02: luồng nhỏ có nhánh lỗi và đường quay lại, một đốm sáng chạy theo luồng chính. 03: trang tài liệu biến thành wireframe. 04: con trỏ bấm qua ba trạng thái lỗi → trống → mất mạng. 05: kính lúp soát giáo án hoặc sách thật, tìm ra dòng sai trong đặc tả rồi sửa xong. Mỗi bước chỉ còn tiêu đề và một dòng ngắn. Câu dài cũ đã bỏ, lấy lại được từ v2 nếu cần |
| — (17/11, Linh: "nhiều chữ quá, thích nhiều chuyển động") | **Luồng**: đoạn dẫn còn một câu. Mỗi chú thích loé sáng khi một ô cùng loại nở ra trong sơ đồ. Hai quy tắc "AI lỗi không trừ lượt" và "Rời trang luôn hỏi trước" thành hai thẻ có hình động, bật sáng khi sơ đồ vẽ tới đúng ô đó (ô lỗi thứ 3 và ô biên thứ 3 theo thứ tự trong file SVG). **BA/PO**: mỗi thẻ có hình động (kính VR mua vật phẩm, ba người học thi đua và 4 quốc gia sáng dần, lõi AI toả việc ra 6 quy trình), một con số lớn tự đếm (300 · 4 · đến 70%), mô tả chỉ hiện khi rê chuột. **Về tôi**: tiểu sử một câu, đường hành trình Tester 2022 → BA 2023 → PO 2025 — nay → Product designer (Sali · LinHiêu) có đốm sáng chạy; mỗi con số có chấm minh hoạ (46 chấm chia Sali 31 / LinHiêu 15, 28 ghim). **Nơi tôi đã làm**: biểu đồ thời gian từ cũ đến mới; vạch thời gian chạy theo cuộn, thanh dài ra, kết quả bật ra khi hết thời gian làm ở đó; tên dự án hiện khi rê chuột |
| — (17/11, Linh: hai mục bị trùng; chọn "gộp làm một") | Bỏ bức tường dự án cũ. Mục **Những dự án tôi tâm đắc** (`#screens`, có mốc `#work` để các đường dẫn cũ vẫn chạy) giờ là dãy màn hình 3D chia ba nhóm: LinHiêu trợ lý (01–06), LinHiêu dịch sách (07–08), Sali (09–10). Mỗi nhóm có thẻ tên dự án, kết quả và đường dẫn ở trên, đổi theo màn đang ở giữa. Phú Thọ vẫn ở mục Dựng 3D. Code tường cũ trong `main.js` thay bằng vài dòng giữ chỗ |
| — (17/11, Linh: "chỗ này tôi muốn thật hoặc 3D") | Ba thẻ BA/PO có cảnh **3D thật** (`js/bapo3d.js`, Three.js): kính VR có đồng xu bay vào viên đá quý; ba cột thi đua đổi người dẫn, huy chương theo người dẫn, bốn quốc gia sáng dần; lõi AI với sáu khối quy trình và các xung chạy dọc đường nối. Cảnh nghiêng theo chuột và chỉ chạy khi thẻ đang trên màn hình. Không có WebGL hoặc bật giảm chuyển động thì vẫn hiện hình SVG |
| — (bổ sung) | Thẻ kính nghiêng theo con trỏ kèm ánh sáng phản chiếu; nút hút nhẹ về phía chuột; vòng con trỏ đi theo chuột (chữ "Xem"/"Mở" trên ảnh và thẻ dự án); băng chữ chạy nhanh/chậm/đảo chiều theo tốc độ cuộn; thanh mục lục bên phải |

"Tự chạy" (`?autoplay` và nút trên thanh menu) có thêm hai điểm dừng: khối công cụ và khung chat.

## Đổi tên

Nơi tôi đã làm: đã thử ẩn tên thành "Công ty 1–5" rồi Linh quyết giữ tên thật (17/11). Chỗ đang làm vẫn ghi "Một tập đoàn" vì bảo mật.

Màn web trong dãy 3D (máy tính) nằm trong khung laptop: viền tối có camera, đế bàn phím bên dưới.


LumusAI → **LumiAI** trong `index.html` (3 chỗ trong nội dung, 5 lần xuất hiện cả EN lẫn VI). Chưa đổi ở: `v2/index.html`, `portfolio/index.html` (trang BA), `Lich_su_du_an.md`, `CV_LumusAI_BA.md` và các file CV/ôn tập `.docx` ở thư mục ngoài.

## Tệp

- `css/fx.css`, `js/fx.js` — toàn bộ lớp mới; `fx.js` nạp trước `main.js`, mỗi hiệu ứng bọc `safe()` nên một cái lỗi không kéo cả trang.
- `index.html` — thêm: con trỏ, thanh mục lục, vòng quỹ đạo, nét vẽ tay, khối công cụ (`#toolkit`), mục hỏi nhanh (`#ask`); thẻ "Công cụ" cũ trong lưới 4 thẻ được thay bằng khối quỹ đạo (còn 3 thẻ).
- `js/scene.js` — thêm gió từ con trỏ cho cánh hoa 3D (thêm `?debug` vào địa chỉ để xem mảng `window.__petals`).
- `js/main.js` — đợt 3 sửa thêm: báo `shots:ready` cho fx.js, bỏ mặt nạ quét cũ của sơ đồ luồng, đổi các điểm dừng tour ở mục luồng và mục màn hình, đưa `window.__lenis` ra ngoài. Trước đó sửa 3 chỗ nhỏ: phát sự kiện `intro:done` khi màn mở đầu xong, đặt `--blur` cho thẻ ở xa trên tường dự án, thêm hai điểm dừng cho tour.
- `linhieu.html` và các trang khác: giữ nguyên như v2 (chưa có lớp chuyển động mới).

## Cần Linh đọc lại (câu chữ do tôi soạn từ chính nội dung trang)

- 5 câu hỏi và câu trả lời trong chat (`QA` đầu mục "chat" của `js/fx.js`), mỗi câu có EN và VI.
- 6 dòng mô tả công cụ (thuộc tính `data-en` / `data-vi` của các nút trong `#orbit`). Dòng Blender ("dựng mô hình cho các cảnh 3D") là suy ra từ ghi chú rằng Linh dựng 3D bằng Three.js và Blender; nếu không đúng thì sửa.

## Kỹ thuật cần nhớ

- Không để GSAP động vào phần tử đang `display:none` (ví dụ từ của ngôn ngữ chưa hiện): GSAP gỡ phần tử ra rồi chèn lại trước *phần tử* anh em kế tiếp, làm mất dấu cách giữa các từ. Vì vậy tiêu đề chỉ animate ngôn ngữ đang hiện, ngôn ngữ kia để CSS (`.hs` / `.hs-in`).
- Sơ đồ luồng: fx.js nạp file SVG và chèn thẳng vào trang để vẽ từng đường; ảnh `<img>` gốc vẫn nằm trên cùng (trong suốt) để bấm mở ảnh lớn và để hiện khi không có JS. Đường nối trong file Figma là hình viền được tô kín, nên fx.js tự dựng lại đường tâm của từng đường. Figma xuất theo thứ tự: tiêu đề, rồi mọi đường nối, rồi các ô. **Nếu xuất lại sơ đồ từ Figma thì phải giữ thứ tự đó** (xuất cả khung một lần là được).
- Mọi ScrollTrigger của `fx.js` đặt `refreshPriority: -1` để đo vị trí sau khi tường dự án (pin) đã chiếm chỗ.
- `prefers-reduced-motion`: không tách chữ, không con trỏ, không nghiêng, chat hiện sẵn một lượt hỏi đáp; vòng quỹ đạo đứng yên.
- Quay video: `python3 v3/tools/record.py tiktok --lang vi` (chạy từ thư mục `portfolio`). Lệnh này cho ra file 1080×1920 với giao diện máy tính trong khung dọc, giữ được dãy màn hình 3D và sơ đồ tự vẽ. Ngoài ra có `portrait` (giao diện điện thoại) và `landscape` (1920×1080). `tools/intro-frames` là liên kết tới thư mục của v2, không chép thêm 13 MB. Công cụ quay giữ cả hình động SVG (`<animateMotion>`) theo đồng hồ ảo.
- Chỉ trong video quay (trang thật không đổi): mở đầu bằng banner "Portfolio *with Claude Code*" khoảng 3 giây. Clip Phú Thọ trong điện thoại chạy bằng ảnh tĩnh trong `tools/phutho-frames` (14 giây đầu, 15 khung/giây) vì trình duyệt không giao diện để video đen. Con trỏ được điều khiển theo kịch bản: quét nhẹ ở đầu trang, lướt ngang dãy màn hình (không mở ảnh lớn), kính lúp bám theo nét đang vẽ của sơ đồ flow.
- Bản TikTok cắt cảnh: `python3 v3/tools/record.py tiktok --reel 30` (hoặc `--reel 50`). Mở bằng sơ đồ flow đang vẽ với kính lúp và câu "From business rules to screens · Portfolio built with Claude Code". Sau đó cắt nhanh qua hero, dãy màn hình, 3D, BA/PO (bản 50 có thêm Cách làm và Kinh nghiệm), rồi kết bằng thẻ tên và link. Mỗi cảnh có một dòng chữ ở dải trên cùng. Cánh hoa vẫn giữ. Bản ngang 80 giây cho máy tính: `python3 v3/tools/record.py landscape --reel 80` (thêm About, Công cụ, Chat, chữ chú thích nhỏ hơn). Bản cuộn liền như bản 106 giây nhưng nhanh hơn (khoảng 72 giây): `python3 v3/tools/record.py landscape --pace 1.55`. Con trỏ, cuộn trang, sơ đồ flow và chat gõ chữ đều chạy nhanh theo; banner và phim mở đầu giữ nguyên.
