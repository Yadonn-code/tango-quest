"use strict";

const MAX_HP = 100;
const Q_PER_STAGE = 10;
const SAVE_KEY = "tangoQuestSaveV1";

const STAGES = [
  { name: "はじまりの草原", icon: "🌱", theme: "grass",  intro: "冒険のはじまり。まずは肩ならしだ。" },
  { name: "まちがいの森",   icon: "🌲", theme: "forest", intro: "道に迷いそうな深い森。Jの気配がする……" },
  { name: "忘却の洞窟",     icon: "🦇", theme: "cave",   intro: "暗くて足元が見えない。覚えた単語まで忘れそうだ。" },
  { name: "吹雪の雪山",     icon: "🏔️", theme: "snow",   intro: "極寒の山。戸塚の拳がうなりを上げている。" },
  { name: "最終決戦・魔王城", icon: "🏰", theme: "castle", intro: "ここを越えれば単語マスター。全力で駆け抜けろ！" },
];

const DIFFS = {
  easy:   { key: "easy",   name: "イージー", jDmg: 10, tDmg: 20, saves: [1, 2, 3, 4, 5] },
  normal: { key: "normal", name: "ノーマル", jDmg: 15, tDmg: 35, saves: [1, 3, 5] },
  hard:   { key: "hard",   name: "ハード",   jDmg: 30, tDmg: 60, saves: [1] },
};

const ATTACKERS = {
  j: {
    key: "j", name: "J", face: "😎",
    hitLines: ["Jのパンチ！", "Jのジャブが刺さる！", "J「単語くらい覚えろよ」"],
  },
  totsuka: {
    key: "totsuka", name: "戸塚", face: "👹",
    hitLines: ["戸塚の鉄拳！！", "戸塚のフルスイング！！", "戸塚「その程度か？」"],
  },
};

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let state = null;

// ---------- サウンド（WebAudio） ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
}
function beep(freq, dur, type, vol, delay) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + (delay || 0);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol || 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}
const sfx = {
  correct() { beep(880, 0.1, "square", 0.07); beep(1318, 0.18, "square", 0.07, 0.09); },
  punchJ()  { beep(160, 0.18, "sawtooth", 0.2); beep(90, 0.22, "square", 0.2, 0.03); },
  punchT()  { beep(70, 0.35, "sawtooth", 0.3); beep(50, 0.4, "square", 0.3, 0.08); beep(40, 0.5, "sawtooth", 0.25, 0.16); },
  dead()    { [392, 330, 262, 196, 131].forEach((f, i) => beep(f, 0.25, "triangle", 0.15, i * 0.22)); },
  save()    { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.15, "triangle", 0.1, i * 0.1)); },
  clear()   { [523, 659, 784].forEach((f, i) => beep(f, 0.12, "square", 0.1, i * 0.1)); },
};

// ---------- 画面切り替え ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  $("hud").classList.toggle("hidden", id !== "screen-quiz");
}
function setTheme(cls) {
  document.body.className = cls;
}

// ---------- セーブデータ ----------
function readSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && DIFFS[d.diffKey] && d.saveStage >= 1 && d.saveStage <= STAGES.length) return d;
  } catch (e) { /* 壊れたセーブは無視 */ }
  return null;
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ diffKey: state.diff.key, saveStage: state.saveStage })); } catch (e) {}
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

// ---------- タイトル ----------
function initTitle() {
  setTheme("theme-title");
  const save = readSave();
  const btn = $("btn-continue");
  if (save) {
    btn.classList.remove("hidden");
    btn.textContent = `つづきから（${DIFFS[save.diffKey].name}・ステージ${save.saveStage} 🚩）`;
  } else {
    btn.classList.add("hidden");
  }
  showScreen("screen-title");
}

// ---------- ゲーム開始 ----------
function startGame(diffKey, startStageNo) {
  state = {
    diff: DIFFS[diffKey],
    stage: startStageNo,
    saveStage: startStageNo,
    hp: MAX_HP,
    used: new Set(),
    qs: [],
    qi: 0,
    stageCorrect: 0,
    stats: { correct: 0, wrong: 0, jHits: 0, tHits: 0, deaths: 0 },
  };
  writeSave();
  $("dmg-j").textContent = `-${state.diff.jDmg}`;
  $("dmg-t").textContent = `-${state.diff.tDmg}`;
  goMap(startStageNo > 1 ? "🚩 セーブポイントから再開！" : "さあ、単語の冒険に出発だ！");
}

