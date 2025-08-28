const startBtn = document.getElementById('startBtn');
const stopBtn  = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const linksBox = document.getElementById('linksBox');

let running = false;
let workers = [];
let lastIndexes = [];

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function getLinks() {
  return linksBox.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function pickRandomIndex(len, avoid = -1) {
  if (len <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * len); }
  while (idx === avoid);
  return idx;
}

async function processOneLink(url, workerId) {
  log(`#${workerId} 開啟：${url}`);
  const win = window.open('about:blank', '_blank',"width=375,height=812,left=100,top=100");

  if (!win || win.closed) {
    log(`#${workerId} ⚠️ 無法開啟新分頁（可能被瀏覽器阻擋）`);
    return;
  }

  try {
    win.document.write(`
      <!doctype html><meta charset="utf-8">
      <title>載入中…</title>
      <body>即將開啟：<code>${escapeHtml(url)}</code></body>
    `);
    win.document.close();
  } catch {}

  try { win.location.href = url; } catch {}

  const wait1 = randInt(40, 65);
  log(`#${workerId} 等待 ${wait1}s 後跳轉到 google.com`);
  await sleep(wait1 * 1000);

  if (!running || win.closed) return;
  try { win.location.href = 'https://9mcasino.com/'; } catch {}

  const wait2 = randInt(60, 100);
  log(`#${workerId} 已跳轉到 google，等待 ${wait2}s 後關閉`);
  await sleep(wait2 * 1000);

  if (!running || win.closed) return;
  try { win.location.replace('about:blank'); } catch {}
  await sleep(600);

  try { win.close(); } catch {}
  if (win.closed) {
    log(`#${workerId} ✅ 已關閉分頁`);
  } else {
    log(`#${workerId} ⚠️ 關閉失敗，可能要手動關閉`);
  }
}

async function workerLoop(workerId) {
  const links = getLinks();
  while (running) {
    const idx = pickRandomIndex(links.length, lastIndexes[workerId] ?? -1);
    lastIndexes[workerId] = idx;
    const link = links[idx];

    await processOneLink(link, workerId);

    if (!running) break;
    const cooldown = randInt(3, 8);
    log(`#${workerId} 冷卻 ${cooldown}s 後挑下一個`);
    await sleep(cooldown * 1000);
  }
}

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  statusEl.textContent += `\n[${ts}] ${msg}`;
  statusEl.scrollTop = statusEl.scrollHeight;
}

function toggleButtons() {
  startBtn.disabled = running;
  stopBtn.disabled = !running;
}

startBtn.addEventListener('click', () => {
  if (running) return;
  statusEl.textContent = '執行中…';
  running = true;
  toggleButtons();

  const workerCount = 5; // 🔥 同時要跑幾個流程（可調整）
  workers = [];
  lastIndexes = new Array(workerCount).fill(-1);

  for (let i = 0; i < workerCount; i++) {
    workers.push(workerLoop(i + 1));
  }
});

stopBtn.addEventListener('click', () => {
  running = false;
  toggleButtons();
});

// --- 工具 ---
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}
