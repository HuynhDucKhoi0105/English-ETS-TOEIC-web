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

1. Vào <https://vercel.com>, đăng nhập bằng GitHub, chọn **Add New → Project** rồi **Import** repo này. Framework chọn **Other**, để nguyên các tuỳ chọn build.
2. Ở **Environment Variables**, thêm:
   - `MONGODB_URI`: chuỗi kết nối MongoDB Atlas (`mongodb+srv://…`). **Không bao giờ commit chuỗi này vào repo.**
   - `SYNC_KEY`: mật khẩu đồng bộ tự đặt, tối thiểu 12 ký tự. App sẽ hỏi mã này.
   - `MONGODB_DB` (tuỳ chọn): tên database, mặc định `english_lab`.
3. Bấm **Deploy**.
4. Trên MongoDB Atlas, vào **Network Access** và thêm `0.0.0.0/0`. Vercel không có IP cố định; database vẫn được bảo vệ bằng mật khẩu user và `SYNC_KEY`.
5. Mở web, vào tab **⚙️ Dữ liệu → ☁️ Đồng bộ đám mây**, nhập `SYNC_KEY`, rồi bấm **Lưu & kết nối**.

Từ đó tiến độ tự lưu lên MongoDB khoảng 5 giây sau mỗi thay đổi. Mở app ở máy khác sẽ tự tải bản mới nhất. Máy chủ giữ thêm 20 bản lưu cũ trong collection `progress_history`.

## API

`GET /api/progress` và `PUT /api/progress` với header `x-sync-key: <SYNC_KEY>`.
Body của PUT có dạng `{ data, base, force }`. Nếu trên mây đã có bản mới hơn `base` từ thiết bị khác, API trả `409`.
