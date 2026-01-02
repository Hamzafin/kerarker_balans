const API_URL = "https://ТВОЙ_HTTPS_ДОМЕН/api/report/balance";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  document.documentElement.setAttribute("data-theme", tg.colorScheme === "dark" ? "dark" : "light");

  const btnColor = tg.themeParams?.button_color;
  if (btnColor) document.documentElement.style.setProperty("--accent", btnColor);
}

const $ = (id) => document.getElementById(id);

function rub(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("ru-RU").format(x) + " ₽";
}
function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 1600);
}
function normalize(s) { return (s || "").toString().toLowerCase().trim(); }

function sortItems(items, mode) {
  const arr = [...items];
  if (mode === "amount_asc") arr.sort((a,b)=>a.amount-b.amount);
  if (mode === "amount_desc") arr.sort((a,b)=>b.amount-a.amount);
  if (mode === "name_asc") arr.sort((a,b)=>a.name.localeCompare(b.name,"ru"));
  return arr;
}

function render(data) {
  const updated = new Date(data.updatedAt || Date.now());
  $("subtitle").textContent = "Обновлено: " + updated.toLocaleString("ru-RU");
  $("total").textContent = rub(data.total);

  const q = normalize($("search").value);
  const sortMode = $("sort").value;

  let items = (data.items || []).map(x => ({ name: x.name ?? "", amount: Number(x.amount ?? 0) }));
  if (q) items = items.filter(x => normalize(x.name).includes(q));
  items = sortItems(items, sortMode);

  const max = Math.max(1, ...items.map(x => x.amount));
  const wrap = $("items");
  wrap.innerHTML = "";

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "item";

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = it.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = Math.round((it.amount / max) * 100) + "%";
    meta.appendChild(bar);

    left.appendChild(name);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "amount right";
    right.textContent = rub(it.amount);

    row.appendChild(left);
    row.appendChild(right);
    wrap.appendChild(row);
  }
}

async function load() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData: tg?.initData || "" })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    render(data);
  } catch (e) {
    console.error(e);
    toast("Не удалось загрузить данные");
  }
}

$("search").addEventListener("input", load);
$("sort").addEventListener("change", load);
$("refreshBtn").addEventListener("click", () => { load(); toast("Обновлено"); });

load();
