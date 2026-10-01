# Belo AI

Website chat AI berdasarkan tampilan dasar Belo AI yang kamu kirim.

## Menjalankan di komputer

1. Install Node.js 20 atau lebih baru.
2. Salin `.env.example` menjadi `.env`.
3. Isi `OPENAI_API_KEY`.
4. Jalankan:

```bash
npm start
```

5. Buka `http://localhost:3000`.

## Deploy

Proyek ini adalah satu aplikasi Node.js yang melayani frontend dan backend sekaligus. Kamu bisa deploy ke layanan hosting Node.js yang mendukung environment variables.

Environment variables yang diperlukan:

- `OPENAI_API_KEY` = API key OpenAI kamu
- `OPENAI_MODEL` = default `gpt-5.6-luna`
- `PORT` = biasanya otomatis diisi oleh hosting

Jangan pernah menaruh API key di `public/app.js` atau HTML karena file tersebut bisa dilihat pengguna.

## Catatan

Belo AI menggunakan Responses API. Jika model default tidak tersedia pada akun kamu, ubah `OPENAI_MODEL` ke model yang tersedia di akunmu.