// ---------- マップ ----------
function goMap(msg) {
  setTheme("theme-map");
  renderMap();
  const st = STAGES[state.stage - 1];
  $("map-msg").innerHTML = (msg ? msg + "<br>" : "") + st.intro;
  $("btn-start-stage").textContent = `${st.icon} ステージ${state.stage}「${st.name}」へ`;
  showScreen("screen-map");
}
function renderMap() {
  $("map-title").textContent = `冒険マップ（${state.diff.name}）`;
  const path = $("map-path");
  path.innerHTML = "";
  STAGES.forEach((s, i) => {
    const n = i + 1;
    const node = document.createElement("div");
    node.className = "map-node" + (n < state.stage ? " cleared" : n === state.stage ? " current" : " locked");
    node.innerHTML =
      `<div class="node-icon">${s.icon}</div>` +
      `<div class="node-no">STAGE ${n}</div>` +
      `<div class="node-name">${s.name}</div>` +
      `<div class="node-mark">${state.diff.saves.includes(n) ? "🚩" : ""}${n < state.stage ? "✅" : ""}${n === state.stage ? "🚶" : ""}</div>`;
    path.appendChild(node);
    if (n < STAGES.length) {
      const arrow = document.createElement("div");
      arrow.className = "map-arrow";
      arrow.textContent = "▶";
      path.appendChild(arrow);
    }
  });
}

// ---------- ステージ・出題 ----------
function startStage() {
  const st = STAGES[state.stage - 1];
  setTheme("theme-" + st.theme);
  state.qs = makeQuestions();
  state.qi = 0;
  state.stageCorrect = 0;
  showScreen("screen-quiz");
  updateHud();
  showQuestion();
}
function makeQuestions() {
  let pool = WORDS.filter((w) => !state.used.has(w.en));
  if (pool.length < Q_PER_STAGE) {
    state.used.clear();
    pool = [...WORDS];
  }
  const picked = shuffle(pool).slice(0, Q_PER_STAGE);
  picked.forEach((w) => state.used.add(w.en));
  return picked.map((w) => {
    const wrongs = shuffle(WORDS.filter((x) => x.ja !== w.ja)).slice(0, 3).map((x) => x.ja);
    return { en: w.en, ja: w.ja, choices: shuffle([w.ja, ...wrongs]) };
  });
}
function updateHud() {
  const st = STAGES[state.stage - 1];
  $("hud-stage").textContent = `${st.icon} STAGE ${state.stage} ${st.name}`;
  $("hud-diff").textContent = state.diff.name;
  $("hud-q").textContent = `Q ${Math.min(state.qi + 1, Q_PER_STAGE)}/${Q_PER_STAGE}`;
  const pct = (state.hp / MAX_HP) * 100;
  const fill = $("hp-fill");
  fill.style.width = pct + "%";
  fill.className = pct > 50 ? "" : pct > 25 ? "mid" : "low";
  $("hp-text").textContent = `HP ${state.hp}/${MAX_HP}`;
}
function showQuestion() {
  const q = state.qs[state.qi];
  $("hud-q").textContent = `Q ${state.qi + 1}/${Q_PER_STAGE}`;
  $("question-word").textContent = q.en;
  $("feedback").innerHTML = "&nbsp;";
  const box = $("choices");
  box.innerHTML = "";
  q.choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = c;
    b.onclick = () => onAnswer(b, c);
    box.appendChild(b);
  });
}
function onAnswer(btn, choice) {
  ensureAudio();
  const q = state.qs[state.qi];
  document.querySelectorAll(".choice").forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.ja) b.classList.add("is-correct");
  });
  if (choice === q.ja) {
    state.stats.correct++;
    state.stageCorrect++;
    sfx.correct();
    $("feedback").textContent = "⭕ せいかい！";
    setTimeout(nextQuestion, 700);
  } else {
    state.stats.wrong++;
    btn.classList.add("is-wrong");
    $("feedback").textContent = `❌ 正解は「${q.ja}」`;
    setTimeout(doPunch, 550);
  }
}
function nextQuestion() {
  state.qi++;
  if (state.qi >= Q_PER_STAGE) stageClear();
  else showQuestion();
}

