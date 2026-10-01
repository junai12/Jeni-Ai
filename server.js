import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const API_KEY = process.env.OPENAI_API_KEY;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(body || "{}");
}

async function chat(req, res) {
  if (!API_KEY) {
    return send(res, 500, JSON.stringify({
      error: "Server belum dikonfigurasi. Tambahkan OPENAI_API_KEY di environment variables."
    }));
  }

  let data;
  try {
    data = await readJson(req);
  } catch {
    return send(res, 400, JSON.stringify({ error: "JSON tidak valid." }));
  }

  const messages = Array.isArray(data.messages) ? data.messages : [];
  const cleaned = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return send(res, 400, JSON.stringify({ error: "Pesan pengguna tidak ditemukan." }));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        instructions:
          "Kamu adalah Belo AI, asisten AI yang ramah, jelas, dan membantu. " +
          "Jawab dalam bahasa yang digunakan pengguna jika memungkinkan. " +
          "Jika informasi penting atau berisiko, sarankan pengguna memeriksa sumber tepercaya.",
        input: cleaned
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", result);
      return send(res, response.status, JSON.stringify({
        error: result?.error?.message || "Gagal mendapatkan jawaban dari AI."
      }));
    }

    return send(res, 200, JSON.stringify({
      content: result.output_text || "Maaf, Belo AI tidak menghasilkan jawaban."
    }));
  } catch (error) {
    console.error(error);
    return send(res, 502, JSON.stringify({
      error: "Tidak dapat terhubung ke layanan AI."
    }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/chat") {
      return await chat(req, res);
    }

    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      const file = await readFile(join(__dirname, "public", "index.html"));
      return send(res, 200, file, mime[".html"]);
    }

    if (req.method === "GET") {
      const safePath = req.url.split("?")[0].replace(/^\/+/, "");
      const file = join(__dirname, "public", safePath || "index.html");
      if (!file.startsWith(join(__dirname, "public"))) {
        return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      }
      const content = await readFile(file);
      return send(res, 200, content, mime[extname(file)] || "application/octet-stream");
    }

    return send(res, 405, JSON.stringify({ error: "Method tidak diizinkan." }));
  } catch {
    return send(res, 404, JSON.stringify({ error: "Halaman tidak ditemukan." }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Belo AI berjalan di http://localhost:${PORT}`);
});