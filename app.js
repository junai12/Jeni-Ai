const chat = document.querySelector("#chat");
const form = document.querySelector("#form");
const input = document.querySelector("#input");
const send = document.querySelector("#send");
const historyEl = document.querySelector("#history");
const welcome = document.querySelector("#welcome");

let messages = JSON.parse(localStorage.getItem("belo_messages") || "[]");

function save() {
  localStorage.setItem("belo_messages", JSON.stringify(messages));
  renderHistory();
}

function renderHistory() {
  historyEl.innerHTML = "";
  const userMessages = messages.filter(x => x.role === "user").slice(-12).reverse();
  userMessages.forEach((m) => {
    const b = document.createElement("button");
    b.textContent = m.content;
    b.onclick = () => {
      input.value = m.content;
      input.focus();
    };
    historyEl.appendChild(b);
  });
}

function addBubble(role, text) {
  if (welcome) welcome.style.display = "none";
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function redraw() {
  chat.querySelectorAll(".message").forEach(x => x.remove());
  if (!messages.length && welcome) welcome.style.display = "";
  messages.forEach(m => addBubble(m.role, m.content));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = input.value.trim();
  if (!content || send.disabled) return;

  messages.push({ role: "user", content });
  save();
  addBubble("user", content);
  input.value = "";
  send.disabled = true;
  input.disabled = true;

  const loading = addBubble("assistant", "Belo AI sedang berpikir…");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
    loading.textContent = data.content;
    messages.push({ role: "assistant", content: data.content });
    save();
  } catch (err) {
    loading.textContent = `Gagal: ${err.message}`;
  } finally {
    send.disabled = false;
    input.disabled = false;
    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }
});

document.querySelector("#newChat").onclick = () => {
  messages = [];
  save();
  redraw();
  input.focus();
};

document.querySelector("#clear").onclick = () => {
  messages = [];
  save();
  redraw();
};

document.querySelector("#menu").onclick = () => {
  document.querySelector(".sidebar").style.display =
    getComputedStyle(document.querySelector(".sidebar")).display === "none" ? "flex" : "none";
};

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

renderHistory();
redraw();