// ---------- パンチ演出 ----------
function doPunch() {
  const isJ = Math.random() < 0.65;
  const atk = isJ ? ATTACKERS.j : ATTACKERS.totsuka;
  const dmg = isJ ? state.diff.jDmg : state.diff.tDmg;
  if (isJ) state.stats.jHits++;
  else state.stats.tHits++;

  const ov = $("punch-overlay");
  $("punch-face").textContent = atk.face;
  $("punch-name").textContent = atk.hitLines[Math.floor(Math.random() * atk.hitLines.length)];
  const dmgEl = $("punch-dmg");
  dmgEl.textContent = "";
  ov.classList.toggle("totsuka", !isJ);
  ov.classList.remove("hidden");

  const fist = $("punch-fist");
  fist.classList.remove("go");
  void fist.offsetWidth;
  fist.classList.add("go");
  if (isJ) sfx.punchJ();
  else sfx.punchT();

  setTimeout(() => {
    state.hp = Math.max(0, state.hp - dmg);
    updateHud();
    dmgEl.textContent = `-${dmg}`;
    dmgEl.classList.remove("pop");
    void dmgEl.offsetWidth;
    dmgEl.classList.add("pop");
    const cls = isJ ? "shake" : "shake-hard";
    document.body.classList.remove("shake", "shake-hard");
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    triggerFlash();
  }, 320);

  setTimeout(() => {
    ov.classList.add("hidden");
    document.body.classList.remove("shake", "shake-hard");
    if (state.hp <= 0) onDead(atk);
    else nextQuestion();
  }, 1550);
}
function triggerFlash() {
  const f = $("flash");
  f.classList.remove("hit");
  void f.offsetWidth;
  f.classList.add("hit");
}

// ---------- 死亡・リスポーン ----------
function onDead(atk) {
  state.stats.deaths++;
  sfx.dead();
  setTheme("theme-dead");
  $("dead-face").textContent = atk.face;
  $("dead-msg").innerHTML = `${atk.name}の一撃で意識が飛んだ……<br>気がつくとセーブポイントにいた。`;
  $("btn-respawn").textContent = `🚩 ステージ${state.saveStage}からやり直す`;
  showScreen("screen-dead");
}
function respawn() {
  state.hp = MAX_HP;
  state.stage = state.saveStage;
  goMap("🚩 セーブポイントに戻された……もう一度挑戦だ！");
}

// ---------- ステージクリア・エンディング ----------
function stageClear() {
  const clearedStage = state.stage;
  if (clearedStage >= STAGES.length) {
    ending();
    return;
  }
  sfx.clear();
  const next = clearedStage + 1;
  let msg;
  if (state.diff.saves.includes(next)) {
    state.saveStage = next;
    state.hp = MAX_HP;
    writeSave();
    sfx.save();
    msg = "🚩 セーブポイントに到達！ HPが全回復した！";
  } else {
    state.hp = Math.min(MAX_HP, state.hp + 20);
    msg = "HPが20回復した。次のセーブポイントはまだ先だ……";
  }
  state.stage = next;
  $("clear-title").textContent = `STAGE ${clearedStage} クリア！`;
  $("clear-detail").innerHTML = `${state.stageCorrect}/${Q_PER_STAGE} 問正解！<br>${msg}`;
  setTheme("theme-map");
  showScreen("screen-clear");
}
function ending() {
  clearSave();
  sfx.save();
  setTheme("theme-ending");
  const s = state.stats;
  const total = s.correct + s.wrong;
  const acc = total ? Math.round((s.correct / total) * 100) : 0;
  let title;
  if (s.deaths === 0 && s.wrong === 0) title = "👑 伝説の単語マスター（無傷の帰還）";
  else if (s.deaths === 0) title = "🏆 単語マスター";
  else if (s.tHits >= 5) title = "🥊 戸塚のサンドバッグ";
  else if (acc >= 80) title = "⚔️ 歴戦の冒険者";
  else title = "🩹 ボロボロの生還者";
  $("ending-title-badge").textContent = `称号：${title}`;
  $("ending-stats").innerHTML =
    `正解率：${acc}%（${s.correct}/${total}問）<br>` +
    `😎 Jに殴られた回数：${s.jHits}回<br>` +
    `👹 戸塚に殴られた回数：${s.tHits}回<br>` +
    `💀 死亡回数：${s.deaths}回`;
  showScreen("screen-ending");
}

// ---------- イベント登録 ----------
window.addEventListener("DOMContentLoaded", () => {
  $("btn-new").onclick = () => { ensureAudio(); showScreen("screen-diff"); };
  $("btn-continue").onclick = () => {
    ensureAudio();
    const s = readSave();
    if (s) startGame(s.diffKey, s.saveStage);
  };
  document.querySelectorAll(".diff-btn").forEach((b) => {
    b.onclick = () => { ensureAudio(); startGame(b.dataset.diff, 1); };
  });
  $("btn-start-stage").onclick = () => startStage();
  $("btn-clear-next").onclick = () => goMap("");
  $("btn-respawn").onclick = () => respawn();
  $("btn-ending-title").onclick = () => initTitle();
  initTitle();
});
