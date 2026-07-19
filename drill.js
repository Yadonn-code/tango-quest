"use strict";

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let drill = null;
let lastCount = 10;

const APP_URL = "https://yadonn-code.github.io/tango-quest/";

// ---------- シェア（スマホは共有シート、PCはクリップボードコピー） ----------
async function shareOrCopy(text, btn) {
  const full = `${text}\n${APP_URL}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: full });
      return;
    } catch (e) {
      if (e.name === "AbortError") return; // ユーザーがキャンセルしただけ
    }
  }
  try {
    await navigator.clipboard.writeText(full);
    const old = btn.textContent;
    btn.textContent = "✅ コピーした！貼り付けて共有してね";
    setTimeout(() => { btn.textContent = old; }, 2000);
  } catch (e) {
    window.prompt("この内容をコピーして共有してね", full);
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}

// count: 出題数（数値）または "all"（エンドレス）。pool を渡すと復習モード（その単語だけ出題）
function startDrill(count, pool) {
  const src = pool && pool.length ? pool : WORDS;
  if (!pool) lastCount = count;
  drill = {
    endless: count === "all",
    queue: shuffle(src),
    total: count === "all" ? Infinity : Math.min(count, src.length),
    i: 0,
    ok: 0,
    ng: 0,
    misses: [],
    revealed: false,
    current: null,
  };
  showScreen("drill-play");
  nextWord();
}

function nextWord() {
  if (!drill.endless && drill.i >= drill.total) {
    showResult();
    return;
  }
  // エンドレスで一周したら混ぜ直す
  if (drill.i > 0 && drill.i % drill.queue.length === 0) drill.queue = shuffle(drill.queue);
  drill.current = drill.queue[drill.i % drill.queue.length];
  drill.revealed = false;
  const totalLabel = drill.endless ? "∞" : drill.total;
  $("drill-stats").textContent = `Q ${drill.i + 1}/${totalLabel}　⭕ ${drill.ok}　❌ ${drill.ng}`;
  $("drill-word").textContent = drill.current.en;
  $("drill-answer").classList.add("hidden");
  $("btn-reveal").classList.remove("hidden");
  $("drill-judge").classList.add("hidden");
}

function reveal() {
  if (!drill || drill.revealed) return;
  drill.revealed = true;
  const ans = $("drill-answer");
  ans.textContent = drill.current.ja;
  ans.classList.remove("hidden");
  $("btn-reveal").classList.add("hidden");
  $("drill-judge").classList.remove("hidden");
}

function judge(isOk) {
  if (!drill || !drill.revealed) return;
  if (isOk) {
    drill.ok++;
  } else {
    drill.ng++;
    if (!drill.misses.includes(drill.current)) drill.misses.push(drill.current);
  }
  drill.i++;
  nextWord();
}

function showResult() {
  const total = drill.ok + drill.ng;
  const acc = total ? Math.round((drill.ok / total) * 100) : 0;
  let title;
  if (total === 0) title = "👋 また来てね";
  else if (acc === 100) title = "👑 パーフェクト！";
  else if (acc >= 80) title = "🏆 かなり覚えてる！";
  else if (acc >= 50) title = "⚔️ あと一歩！";
  else title = "🩹 のびしろしかない";
  $("result-title").textContent = title;
  drill.lastResult = { title, total, acc };
  $("result-stats").innerHTML = `${total}問 中 ⭕ ${drill.ok} ／ ❌ ${drill.ng}（正答率 ${acc}%）`;
  const missBox = $("miss-box");
  const reviewBtn = $("btn-review");
  if (drill.misses.length) {
    missBox.classList.remove("hidden");
    $("miss-list").innerHTML = drill.misses
      .map((w) => `<div class="miss-row"><b>${w.en}</b><span>${w.ja}</span></div>`)
      .join("");
    reviewBtn.classList.remove("hidden");
    reviewBtn.textContent = `❌の${drill.misses.length}語だけ復習する`;
  } else {
    missBox.classList.add("hidden");
    reviewBtn.classList.add("hidden");
  }
  showScreen("drill-result");
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".drill-count").forEach((b) => {
    b.onclick = () => startDrill(b.dataset.count === "all" ? "all" : Number(b.dataset.count));
  });
  $("btn-reveal").onclick = reveal;
  $("btn-ok").onclick = () => judge(true);
  $("btn-ng").onclick = () => judge(false);
  $("btn-quit").onclick = () => showResult();
  $("btn-review").onclick = () => startDrill(drill.misses.length, drill.misses.slice());
  $("btn-again").onclick = () => startDrill(lastCount);
  $("btn-share-result").onclick = (e) => {
    const r = (drill && drill.lastResult) || { title: "", total: 0, acc: 0 };
    shareOrCopy(
      `『Jと戸塚からの体罰を避けろ』一問一答モード\n${r.total}問やって正答率${r.acc}%！ ${r.title}`,
      e.currentTarget
    );
  };

  document.addEventListener("keydown", (e) => {
    if (!drill || !$("drill-play").classList.contains("active")) return;
    if (!drill.revealed && (e.code === "Space" || e.code === "Enter")) {
      e.preventDefault();
      reveal();
    } else if (drill.revealed && (e.key === "1" || e.key.toLowerCase() === "o")) {
      judge(true);
    } else if (drill.revealed && (e.key === "2" || e.key.toLowerCase() === "x")) {
      judge(false);
    }
  });
});
