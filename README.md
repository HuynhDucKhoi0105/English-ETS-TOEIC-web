# English-ETS-TOEIC-web

**English Lab — TOEIC 800+ & IT**: web học TOEIC chạy trong một trang HTML (`English-Lab.html`). Có thêm API nhỏ để đồng bộ tiến độ lên MongoDB.

- Từ vựng TOEIC ~2.270 từ (lặp lại ngắt quãng, paraphrase, collocation) và bộ IT riêng ~1.050 từ
- Ngữ pháp Part 5 ~630 câu, có lời giải logic và phân tích offline từng bước (không cần AI)
- Listening Part 1–4 (giọng đọc của trình duyệt), Reading Part 6–7 (có bài 3 đoạn)
- 4 đề thi thử đủ 200 câu theo format ETS mới, quy đổi điểm ước tính, sổ câu sai, ưu tiên theo điểm yếu
- Phiếu chấm đề sách / đề web (mở được MP3), link luyện đề Zenlish và ETS
- AI tuỳ chọn: Gemini, Groq, OpenRouter (key do người dùng tự nhập, chỉ lưu trong trình duyệt)

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `English-Lab.html` | Toàn bộ app (dữ liệu nhúng sẵn). Mở trực tiếp bằng trình duyệt cũng chạy được. |
| `api/progress.js` | API đồng bộ tiến độ (Vercel Serverless Function, Node, MongoDB) |
| `vercel.json` | Trang chủ `/` trỏ tới `English-Lab.html` |
| `manifest.webmanifest`, `sw.js`, `icon*` | Cài lên điện thoại như app (PWA), mở được khi mất mạng |
| `data/` | Dữ liệu nguồn dạng txt/json (đã nhúng vào HTML) |

## Deploy lên Vercel (miễn phí)

1. Import repo này vào Vercel (Framework: **Other**) hoặc chạy `vercel --prod` trong thư mục repo.
2. Thêm Environment Variables:
   - `MONGODB_URI`: chuỗi kết nối MongoDB Atlas (`mongodb+srv://…`). **Không commit chuỗi này vào repo.**
   - `AUTH_SECRET` (nên có): chuỗi ngẫu nhiên dài, dùng để ký token đăng nhập.
   - `MONGODB_DB` (tuỳ chọn): tên database, mặc định `english_lab`.
3. Trên MongoDB Atlas, vào **Network Access** và thêm `0.0.0.0/0`, vì Vercel không có IP cố định.

## Tài khoản & đồng bộ

- Mỗi người mở cùng một link, tự **tạo tài khoản** bằng tên và mật khẩu. Tên đã tồn tại thì phải chọn tên khác. Mật khẩu được băm bằng scrypt.
- Tiến độ lưu riêng theo tài khoản (collection `progress`), tự lưu khoảng 5 giây sau mỗi thay đổi. Mỗi người có 20 bản lưu cũ trong `progress_history`.
- Đăng nhập ở máy khác sẽ tự tải tiến độ về. Khi 2 máy cùng sửa, app hỏi nên giữ bản nào.
- Có thể dùng không cần tài khoản; khi đó tiến độ chỉ lưu trong trình duyệt.

## API

| Route | Mô tả |
|---|---|
| `POST /api/auth` | `{action:'register'\|'login'\|'password', user, pass, newPass}` → `{token}` |
| `GET /api/progress` | Tải tiến độ (header `Authorization: Bearer <token>`) |
| `PUT /api/progress` | Lưu `{data, base, force}`. Nếu trên mây có bản mới hơn `base` thì trả `409`. |
